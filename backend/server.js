import http from 'node:http';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { db, hashPassword } from './db.js';

const PORT = Number(process.env.PORT || 4000);
const allowedTables = new Set(['events','posts','rewards','companies','users','employees']);
const editable = {
  events: ['creator_id','title','description','location','starts_at','ends_at','capacity','attendance_code','status','featured','admin_feedback'],
  posts: ['author_id','title','body','category','image_url','status','featured','admin_feedback'],
  rewards: ['name','description','points_cost','inventory','active','expires_at'],
  companies: ['owner_id','name','category','description','website','phone','address','status','featured','admin_feedback'],
  users: ['first_name','last_name','email','role','status','avatar_url','bio','points','business_tier'],
  employees: ['user_id','company_id','title','status','admin_feedback']
};
const publicUser = `id,first_name,last_name,email,role,status,avatar_url,bio,points,business_tier,created_at,updated_at`;
const send = (res, status, data) => { res.writeHead(status, {'Content-Type':'application/json'}); res.end(JSON.stringify(data)); };
const tokenHash = (token) => createHash('sha256').update(token).digest('hex');
const log = (actor, action, type, id, details='') => db.prepare('INSERT INTO activity_log(actor_id,action,entity_type,entity_id,details) VALUES(?,?,?,?,?)').run(actor,action,type,id,details);
function auth(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  if (!token) return null;
  return db.prepare(`SELECT users.id,users.first_name,users.last_name,users.email,users.role,users.status,users.avatar_url,users.bio,users.points,users.business_tier,users.created_at,users.updated_at FROM users JOIN sessions ON users.id=sessions.user_id WHERE sessions.token_hash=? AND sessions.expires_at > datetime('now')`).get(tokenHash(token));
}
function verify(password, encoded) {
  const [salt, saved] = encoded.split(':');
  const actual = scryptSync(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(saved, 'hex'));
}
async function body(req) {
  let raw=''; for await (const chunk of req) { raw += chunk; if (raw.length > 1e6) throw new Error('Request too large'); }
  return raw ? JSON.parse(raw) : {};
}
function fields(table, payload) { return Object.fromEntries(Object.entries(payload).filter(([key,value]) => editable[table].includes(key) && value !== undefined)); }

