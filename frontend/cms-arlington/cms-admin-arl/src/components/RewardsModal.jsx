import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

const emptyDonation = { name:"", description:"", points_cost:500, inventory:1, sponsor_name:"", image_url:"" };

function RewardsModal({ open, onClose, user, onAuthChange, onProfileClick }) {
  const [rewards,setRewards]=useState([]); const [loading,setLoading]=useState(false); const [message,setMessage]=useState("");
  const [donating,setDonating]=useState(false); const [donation,setDonation]=useState(emptyDonation); const [busyId,setBusyId]=useState(null);
  const load=useCallback(async()=>{setLoading(true);try{setRewards(await api("/community-rewards"));setMessage("");}catch(error){setMessage(error.message);}finally{setLoading(false);}},[]);
  useEffect(()=>{if(!open)return;const request=window.setTimeout(load,0);const escape=(event)=>event.key==="Escape"&&onClose();document.addEventListener("keydown",escape);return()=>{window.clearTimeout(request);document.removeEventListener("keydown",escape);};},[open,load,onClose]);
  if(!open)return null;

  const redeem=async(reward)=>{
    if(!user){onClose();onProfileClick();return;}
    if(!window.confirm(`Redeem ${reward.name} for ${reward.points_cost.toLocaleString()} points?`))return;
    setBusyId(reward.id);setMessage("");
    try{const result=await api(`/rewards/${reward.id}/redeem`,{method:"POST"});onAuthChange(result.user);setMessage(result.message);await load();}
    catch(error){setMessage(error.message);}finally{setBusyId(null);}
  };
  const selectImage=(event)=>{const file=event.target.files?.[0];if(!file)return;if(!file.type.startsWith("image/")||file.size>2*1024*1024){setMessage("Choose a JPG, PNG, or WebP image under 2 MB.");return;}const reader=new FileReader();reader.onload=()=>setDonation(current=>({...current,image_url:reader.result}));reader.readAsDataURL(file);};
  const submitDonation=async(event)=>{event.preventDefault();setBusyId("donation");setMessage("");try{const result=await api("/rewards/donate",{method:"POST",body:JSON.stringify({...donation,sponsor_name:donation.sponsor_name||`${user.first_name} ${user.last_name}`})});setDonation(emptyDonation);setDonating(false);setMessage(result.message);}catch(error){setMessage(error.message);}finally{setBusyId(null);}};

  return <div className="modalBackdrop rewardsBackdrop" onMouseDown={onClose} role="presentation">
    <section className="rewardsModal" role="dialog" aria-modal="true" aria-labelledby="rewards-title" onMouseDown={event=>event.stopPropagation()}>
      <button className="modalClose rewardsClose" onClick={onClose} aria-label="Close rewards">×</button>
      <header className="rewardsHero">
        <div><p className="rewardsKicker">Impact Rewards</p><h2 id="rewards-title">Your points can make today <em>better.</em></h2><p>Show up, support the community, and exchange the points you earn for local experiences and member perks.</p></div>
        <div className="pointsWallet"><span>My balance</span><strong>{user?user.points.toLocaleString():"—"}</strong><small>{user?"available points":"Sign in to view"}</small></div>
      </header>
      <div className="rewardsToolbar"><div><strong>{rewards.filter(item=>item.inventory>0).length}</strong><span>rewards ready to claim</span></div><button className="donateRewardButton" onClick={()=>{if(!user){onClose();onProfileClick();}else setDonating(!donating);}}>♡ Donate a reward</button></div>
      {donating&&<form className="donationForm" onSubmit={submitDonation}>
        <div className="donationIntro"><div><p className="rewardsKicker">Member sponsorship</p><h3>Offer something memorable</h3><p>Approved donors receive a Sponsor badge on their member profile.</p></div><span>SPONSOR</span></div>
        <div className="donationGrid"><label>Reward name<input required value={donation.name} onChange={event=>setDonation({...donation,name:event.target.value})}/></label><label>Sponsor name<input placeholder={`${user.first_name} ${user.last_name}`} value={donation.sponsor_name} onChange={event=>setDonation({...donation,sponsor_name:event.target.value})}/></label><label className="donationWide">Description<textarea required maxLength="500" value={donation.description} onChange={event=>setDonation({...donation,description:event.target.value})}/></label><label>Suggested point value<input required min="1" type="number" value={donation.points_cost} onChange={event=>setDonation({...donation,points_cost:Number(event.target.value)})}/></label><label>Available count<input required min="1" type="number" value={donation.inventory} onChange={event=>setDonation({...donation,inventory:Number(event.target.value)})}/></label></div>
        <div className="donationImageRow"><div style={donation.image_url?{backgroundImage:`url(${donation.image_url})`}:undefined}>{donation.image_url?"Image selected":"Reward image"}</div><label className="uploadButton">Upload image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={selectImage}/></label></div>
        <div className="formActions"><button type="button" className="secondaryButton" onClick={()=>setDonating(false)}>Cancel</button><button className="primaryButton" disabled={busyId==="donation"}>{busyId==="donation"?"Sending…":"Apply to donate"}</button></div>
      </form>}
      {message&&<p className="rewardMessage" role="status">{message}</p>}
      {loading?<div className="rewardsLoading">Opening the reward vault…</div>:<div className="rewardGrid">{rewards.map(reward=>{const soldOut=reward.inventory<=0;const short=user&&user.points<reward.points_cost;return <article className={`rewardCard ${soldOut||reward.redeemed?"rewardLocked":""}`} key={reward.id}>
        <div className="rewardImage" style={{backgroundImage:`linear-gradient(180deg,transparent 35%,rgba(13,42,56,.78)),url(${reward.image_url||'/images/banner.png'})`}}><span className="rewardCost">{reward.points_cost.toLocaleString()} pts</span>{reward.redeemed&&<span className="claimedStamp">Claimed</span>}</div>
        <div className="rewardBody"><p className="rewardSponsor">Gifted by {reward.sponsor_name||"Impact Arlington"}</p><h3>{reward.name}</h3><p>{reward.description}</p><div className="rewardAvailability"><span><i style={{width:`${Math.min(100,Math.max(0,reward.inventory)*12)}%`}}></i></span><strong>{soldOut?"Fully claimed":`${reward.inventory} available`}</strong></div><button disabled={soldOut||reward.redeemed||busyId===reward.id} onClick={()=>redeem(reward)}>{busyId===reward.id?"Claiming…":reward.redeemed?"In my rewards":soldOut?"No longer available":!user?"Sign in to redeem":short?`Need ${(reward.points_cost-user.points).toLocaleString()} more points`:"Redeem reward"}</button></div>
      </article>;})}</div>}
      {!loading&&!rewards.length&&<div className="rewardsEmpty"><span>◇</span><h3>New rewards are on the way</h3><p>Keep earning points while our community sponsors prepare the next collection.</p></div>}
    </section>
  </div>;
}

export default RewardsModal;
