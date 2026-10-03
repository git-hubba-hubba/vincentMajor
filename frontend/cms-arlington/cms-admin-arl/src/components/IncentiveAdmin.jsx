import SiteText from "./SiteText";
import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { api } from "../lib/api";

function ScanLink({ item }) {
  const [image,setImage]=useState("");const [error,setError]=useState("");
  const url=new URL(window.location.href);url.search='';url.hash='';url.searchParams.set('incentive',item.code);const link=url.toString();
  useEffect(()=>{let active=true;QRCode.toDataURL(link,{width:240,margin:2}).then(value=>{if(active)setImage(value);}).catch(()=>{if(active)setError('The QR image could not be generated. Use the scan link below.');});return()=>{active=false;};},[link]);
  return <div className="incentiveScanLink">{image&&<><img src={image} alt={`Scan to claim ${item.label}`} width={240} height={240}/><a href={image} download={`impact-incentive-${item.id}.png`}><SiteText contentKey="IncentiveAdmin.5cb3d95ebe35">{"Download QR image"}</SiteText></a></>}
    <label><SiteText contentKey="IncentiveAdmin.2780bbe2bf5b">{"Scan link"}</SiteText><input readOnly value={link} onFocus={event=>event.target.select()}/></label>{error&&<p role="alert">{error}</p>}</div>;
}

export default function IncentiveAdmin() {
  const [codes,setCodes]=useState([]);const [incentives,setIncentives]=useState([]);const [type,setType]=useState('business-visit');const [label,setLabel]=useState("");
  const [selected,setSelected]=useState(null);const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [notice,setNotice]=useState("");
  const load=useCallback(async()=>{const [records,definitions]=await Promise.all([api('/incentive-codes'),api('/incentives')]);setCodes(records);setIncentives(definitions.filter(item=>item.method==='code'));},[]);
  useEffect(()=>{const request=window.setTimeout(()=>load().catch(err=>setError(err.message)),0);return()=>window.clearTimeout(request);},[load]);
  const create=async event=>{event.preventDefault();setBusy(true);setError("");setNotice("");try{const result=await api('/incentive-codes',{method:'POST',body:JSON.stringify({incentive_id:type,label})});setSelected(result.id);setLabel("");await load();setNotice('Code created. Share it after the member completes the activity.');}catch(err){setError(err.message);}finally{setBusy(false);}};
  const toggle=async item=>{setBusy(true);setError("");try{await api('/incentive-codes',{method:'PATCH',body:JSON.stringify({id:item.id,active:!item.active})});await load();}catch(err){setError(err.message);}finally{setBusy(false);}};
  return <section className="siteTextAdmin incentiveAdmin" aria-labelledby="incentive-admin-heading"><p className="eyebrow"><SiteText contentKey="IncentiveAdmin.f1c5165ba063">{"Member incentives"}</SiteText></p><h2 id="incentive-admin-heading"><SiteText contentKey="IncentiveAdmin.1df3b9bcec30">{"Reward point claim codes"}</SiteText></h2><p><SiteText contentKey="IncentiveAdmin.bfd8bc966ef7">{"Create codes for verified business visits, purchases, videos, and finding Vincent. Share the code or downloaded QR image after the activity. Each member can earn each new-user incentive once, even with different codes. Event attendance uses the event’s own code."}</SiteText></p>
    <form className="siteTextTools" onSubmit={create}><label><SiteText contentKey="IncentiveAdmin.38da1505ca83">{"Activity"}</SiteText><select value={type} disabled={busy} onChange={event=>setType(event.target.value)}>{incentives.map(item=><option key={item.id} value={item.id}>{item.name} · {item.points}<SiteText contentKey="IncentiveAdmin.bbbc02efdd44">{" points"}</SiteText></option>)}</select></label><label><SiteText contentKey="IncentiveAdmin.0e66373f45dc">{"Label"}</SiteText><input required maxLength={100} disabled={busy} placeholder="Business, video, or location name" value={label} onChange={event=>setLabel(event.target.value)}/></label><button className="primaryButton" disabled={busy||!incentives.length}><SiteText contentKey="IncentiveAdmin.f711d7940d9d">{"Create claim code"}</SiteText></button></form>
    <div className="incentiveCodes">{codes.map(item=><article key={item.id}><div><strong>{item.label}</strong><p>{incentives.find(value=>value.id===item.incentive_id)?.name} · {item.claim_count}<SiteText contentKey="IncentiveAdmin.9e3e55d2f9d0">{" claims · "}</SiteText>{item.active?'Active':'Inactive'}</p><code>{item.code}</code></div><div className="formActions"><button type="button" className="secondaryButton" disabled={busy} onClick={()=>setSelected(selected===item.id?null:item.id)}><SiteText contentKey="IncentiveAdmin.9e309579da97">{"QR / scan link"}</SiteText></button><button type="button" className="secondaryButton" disabled={busy} onClick={()=>toggle(item)}>{item.active?'Deactivate':'Activate'}</button></div>{selected===item.id&&<ScanLink item={item}/>}</article>)}</div>
    {!codes.length&&<p><SiteText contentKey="IncentiveAdmin.5eb7d2d1e826">{"No claim codes yet."}</SiteText></p>}{error&&<p className="formMessage" role="alert">{error}</p>}{notice&&<p className="formMessage" role="status">{notice}</p>}
  </section>;
}
