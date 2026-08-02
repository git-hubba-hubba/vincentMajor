import http from 'node:http';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { db, hashPassword } from './db.js';
import { persistImage } from './storage.js';
import { scheduleBackups } from './backup.js';

const PORT = Number(process.env.PORT || 4000);
const allowedOrigins = new Set((process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((origin)=>origin.trim()).filter(Boolean));
const allowedTables = new Set(['events','posts','rewards','companies','users','employees']);
const editable = {
  events: ['creator_id','title','description','category','image_url','location','starts_at','ends_at','capacity','attendance_code','points_awarded','status','featured','admin_feedback'],
  posts: ['author_id','title','body','category','image_url','status','featured','admin_feedback'],
  rewards: ['name','description','points_cost','inventory','active','expires_at'],
  companies: ['owner_id','name','category','description','image_url','website','phone','address','status','featured','verified','spotlight_position','admin_feedback'],
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
  let raw=''; for await (const chunk of req) { raw += chunk; if (raw.length > 4e6) throw new Error('Request too large'); }
  return raw ? JSON.parse(raw) : {};
}
function fields(table, payload) { return Object.fromEntries(Object.entries(payload).filter(([key,value]) => editable[table].includes(key) && value !== undefined)); }

const server = http.createServer(async (req,res) => {
  const origin=req.headers.origin;
  if(origin && allowedOrigins.has(origin)) { res.setHeader('Access-Control-Allow-Origin',origin); res.setHeader('Vary','Origin'); }
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'");
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
    if (path === '/api/profile' && req.method === 'PATCH') {
      if (!user) return send(res,401,{error:'Sign in first.'});
      const data=await body(req); const firstName=String(data.first_name||'').trim(); const lastName=String(data.last_name||'').trim(); const email=String(data.email||'').trim().toLowerCase(); const bio=String(data.bio||'').trim(); let avatar=data.avatar_url || null;
      if (!firstName || !lastName || !email) return send(res,400,{error:'First name, last name, and email are required.'});
      if (bio.length > 500) return send(res,400,{error:'Bio must be 500 characters or fewer.'});
      if (avatar && (!String(avatar).startsWith('data:image/') || String(avatar).length > 3e6)) return send(res,400,{error:'Profile image must be a supported image under 2 MB.'});
      avatar=await persistImage(avatar,'impact-arlington/profiles');
      db.prepare('UPDATE users SET first_name=?,last_name=?,email=?,bio=?,avatar_url=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(firstName,lastName,email,bio,avatar,user.id);
      log(user.id,'updated','profile',user.id); const updated=db.prepare(`SELECT ${publicUser} FROM users WHERE id=?`).get(user.id); return send(res,200,{user:updated});
    }
    if (path === '/api/profile/business-application' && req.method === 'POST') {
      if (!user) return send(res,401,{error:'Sign in first.'}); const data=await body(req);
      if (!data.name || !data.category) return send(res,400,{error:'Business name and category are required.'});
      let image=data.image_url||'/images/impDirectory.png'; if(image.startsWith('data:') && (!image.startsWith('data:image/') || image.length>3e6)) return send(res,400,{error:'Business image must be a supported image under 2 MB.'}); image=await persistImage(image,'impact-arlington/businesses');
      const result=db.prepare(`INSERT INTO companies(owner_id,name,category,description,image_url,website,phone,address) VALUES(?,?,?,?,?,?,?,?)`).run(user.id,data.name,data.category,data.description||'',image,data.website||'',data.phone||'',data.address||'');
      db.prepare("UPDATE users SET business_tier='pending',updated_at=CURRENT_TIMESTAMP WHERE id=?").run(user.id); log(user.id,'applied','company',result.lastInsertRowid); return send(res,201,{ok:true,id:Number(result.lastInsertRowid)});
    }
    if (path === '/api/profile/events' && req.method === 'GET') {
      if (!user) return send(res,401,{error:'Sign in first.'});
      const saved=db.prepare(`SELECT events.id,events.title,events.starts_at,events.location FROM saved_events JOIN events ON events.id=saved_events.event_id WHERE saved_events.user_id=? ORDER BY events.starts_at`).all(user.id);
      const attended=db.prepare(`SELECT events.id,events.title,events.starts_at,events.points_awarded FROM event_registrations JOIN events ON events.id=event_registrations.event_id WHERE event_registrations.user_id=? AND event_registrations.attended=1 ORDER BY events.starts_at DESC`).all(user.id);
      return send(res,200,{saved,attended});
    }
    if (path === '/api/community-events' && req.method === 'GET') {
      const viewer=user?.id || 0;
      const events=db.prepare(`SELECT events.id,events.title,events.description,events.category,events.image_url,events.location,events.starts_at,events.ends_at,events.capacity,events.points_awarded,events.featured,
        (SELECT COUNT(*) FROM event_registrations WHERE event_id=events.id) attendee_count,
        (SELECT COUNT(*) FROM event_likes WHERE event_id=events.id) like_count,
        EXISTS(SELECT 1 FROM event_registrations WHERE event_id=events.id AND user_id=?) registered,
        EXISTS(SELECT 1 FROM saved_events WHERE event_id=events.id AND user_id=?) saved,
        EXISTS(SELECT 1 FROM event_likes WHERE event_id=events.id AND user_id=?) liked,
        EXISTS(SELECT 1 FROM event_registrations WHERE event_id=events.id AND user_id=? AND attended=1) attended
        FROM events WHERE status='approved' ORDER BY featured DESC,starts_at`).all(viewer,viewer,viewer,viewer);
      const comments=db.prepare(`SELECT event_comments.id,event_comments.body,event_comments.created_at,users.first_name,users.last_name,users.avatar_url FROM event_comments JOIN users ON users.id=event_comments.user_id WHERE event_comments.event_id=? ORDER BY event_comments.id DESC LIMIT 6`);
      return send(res,200,events.map((event)=>({...event,comments:comments.all(event.id)})));
    }
    if (path === '/api/community-events' && req.method === 'POST') {
      const canCreate=user && (['admin','board'].includes(user.role) || user.business_tier==='premium');
      if (!canCreate) return send(res,403,{error:'Only administrators and approved Business Accounts can create events.'});
      const data=await body(req); if(!data.title || !data.description || !data.location || !data.starts_at) return send(res,400,{error:'Title, description, location, and start date are required.'});
      const status=['admin','board'].includes(user.role)?'approved':'pending'; const code=String(data.attendance_code||randomBytes(4).toString('hex')).trim().toUpperCase();
      const result=db.prepare(`INSERT INTO events(creator_id,title,description,category,image_url,location,starts_at,ends_at,capacity,attendance_code,points_awarded,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`).run(user.id,data.title,data.description,data.category||'Community',data.image_url||'',data.location,data.starts_at,data.ends_at||null,data.capacity||null,code,Number(data.points_awarded)||100,status);
      log(user.id,'created','event',Number(result.lastInsertRowid),status); return send(res,201,{id:Number(result.lastInsertRowid),status,attendance_code:code});
    }
    if (path === '/api/directory' && req.method === 'GET') {
      const businesses=db.prepare(`SELECT id,name,category,description,image_url,website,phone,address,verified,spotlight_position,created_at FROM companies WHERE status='approved' ORDER BY category,CASE WHEN spotlight_position IS NULL THEN 1 ELSE 0 END,spotlight_position,name`).all();
      return send(res,200,businesses);
    }
    const eventAction=path.match(/^\/api\/events\/(\d+)\/(register|save|like|comment|attendance)$/);
    if (eventAction && req.method === 'POST') {
      if (!user) return send(res,401,{error:'Sign in to interact with events.'});
      const eventId=Number(eventAction[1]); const action=eventAction[2]; const event=db.prepare("SELECT * FROM events WHERE id=? AND status='approved'").get(eventId);
      if (!event) return send(res,404,{error:'Event not found.'});
      if (action === 'register') {
        const existing=db.prepare('SELECT attended FROM event_registrations WHERE user_id=? AND event_id=?').get(user.id,eventId);
        if(existing) return send(res,200,{registered:true,attended:Boolean(existing.attended)});
        db.prepare('INSERT INTO event_registrations(user_id,event_id) VALUES(?,?)').run(user.id,eventId); log(user.id,'registered','event',eventId); return send(res,201,{registered:true});
      }
      if (action === 'save' || action === 'like') {
        const table=action==='save'?'saved_events':'event_likes'; const exists=db.prepare(`SELECT 1 FROM ${table} WHERE user_id=? AND event_id=?`).get(user.id,eventId);
        if(exists) db.prepare(`DELETE FROM ${table} WHERE user_id=? AND event_id=?`).run(user.id,eventId); else db.prepare(`INSERT INTO ${table}(user_id,event_id) VALUES(?,?)`).run(user.id,eventId);
        return send(res,200,{active:!exists});
      }
      if (action === 'comment') {
        const data=await body(req); const comment=String(data.body||'').trim(); if(!comment || comment.length>500) return send(res,400,{error:'Comment must be between 1 and 500 characters.'});
        const result=db.prepare('INSERT INTO event_comments(event_id,user_id,body) VALUES(?,?,?)').run(eventId,user.id,comment); log(user.id,'commented','event',eventId); return send(res,201,{id:Number(result.lastInsertRowid)});
      }
      if (action === 'attendance') {
        const data=await body(req); if(String(data.code||'').trim().toUpperCase() !== String(event.attendance_code).toUpperCase()) return send(res,400,{error:'That attendance code is not valid for this event.'});
        const prior=db.prepare('SELECT attended FROM event_registrations WHERE user_id=? AND event_id=?').get(user.id,eventId); if(prior?.attended) return send(res,409,{error:'You already earned points for this event.'});
        db.exec('BEGIN');
        try {
          db.prepare(`INSERT INTO event_registrations(user_id,event_id,attended) VALUES(?,?,1) ON CONFLICT(user_id,event_id) DO UPDATE SET attended=1`).run(user.id,eventId);
          db.prepare('UPDATE users SET points=points+?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(event.points_awarded,user.id);
          db.prepare('INSERT INTO notifications(user_id,type,message) VALUES(?,?,?)').run(user.id,'reward',`You earned ${event.points_awarded} points at ${event.title}.`);
          log(user.id,'attended','event',eventId,`${event.points_awarded} points`); db.exec('COMMIT');
        } catch(error) { db.exec('ROLLBACK'); throw error; }
        const updated=db.prepare(`SELECT ${publicUser} FROM users WHERE id=?`).get(user.id); return send(res,200,{message:`Attendance confirmed! You earned ${event.points_awarded} points.`,user:updated,event:{id:event.id,title:event.title,points_awarded:event.points_awarded}});
      }
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
        if (['users','events'].includes(table) && (!user || !['admin','board'].includes(user.role))) return send(res,403,{error:'Admin access required.'});
        const where=id?' WHERE id=?':''; const query=`SELECT ${table==='users'?publicUser:'*'} FROM ${table}${where} ORDER BY id DESC`;
        const result=id?db.prepare(query).get(Number(id)):db.prepare(query).all(); return result ? send(res,200,result) : send(res,404,{error:'Not found.'});
      }
      if (!user || !['admin','board'].includes(user.role)) return send(res,403,{error:'Admin access required.'});
      if (req.method === 'POST') { const payload=await body(req); const data=fields(table,payload); if(table==='users') data.password_hash=hashPassword(String(payload.password||randomBytes(18).toString('base64url'))); if(table==='companies'&&data.image_url) data.image_url=await persistImage(data.image_url,'impact-arlington/businesses'); const keys=Object.keys(data); if(!keys.length) return send(res,400,{error:'No valid fields.'}); const result=db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(()=>'?').join(',')})`).run(...Object.values(data)); log(user.id,'created',table,Number(result.lastInsertRowid)); return send(res,201,{id:Number(result.lastInsertRowid)}); }
      if (req.method === 'PATCH' && id) {
        const data=fields(table,await body(req));
        if(table==='companies') {
          const current=db.prepare('SELECT * FROM companies WHERE id=?').get(Number(id)); if(!current) return send(res,404,{error:'Business not found.'});
          if(data.image_url && data.image_url.startsWith('data:') && (!data.image_url.startsWith('data:image/') || data.image_url.length>3e6)) return send(res,400,{error:'Business image must be a supported image under 2 MB.'});
          if(data.image_url) data.image_url=await persistImage(data.image_url,'impact-arlington/businesses');
          if(data.status && data.status!=='approved') { data.spotlight_position=null; data.featured=0; }
          if(data.spotlight_position!==undefined && data.spotlight_position!==null && data.spotlight_position!=='') {
            const position=Number(data.spotlight_position); if(!Number.isInteger(position) || position<1 || position>5) return send(res,400,{error:'Spotlight position must be between 1 and 5.'});
            if((data.status||current.status)!=='approved') return send(res,400,{error:'Approve the business before assigning a spotlight slot.'});
            const category=data.category||current.category; const occupied=db.prepare('SELECT id,name FROM companies WHERE category=? AND spotlight_position=? AND id<>?').get(category,position,Number(id));
            if(occupied) return send(res,409,{error:`Spotlight slot ${position} is already assigned to ${occupied.name}.`}); data.spotlight_position=position; data.featured=1;
          } else if(data.spotlight_position!==undefined) { data.spotlight_position=null; data.featured=0; }
        }
        const keys=Object.keys(data); if(!keys.length) return send(res,400,{error:'No valid fields.'}); db.prepare(`UPDATE ${table} SET ${keys.map(k=>`${k}=?`).join(',')},updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(...Object.values(data),Number(id));
        if(table==='companies' && data.status) { const company=db.prepare('SELECT owner_id FROM companies WHERE id=?').get(Number(id)); if(company) db.prepare('UPDATE users SET business_tier=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(data.status==='approved'?'premium':data.status,company.owner_id); }
        log(user.id,'updated',table,Number(id)); return send(res,200,{ok:true});
      }
      if (req.method === 'DELETE' && id) { db.prepare(`DELETE FROM ${table} WHERE id=?`).run(Number(id)); log(user.id,'deleted',table,Number(id)); return send(res,200,{ok:true}); }
    }
    return send(res,404,{error:'Route not found.'});
  } catch (error) { console.error(error); const conflict=String(error.message).includes('UNIQUE'); return send(res,conflict?409:500,{error:conflict?'That email or unique value is already in use.':'The server could not complete the request.'}); }
});

function createSession(res,userId) { const token=randomBytes(32).toString('hex'); db.prepare("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,datetime('now','+7 days'))").run(tokenHash(token),userId); const user=db.prepare(`SELECT ${publicUser} FROM users WHERE id=?`).get(userId); return send(res,200,{token,user}); }
scheduleBackups();
server.listen(PORT,'0.0.0.0',()=>console.log(`Impact Arlington API listening on 0.0.0.0:${PORT}`));