const server = http.createServer(async (req,res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_ORIGIN || 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return send(res,204,{});
  const url = new URL(req.url, `http://${req.headers.host}`); const path = url.pathname; const user = auth(req);
  try {
    if (path === '/api/health') return send(res,200,{status:'ok'});
    if (path === '/api/auth/register' && req.method === 'POST') {
      const data=await body(req); if (!data.firstName || !data.lastName || !data.email || String(data.password||'').length < 8) return send(res,400,{error:'Name, email, and an 8-character password are required.'});
      const result=db.prepare('INSERT INTO users(first_name,last_name,email,password_hash) VALUES(?,?,?,?)').run(data.firstName.trim(),data.lastName.trim(),data.email.trim().toLowerCase(),hashPassword(data.password));
      log(result.lastInsertRowid,'registered','user',result.lastInsertRowid); return createSession(res,result.lastInsertRowid);
    }
    if (path === '/api/auth/login' && req.method === 'POST') {
      const data=await body(req); const record=db.prepare('SELECT * FROM users WHERE email=?').get(String(data.email||'').trim().toLowerCase());
      if (!record || !verify(String(data.password||''),record.password_hash)) return send(res,401,{error:'Invalid email or password.'});
      if (record.status !== 'active') return send(res,403,{error:'This account is not active.'});
      log(record.id,'signed_in','user',record.id); return createSession(res,record.id);
    }
    if (path === '/api/auth/me' && req.method === 'GET') return user ? send(res,200,{user}) : send(res,401,{error:'Not signed in.'});
    if (path === '/api/auth/logout' && req.method === 'POST') { const token=(req.headers.authorization||'').replace(/^Bearer /,''); if(token) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(tokenHash(token)); return send(res,200,{ok:true}); }
    if (path === '/api/profile/business-application' && req.method === 'POST') {
      if (!user) return send(res,401,{error:'Sign in first.'}); const data=await body(req);
      if (!data.name || !data.category) return send(res,400,{error:'Business name and category are required.'});
      const result=db.prepare(`INSERT INTO companies(owner_id,name,category,description,website,phone,address) VALUES(?,?,?,?,?,?,?)`).run(user.id,data.name,data.category,data.description||'',data.website||'',data.phone||'',data.address||'');
      db.prepare("UPDATE users SET business_tier='pending',updated_at=CURRENT_TIMESTAMP WHERE id=?").run(user.id); log(user.id,'applied','company',result.lastInsertRowid); return send(res,201,{ok:true,id:Number(result.lastInsertRowid)});
    }
    if (path === '/api/dashboard/summary' && req.method === 'GET') {
      if (!user || !['admin','board'].includes(user.role)) return send(res,403,{error:'Admin access required.'});
      const counts=Object.fromEntries([...allowedTables].map(t=>[t,db.prepare(`SELECT COUNT(*) count FROM ${t}`).get().count]));
      const pending={posts:db.prepare("SELECT COUNT(*) count FROM posts WHERE status='pending'").get().count,events:db.prepare("SELECT COUNT(*) count FROM events WHERE status='pending'").get().count,businesses:db.prepare("SELECT COUNT(*) count FROM companies WHERE status='pending'").get().count,employees:db.prepare("SELECT COUNT(*) count FROM employees WHERE status='pending'").get().count};
      const activity=db.prepare('SELECT activity_log.*, users.first_name, users.last_name FROM activity_log LEFT JOIN users ON users.id=actor_id ORDER BY activity_log.id DESC LIMIT 8').all();
      return send(res,200,{counts,pending,activity});
    }
    const match=path.match(/^\/api\/(events|posts|rewards|companies|users|employees)(?:\/(\d+))?$/);
    if (match && allowedTables.has(match[1])) {
      const [_,table,id]=match;
      if (req.method === 'GET') {
        if (table === 'users' && (!user || !['admin','board'].includes(user.role))) return send(res,403,{error:'Admin access required.'});
        const where=id?' WHERE id=?':''; const query=`SELECT ${table==='users'?publicUser:'*'} FROM ${table}${where} ORDER BY id DESC`;
        const result=id?db.prepare(query).get(Number(id)):db.prepare(query).all(); return result ? send(res,200,result) : send(res,404,{error:'Not found.'});
      }
      if (!user || !['admin','board'].includes(user.role)) return send(res,403,{error:'Admin access required.'});
      if (req.method === 'POST') { const data=fields(table,await body(req)); if(table==='users') data.password_hash=hashPassword('Welcome123!'); const keys=Object.keys(data); if(!keys.length) return send(res,400,{error:'No valid fields.'}); const result=db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`).run(...Object.values(data)); log(user.id,'created',table,Number(result.lastInsertRowid)); return send(res,201,{id:Number(result.lastInsertRowid)}); }
      if (req.method === 'PATCH' && id) { const data=fields(table,await body(req)); const keys=Object.keys(data); if(!keys.length) return send(res,400,{error:'No valid fields.'}); db.prepare(`UPDATE ${table} SET ${keys.map(k=>`${k}=?`).join(',')},updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(...Object.values(data),Number(id)); log(user.id,'updated',table,Number(id)); return send(res,200,{ok:true}); }
      if (req.method === 'DELETE' && id) { db.prepare(`DELETE FROM ${table} WHERE id=?`).run(Number(id)); log(user.id,'deleted',table,Number(id)); return send(res,200,{ok:true}); }
    }
    return send(res,404,{error:'Route not found.'});
  } catch (error) { console.error(error); const conflict=String(error.message).includes('UNIQUE'); return send(res,conflict?409:500,{error:conflict?'That email or unique value is already in use.':'The server could not complete the request.'}); }
});

function createSession(res,userId) { const token=randomBytes(32).toString('hex'); db.prepare("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,datetime('now','+7 days'))").run(tokenHash(token),userId); const user=db.prepare(`SELECT ${publicUser} FROM users WHERE id=?`).get(userId); return send(res,200,{token,user}); }
server.listen(PORT,()=>console.log(`Impact Arlington API listening on http://localhost:${PORT}`));
