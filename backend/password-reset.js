import { createHash, randomBytes } from 'node:crypto';
import { db, hashPassword } from './db.js';

const digest=value=>createHash('sha256').update(value).digest('hex');
const genericMessage='If an active account uses this email, you’ll receive a password reset link. The link expires in 30 minutes.';

function limited(key,max,seconds) {
  const now=Date.now();
  db.prepare('DELETE FROM auth_rate_limits WHERE window_start<?').run(now-3600000);
  const record=db.prepare('SELECT * FROM auth_rate_limits WHERE key=?').get(key);
  if(!record || now-record.window_start>=seconds*1000){db.prepare('INSERT INTO auth_rate_limits(key,window_start,attempts) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET window_start=excluded.window_start,attempts=1').run(key,now);return false;}
  if(record.attempts>=max)return true;
  db.prepare('UPDATE auth_rate_limits SET attempts=attempts+1 WHERE key=?').run(key);
  return false;
}

function resetOrigin() {
  const raw=process.env.PASSWORD_RESET_URL || (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',')[0].trim();
  const url=new URL(raw);
  if(!['http:','https:'].includes(url.protocol) || url.username || url.password || (process.env.NODE_ENV==='production' && url.protocol!=='https:')) throw new Error('Invalid password reset URL configuration.');
  url.search='';url.hash='';
  return url;
}

async function deliverReset(email,url) {
  if(!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    if(process.env.NODE_ENV==='development'){console.info(`Development password reset link: ${url}`);return;}
    throw new Error('Password reset email delivery is not configured.');
  }
  // The endpoint override is confined to isolated tests; production always uses Resend.
  const endpoint=process.env.NODE_ENV==='test' && process.env.PASSWORD_RESET_TEST_EMAIL_URL || 'https://api.resend.com/emails';
  const response=await fetch(endpoint,{
    method:'POST',signal:AbortSignal.timeout(10000),
    headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify({from:process.env.EMAIL_FROM,to:[email],subject:'Reset your Impact Arlington password',text:`We received a request to reset your Impact Arlington password.\n\nChoose a new password using this link:\n${url}\n\nThis link expires in 30 minutes and can be used once. If you didn’t request this, you can ignore this email. Your password stays the same until you reset it.`}),
  });
  if(!response.ok)throw new Error('Password reset email could not be delivered.');
}

export async function handlePasswordReset(req,res,path,{send,body}) {
  if(!['/api/auth/forgot-password','/api/auth/reset-password'].includes(path))return false;
  res.setHeader('Cache-Control','no-store');
  const reply=(status,data)=>{send(res,status,data);return true;};
  if(req.method!=='POST')return reply(405,{error:'Method not allowed.'});
  // Use the socket address, never an untrusted forwarded header.
  const ip=req.socket.remoteAddress || 'unknown';
  if(limited(digest(`${path}:${ip}`),30,900))return reply(429,{error:'Too many attempts. Please try again in 15 minutes.'});
  const data=await body(req,10000);
  if(path==='/api/auth/forgot-password') {
    const email=typeof data.email==='string'?data.email.trim().toLowerCase():'';
    if(email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return reply(400,{error:'Enter a valid email address.'});
    if(limited(digest(`password-reset:${email}`),5,3600))return reply(429,{error:'Too many reset requests. Please try again in an hour.'});
    let url;
    try{
      url=resetOrigin();
      if((!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) && process.env.NODE_ENV!=='development')throw new Error('Email is not configured.');
    }catch{return reply(503,{error:'Password reset is temporarily unavailable. Please contact support.'});}
    db.prepare('DELETE FROM password_resets WHERE expires_at<=?').run(Date.now());
    const account=db.prepare("SELECT id,email FROM users WHERE email=? AND status='active'").get(email);
    if(account) {
      const token=randomBytes(32).toString('hex');
      const tokenHash=digest(token);
      // A URL fragment keeps the secret out of HTTP requests and referrer headers.
      url.hash=new URLSearchParams({'reset-password':token}).toString();
      db.prepare('INSERT INTO password_resets(token_hash,user_id,expires_at) VALUES(?,?,?)').run(tokenHash,account.id,Date.now()+30*60*1000);
      try{await deliverReset(account.email,url.toString());}
      catch{db.prepare('DELETE FROM password_resets WHERE token_hash=?').run(tokenHash);console.error('Password reset email delivery failed.');}
    }
    return reply(200,{message:genericMessage});
  }
  const token=typeof data.token==='string'?data.token:'';
  if(!/^[a-f0-9]{64}$/.test(token))return reply(400,{error:'This reset link is invalid or expired. Request a new link.'});
  if(typeof data.password!=='string' || data.password.length<8 || data.password.length>128)return reply(400,{error:'Choose a password between 8 and 128 characters.'});
  const tokenHash=digest(token);
  db.exec('BEGIN IMMEDIATE');
  try{
    const reset=db.prepare("SELECT password_resets.user_id FROM password_resets JOIN users ON users.id=user_id WHERE token_hash=? AND expires_at>? AND users.status='active'").get(tokenHash,Date.now());
    if(!reset){db.exec('ROLLBACK');return reply(400,{error:'This reset link is invalid or expired. Request a new link.'});}
    db.prepare('UPDATE users SET password_hash=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(hashPassword(data.password),reset.user_id);
    db.prepare('DELETE FROM password_resets WHERE user_id=?').run(reset.user_id);
    db.prepare('DELETE FROM sessions WHERE user_id=?').run(reset.user_id);
    db.prepare("INSERT INTO activity_log(actor_id,action,entity_type,entity_id) VALUES(?,'reset password','user',?)").run(reset.user_id,reset.user_id);
    db.exec('COMMIT');
  }catch(error){db.exec('ROLLBACK');throw error;}
  return reply(200,{message:'Password updated. Sign in with your new password.'});
}
