import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import SiteText from "./SiteText";

export default function EarnPoints({ user, onAuthChange, onSignIn, onEvents }) {
  const [incentives,setIncentives]=useState([]);const [code,setCode]=useState(()=>new URLSearchParams(window.location.search).get('incentive')||'');
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");const [error,setError]=useState("");
  const load=useCallback(()=>api('/incentives').then(setIncentives).catch(err=>setError(err.message)),[]);
  useEffect(()=>{load();},[load,user?.id,user?.points]);
  const claim=async event=>{event.preventDefault();if(!user){onSignIn();return;}setBusy(true);setMessage("");setError("");try{const result=await api('/incentives/claim',{method:'POST',body:JSON.stringify({code})});onAuthChange(result.user);setCode("");setMessage(result.message);await load();const url=new URL(window.location.href);url.searchParams.delete('incentive');window.history.replaceState(null,'',url);}catch(err){setError(err.message);}finally{setBusy(false);}};
  return <section className="earnPoints" aria-labelledby="earn-points-heading">
    <p className="eyebrow"><SiteText section="EarnPoints">Earn Points</SiteText></p>
    <h3 id="earn-points-heading"><SiteText section="EarnPoints">Impact Reward points scan here.</SiteText></h3>
    <ol className="incentiveList">{incentives.map(item=><li key={item.id}><span><SiteText section="EarnPoints">{item.name}</SiteText></span><strong>{item.points}<SiteText contentKey="EarnPoints.bbbc02efdd44">{" points"}</SiteText></strong>{item.claimed?<small>{item.id==='event'?"Attendance recorded":"Earned"}</small>:item.method==='registration'?<small><SiteText contentKey="EarnPoints.79bc8de47776">{"Automatically awarded to new accounts"}</SiteText></small>:item.method==='website'?<small><SiteText contentKey="EarnPoints.98c5c7f94b79">{"Automatically awarded on your first signed-in visit"}</SiteText></small>:item.method==='event'?<button type="button" className="textButton" onClick={onEvents}><SiteText contentKey="EarnPoints.c018d4b85c11">{"View events"}</SiteText></button>:<small><SiteText contentKey="EarnPoints.b63f0d52c58f">{"Claim with a verified code"}</SiteText></small>}</li>)}</ol>
    <p className="incentiveHint"><SiteText section="EarnPoints">Scan an incentive QR link with your phone camera or enter the code provided by the business, video organizer, or Vincent. Each new-user bonus can be earned once. Event points are earned once per event using its attendance code.</SiteText></p>
    <form className="incentiveClaim" onSubmit={claim}><label htmlFor="incentive-code"><SiteText section="EarnPoints">Incentive code</SiteText></label><div><input id="incentive-code" required maxLength={64} value={code} disabled={busy} onChange={event=>setCode(event.target.value)} autoComplete="off" autoCapitalize="characters"/><button className="primaryButton" disabled={busy}>{busy?"Claiming…":user?"Claim points":"Sign in to claim"}</button></div></form>
    {message&&<p className="formMessage" role="status">{message}</p>}{error&&<p className="formMessage" role="alert">{error}</p>}
  </section>;
}
