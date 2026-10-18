import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

export default function RewardVideo({user,onAuthChange,onSignIn,onEarned}) {
  const [state,setState]=useState(null);
  const [session,setSession]=useState(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const videoRef=useRef(null);
  const inFlight=useRef(null);
  const validPosition=useRef(0);
  useEffect(()=>{let active=true;api('/reward-video').then(value=>{if(active)setState(value);}).catch(err=>{if(active)setError(err.message);});return()=>{active=false;};},[user?.id]);
  useEffect(()=>{
    if(!session)return;
    let active=true;
    const send=async complete=>{
      if(inFlight.current) {if(!complete)return;await inFlight.current.catch(()=>{});}
      const player=videoRef.current;
      if(!player || !active)return;
      const request=api('/reward-video/progress',{method:'POST',body:JSON.stringify({token:session.token,position:player.currentTime,complete})});
      inFlight.current=request;
      try{const result=await request;if(!active)return;if(complete){setState(current=>({...current,claimed:true}));setSession(null);setNotice(result.message);onAuthChange(result.user);onEarned();}}
      catch(err){if(active){player.pause();setError(err.message);setSession(null);}}
      finally{if(inFlight.current===request)inFlight.current=null;}
    };
    const player=videoRef.current;
    const finish=()=>send(true);
    const pauseHidden=()=>{if(document.hidden)player?.pause();};
    const timer=setInterval(()=>{if(player&&!player.paused&&!player.ended)send(false);},2000);
    player?.addEventListener('ended',finish);
    document.addEventListener('visibilitychange',pauseHidden);
    return()=>{active=false;clearInterval(timer);player?.removeEventListener('ended',finish);document.removeEventListener('visibilitychange',pauseHidden);};
  },[session,onAuthChange,onEarned]);
  const start=async()=>{
    if(!user){onSignIn();return;}
    setBusy(true);setError('');setNotice('');
    try{const result=await api('/reward-video/start',{method:'POST'});if(result.version!==state.video.version){setState(await api('/reward-video'));throw new Error('A new video is available. Start again to watch it.');}videoRef.current.pause();validPosition.current=0;videoRef.current.currentTime=0;setSession(result);}
    catch(err){setError(err.message);}finally{setBusy(false);}
  };
  return <section className="rewardVideo" aria-labelledby="reward-video-title"><div><p className="eyebrow">WATCH & EARN</p><h4 id="reward-video-title">{state?.video?.title || 'Community video'}</h4><p>Watch from start to finish at normal speed to earn {state?.video?.points || 12} points. One video bonus per profile.</p></div>
    {state?.video?<><video key={state.video.version} ref={videoRef} src={state.video.video_url} controls={Boolean(session)||state.claimed} preload="metadata" playsInline controlsList="nodownload noplaybackrate" disablePictureInPicture
      onPlay={event=>{if(!session&&!state.claimed)event.currentTarget.pause();}}
      onTimeUpdate={event=>{if(!event.currentTarget.seeking)validPosition.current=event.currentTarget.currentTime;}}
      onSeeking={event=>{if(session&&Math.abs(event.currentTarget.currentTime-validPosition.current)>1)event.currentTarget.currentTime=validPosition.current;}}
      onRateChange={event=>{if(session&&event.currentTarget.playbackRate!==1)event.currentTarget.playbackRate=1;}}
      onError={()=>setError('This video could not be loaded. Please try again later.')} aria-label={state.video.title}/>
      {state.claimed?<p className="videoEarned" role="status">✓ Video bonus earned</p>:<button type="button" className="primaryButton" disabled={busy} onClick={start}>{busy?'Preparing…':session?'Restart video':user?'Start watching':'Sign in to watch & earn'}</button>}
      {session&&<p role="status">Ready! Press play and watch the full video. Points are added automatically when it ends.</p>}
    </>:<p>{state?'The next reward video is coming soon.':'Loading video…'}</p>}
    {notice&&<p className="formMessage" role="status">{notice}</p>}{error&&<p className="formMessage" role="alert">{error}</p>}
  </section>;
}
