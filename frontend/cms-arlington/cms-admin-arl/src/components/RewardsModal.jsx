import SiteText from "./SiteText";
import EarnPoints from "./EarnPoints";
import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

const emptyDonation = { name:"", description:"", points_cost:500, inventory:1, sponsor_name:"", image_url:"" };

function RewardsModal({ open, onClose, user, onAuthChange, onProfileClick, onEvents }) {
  const [rewards,setRewards]=useState([]); const [loading,setLoading]=useState(false); const [message,setMessage]=useState("");
  const [showHowItWorks,setShowHowItWorks]=useState(false);
  const [donating,setDonating]=useState(false); const [donation,setDonation]=useState(emptyDonation); const [busyId,setBusyId]=useState(null);
  const load=useCallback(async()=>{setLoading(true);try{setRewards(await api("/community-rewards"));setMessage("");}catch(error){setMessage(error.message);}finally{setLoading(false);}},[]);
  useEffect(()=>{if(!open)return;const request=window.setTimeout(load,0);const escape=(event)=>event.key==="Escape"&&onClose();document.addEventListener("keydown",escape);return()=>{window.clearTimeout(request);document.removeEventListener("keydown",escape);};},[open,load,onClose]);
  if(!open)return null;

  const redeem=async(reward)=>{
    if(!user){onClose();onProfileClick();return;}
    if(!window.confirm(reward.points_cost===0?`Claim ${reward.name} for free?`:`Redeem ${reward.name} for ${reward.points_cost.toLocaleString()} points?`))return;
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
        <div><p className="rewardsKicker"><SiteText contentKey="RewardsModal.2bf1347bb03f">{"Impact Rewards"}</SiteText></p><h2 id="rewards-title"><SiteText contentKey="RewardsModal.b5df1f18b1ad">{"Your points can make today "}</SiteText><em><SiteText contentKey="RewardsModal.7e586e4bdce4">{"better."}</SiteText></em></h2><p><SiteText contentKey="RewardsModal.2b4ad38cc1ca">{"Show up, support the community, and exchange the points you earn for local experiences and member perks."}</SiteText></p></div>
        <div className="pointsWallet"><span><SiteText contentKey="RewardsModal.2ed08c41069a">{"My balance"}</SiteText></span><strong><SiteText section="RewardsModal">{user?user.points.toLocaleString():"—"}</SiteText></strong><small><SiteText section="RewardsModal">{user?"available points":"Sign in to view"}</SiteText></small></div>
      </header>
      <EarnPoints user={user} onAuthChange={onAuthChange} onSignIn={()=>{onClose();onProfileClick();}} onEvents={()=>{onClose();onEvents();}} />
      <div className="rewardsToolbar"><div><strong>{rewards.filter(item=>item.inventory>0).length}</strong><span><SiteText contentKey="RewardsModal.12e0c58afe4b">{"rewards ready to claim"}</SiteText></span></div><div className="rewardsToolbarActions"><button type="button" className="donateRewardButton" aria-expanded={showHowItWorks} aria-controls="rewards-how-it-works" onClick={()=>setShowHowItWorks(!showHowItWorks)}><SiteText contentKey="RewardsModal.9c870aa6e5e9">{"How it works"}</SiteText></button><button className="donateRewardButton" onClick={()=>{if(!user){onClose();onProfileClick();}else setDonating(!donating);}}><SiteText contentKey="RewardsModal.93b3607edcc0">{"♡ Donate a reward"}</SiteText></button></div></div>
      <section id="rewards-how-it-works" className="rewardsGuide" aria-labelledby="rewards-guide-title" hidden={!showHowItWorks}>
        <h3 id="rewards-guide-title"><SiteText contentKey="RewardsModal.7c67e79735ce">{"Turn participation into rewards"}</SiteText></h3>
        <ol>
          <li><strong><SiteText contentKey="RewardsModal.aebe24fd9cfa">{"Earn points at events."}</SiteText></strong><SiteText contentKey="RewardsModal.7d4382523dbf">{" Sign in, attend a community event, and confirm your attendance with its attendance code. Each event lists how many points you can earn. Points are awarded once per event."}</SiteText></li>
          <li><strong><SiteText contentKey="RewardsModal.9d120318d0d2">{"Choose your reward."}</SiteText></strong><SiteText contentKey="RewardsModal.e820fcff3cc9">{" Check My balance, then browse the available rewards. Each card shows the point cost (or Free) and how many are left."}</SiteText></li>
          <li><strong><SiteText contentKey="RewardsModal.af6b7896cdea">{"Redeem your points."}</SiteText></strong><SiteText contentKey="RewardsModal.b5f261c40059">{" Select Redeem reward and confirm. Free rewards require no points. Other rewards require enough points; all rewards require available stock. The point cost is deducted from your balance, and each reward can be redeemed once per member."}</SiteText></li>
          <li><strong><SiteText contentKey="RewardsModal.029b7f269798">{"Find your claimed rewards."}</SiteText></strong><SiteText contentKey="RewardsModal.ffa6648883a4">{" Open your profile to see your redeemed rewards. Claimed items are also marked In my rewards in this dashboard."}</SiteText></li>
        </ol>
        <p><strong><SiteText contentKey="RewardsModal.54d4ef974631">{"Give back, too."}</SiteText></strong><SiteText contentKey="RewardsModal.fbf90ac96974">{" Use Donate a reward to offer a perk to the community. Donations are reviewed before appearing here; approved donors receive a Sponsor badge."}</SiteText></p>
      </section>
      {donating&&<form className="donationForm" onSubmit={submitDonation}>
        <div className="donationIntro"><div><p className="rewardsKicker"><SiteText contentKey="RewardsModal.58060ce5ad52">{"Member sponsorship"}</SiteText></p><h3><SiteText contentKey="RewardsModal.2eb591670ea0">{"Offer something memorable"}</SiteText></h3><p><SiteText contentKey="RewardsModal.867704c4c56a">{"Approved donors receive a Sponsor badge on their member profile."}</SiteText></p></div><span><SiteText contentKey="RewardsModal.712a9c6973e0">{"SPONSOR"}</SiteText></span></div>
        <div className="donationGrid"><label><SiteText contentKey="RewardsModal.245fcd2c209d">{"Reward name"}</SiteText><input required value={donation.name} onChange={event=>setDonation({...donation,name:event.target.value})}/></label><label><SiteText contentKey="RewardsModal.f4fa48cfa39e">{"Sponsor name"}</SiteText><input placeholder={`${user.first_name} ${user.last_name}`} value={donation.sponsor_name} onChange={event=>setDonation({...donation,sponsor_name:event.target.value})}/></label><label className="donationWide"><SiteText contentKey="RewardsModal.526e0087cc3f">{"Description"}</SiteText><textarea required maxLength="500" value={donation.description} onChange={event=>setDonation({...donation,description:event.target.value})}/></label><label><SiteText contentKey="RewardsModal.2289c1529912">{"Point cost (0 = free)"}</SiteText><input required min="0" step="1" type="number" value={donation.points_cost} onChange={event=>setDonation({...donation,points_cost:Number(event.target.value)})}/></label><label><SiteText contentKey="RewardsModal.fabf3c884861">{"Available count"}</SiteText><input required min="1" type="number" value={donation.inventory} onChange={event=>setDonation({...donation,inventory:Number(event.target.value)})}/></label></div>
        <div className="donationImageRow"><div style={donation.image_url?{backgroundImage:`url(${donation.image_url})`}:undefined}><SiteText section="RewardsModal">{donation.image_url?"Image selected":"Reward image"}</SiteText></div><label className="uploadButton"><SiteText contentKey="RewardsModal.ffe4df6c7ca6">{"Upload image"}</SiteText><input type="file" accept="image/png,image/jpeg,image/webp" onChange={selectImage}/></label></div>
        <div className="formActions"><button type="button" className="secondaryButton" onClick={()=>setDonating(false)}><SiteText contentKey="RewardsModal.19766ed6ccb2">{"Cancel"}</SiteText></button><button className="primaryButton" disabled={busyId==="donation"}><SiteText section="RewardsModal">{busyId==="donation"?"Sending…":"Apply to donate"}</SiteText></button></div>
      </form>}
      {message&&<p className="rewardMessage" role="status">{message}</p>}
      {loading?<div className="rewardsLoading"><SiteText contentKey="RewardsModal.48c576db2910">{"Opening the reward vault…"}</SiteText></div>:<div className="rewardGrid">{rewards.map(reward=>{const soldOut=reward.inventory<=0;const short=user&&user.points<reward.points_cost;return <article className={`rewardCard ${soldOut||reward.redeemed?"rewardLocked":""}`} key={reward.id}>
        <div className="rewardImage" style={{backgroundImage:`linear-gradient(180deg,transparent 35%,rgba(13,42,56,.78)),url(${reward.image_url||'/images/banner.png'})`}}><span className="rewardCost"><SiteText section="RewardsModal">{reward.points_cost===0?"Free":`${reward.points_cost.toLocaleString()} pts`}</SiteText></span>{reward.redeemed&&<span className="claimedStamp"><SiteText contentKey="RewardsModal.ddcd2779294a">{"Claimed"}</SiteText></span>}</div>
        <div className="rewardBody"><p className="rewardSponsor"><SiteText contentKey="RewardsModal.d3965f8691a5">{"Gifted by "}</SiteText><SiteText section="RewardsModal">{reward.sponsor_name||"Impact Arlington"}</SiteText></p><h3>{reward.name}</h3><p>{reward.description}</p><div className="rewardAvailability"><span><i style={{width:`${Math.min(100,Math.max(0,reward.inventory)*12)}%`}}></i></span><strong><SiteText section="RewardsModal">{soldOut?"Fully claimed":`${reward.inventory} available`}</SiteText></strong></div><button disabled={soldOut||reward.redeemed||busyId===reward.id} onClick={()=>redeem(reward)}><SiteText section="RewardsModal">{busyId===reward.id?"Claiming…":reward.redeemed?"In my rewards":soldOut?"No longer available":!user?"Sign in to redeem":short?`Need ${(reward.points_cost-user.points).toLocaleString()} more points`:reward.points_cost===0?"Claim free reward":"Redeem reward"}</SiteText></button></div>
      </article>;})}</div>}
      {!loading&&!rewards.length&&<div className="rewardsEmpty"><span>◇</span><h3><SiteText contentKey="RewardsModal.4761a83dade2">{"New rewards are on the way"}</SiteText></h3><p><SiteText contentKey="RewardsModal.a125e12f7c02">{"Keep earning points while our community sponsors prepare the next collection."}</SiteText></p></div>}
    </section>
  </div>;
}

export default RewardsModal;
