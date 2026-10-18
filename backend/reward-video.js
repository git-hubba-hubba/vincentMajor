import { randomBytes } from 'node:crypto';
import { db } from './db.js';
import { persistVideo } from './storage.js';

export async function handleRewardVideo(req,res,path,user,{send,body,publicUser}) {
  if(!['/api/reward-video','/api/reward-video/start','/api/reward-video/progress'].includes(path)) return false;
  const reply=(status,data)=>{send(res,status,data);return true;};
  const video=db.prepare('SELECT * FROM reward_video WHERE id=1').get();
  const claimed=user && Boolean(db.prepare("SELECT 1 FROM incentive_claims WHERE user_id=? AND incentive_id='video'").get(user.id));
  if(path==='/api/reward-video' && req.method==='GET') return reply(200,{video:video || null,claimed:Boolean(claimed)});
  if(path==='/api/reward-video' && req.method==='POST') {
    if(user?.role!=='admin') return reply(403,{error:'Administrator access required to upload a reward video.'});
    const data=await body(req,30e6);
    const title=typeof data.title==='string'?data.title.trim():'';
    if(!title || title.length>150 || !Number.isInteger(data.points) || data.points<1 || data.points>10000) return reply(400,{error:'Enter a title and a point value between 1 and 10,000.'});
    if(typeof data.video!=='string' || !/^data:video\/(mp4|webm);base64,[A-Za-z0-9+/=]+$/.test(data.video) || data.video.length>28e6 || !Number.isFinite(data.duration) || data.duration<=0 || data.duration>3600) return reply(400,{error:'Upload an MP4 or WebM video up to 20 MB and one hour long.'});
    const stored=await persistVideo(data.video,data.duration);
    if(stored.duration>3600) return reply(400,{error:'Videos must be one hour or shorter.'});
    const version=randomBytes(16).toString('hex');
    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare('INSERT INTO reward_video(id,version,title,video_url,duration,points) VALUES(1,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET version=excluded.version,title=excluded.title,video_url=excluded.video_url,duration=excluded.duration,points=excluded.points').run(version,title,stored.url,stored.duration,data.points);
      db.prepare('DELETE FROM reward_video_sessions').run();
      db.exec('COMMIT');
    } catch(error){db.exec('ROLLBACK');throw error;}
    return reply(200,{message:'Reward video published. Each profile can earn the video bonus once, including across replacement videos.'});
  }
  if(req.method!=='POST') return reply(405,{error:'Method not allowed.'});
  if(!user) return reply(401,{error:'Sign in to earn video points.'});
  if(!video) return reply(404,{error:'No reward video is available yet.'});
  if(claimed) return reply(409,{error:'You already earned your video reward.'});
  const now=Date.now()/1000;
  if(path==='/api/reward-video/start') {
    const token=randomBytes(24).toString('hex');
    db.prepare('INSERT INTO reward_video_sessions(user_id,token,version,started_at,last_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET token=excluded.token,version=excluded.version,started_at=excluded.started_at,last_at=excluded.last_at,position=0,watched=0').run(user.id,token,video.version,now,now);
    return reply(200,{token,version:video.version});
  }
  const data=await body(req);
  const session=db.prepare('SELECT * FROM reward_video_sessions WHERE user_id=?').get(user.id);
  if(!session || session.token!==data.token || session.version!==video.version) return reply(409,{error:'The video session changed. Start the video again.'});
  const position=data.position;
  if(!Number.isFinite(position) || position<0 || position>video.duration+1) return reply(400,{error:'Invalid video position.'});
  const delta=position-session.position;
  const elapsed=now-session.last_at;
  // Only credit contiguous playback at normal speed, backed by server elapsed time.
  if(delta<-.5 || delta>elapsed+1 || delta>8) return reply(409,{error:'Watch the video from start to finish without skipping. Start again to earn points.'});
  const watched=Math.min(video.duration,Math.max(session.watched,Math.min(position,now-session.started_at)));
  db.prepare('UPDATE reward_video_sessions SET position=?,watched=?,last_at=? WHERE user_id=?').run(position,watched,now,user.id);
  if(data.complete!==true) return reply(200,{watched,awarded:false});
  if(position<video.duration-.15 || watched<video.duration-.25 || now-session.started_at<video.duration-.15) return reply(409,{error:'Finish watching the whole video to receive your points.'});
  db.exec('BEGIN IMMEDIATE');
  try {
    const result=db.prepare("INSERT OR IGNORE INTO incentive_claims(user_id,incentive_id,points_awarded) VALUES(?,'video',?)").run(user.id,video.points);
    if(result.changes) {
      db.prepare('UPDATE users SET points=points+?,updated_at=CURRENT_TIMESTAMP WHERE id=?').run(video.points,user.id);
      db.prepare('INSERT INTO notifications(user_id,type,message) VALUES(?,?,?)').run(user.id,'reward',`You earned ${video.points} points for watching ${video.title}.`);
    }
    db.prepare('DELETE FROM reward_video_sessions WHERE user_id=?').run(user.id);
    db.exec('COMMIT');
    return reply(200,{awarded:Boolean(result.changes),message:`Video complete! You earned ${video.points} points.`,user:db.prepare(`SELECT ${publicUser} FROM users WHERE id=?`).get(user.id)});
  } catch(error){db.exec('ROLLBACK');throw error;}
}
