import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function RewardVideoAdmin() {
  const [current,setCurrent]=useState(null);
  const [file,setFile]=useState(null);
  const [title,setTitle]=useState('');
  const [points,setPoints]=useState(12);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  useEffect(()=>{let active=true;api('/reward-video').then(result=>{if(active)setCurrent(result.video);}).catch(err=>{if(active)setError(err.message);});return()=>{active=false;};},[]);
  const select=event=>{setError('');const chosen=event.target.files?.[0];if(!chosen)return;if(!['video/mp4','video/webm'].includes(chosen.type)||chosen.size>20*1024*1024){setError('Choose an MP4 or WebM video up to 20 MB.');event.target.value='';setFile(null);return;}setFile(chosen);};
  const publish=async event=>{
    event.preventDefault();if(!file)return;setBusy(true);setError('');setNotice('');
    try{
      const duration=await new Promise((resolve,reject)=>{const player=document.createElement('video');const url=URL.createObjectURL(file);player.preload='metadata';player.onloadedmetadata=()=>{const seconds=player.duration;URL.revokeObjectURL(url);Number.isFinite(seconds)&&seconds>0&&seconds<=3600?resolve(seconds):reject(new Error('Choose a playable video up to one hour long.'));};player.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('This video cannot be played. Try another MP4 or WebM file.'));};player.src=url;});
      const video=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Could not read the video.'));reader.readAsDataURL(file);});
      const result=await api('/reward-video',{method:'POST',body:JSON.stringify({title,points,video,duration})});
      setNotice(result.message);setFile(null);event.target.reset();setCurrent((await api('/reward-video')).video);
    }catch(err){setError(err.message);}finally{setBusy(false);}
  };
  return <section className="rewardVideoAdmin"><p className="eyebrow">EARN POINTS · ACTIVITY 04</p><h3>Watch video</h3><p>Upload the video members watch to earn points. Replacing it does not reset anyone’s earned bonus.</p>
    {current&&<div className="adminCurrentVideo"><strong>Published: {current.title} · {current.points} points</strong><video src={current.video_url} controls preload="metadata"/></div>}
    <form className="profileForm" onSubmit={publish}><label>Video title<input required maxLength={150} value={title} disabled={busy} onChange={event=>setTitle(event.target.value)}/></label><label>Points for completing the video<input required type="number" min={1} max={10000} step={1} value={points} disabled={busy} onChange={event=>setPoints(Number(event.target.value))}/></label><label>Video file (MP4 or WebM, up to 20 MB)<input required type="file" accept="video/mp4,video/webm" disabled={busy} onChange={select}/></label><button className="primaryButton" disabled={busy||!file}>{busy?'Uploading video…':current?'Replace published video':'Publish video'}</button></form>
    {error&&<p className="formMessage" role="alert">{error}</p>}{notice&&<p className="formMessage" role="status">{notice}</p>}
  </section>;
}
