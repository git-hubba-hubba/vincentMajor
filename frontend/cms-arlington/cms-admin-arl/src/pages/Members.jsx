import SiteText from "../components/SiteText";
import { useEffect, useMemo, useState } from "react";
import Namespace from "../components/Namespace";
import ActiveUser from "../components/ActiveUser";
import members from "../data/members";
import { api } from "../lib/api";

function Members({ user, onProfileClick }) {
  const [search,setSearch]=useState(""); const [connections,setConnections]=useState([]); const [realMembers,setRealMembers]=useState([]); const [dialog,setDialog]=useState(null);
  const [events,setEvents]=useState([]); const [eventId,setEventId]=useState(""); const [message,setMessage]=useState(""); const [notice,setNotice]=useState(""); const [busy,setBusy]=useState(false);
  const profiles=useMemo(()=>[...realMembers.filter(member=>member.id!==user?.id),...members.map((member,index)=>({...member,ref:`community-${index+1}`}))],[realMembers,user]);
  const visible=useMemo(()=>{const term=search.trim().toLowerCase();return profiles.filter(member=>!term||[member.name,member.company,member.position,member.occupation].some(value=>String(value||"").toLowerCase().includes(term)));},[profiles,search]);
  useEffect(()=>{api("/community-members").then(setRealMembers).catch(()=>{});if(!user)return;Promise.all([api("/member-actions"),api("/community-events")]).then(([actions,available])=>{setConnections(actions.connections);setEvents(available);}).catch(()=>{});},[user]);
  const requireUser=()=>{if(user)return true;onProfileClick();return false;};
  const connect=async(person)=>{if(!requireUser())return;try{const result=await api(`/members/${person.ref}/connect`,{method:"POST",body:JSON.stringify({member_name:person.name})});setConnections(current=>result.connected?[...current,person.ref]:current.filter(ref=>ref!==person.ref));setNotice(result.connected?`You and ${person.name} are now connected.`:`${person.name} was removed from your connections.`);}catch(error){setNotice(error.message);}};
  const openAction=(type,person)=>{if(!requireUser())return;setDialog({type,person});setEventId("");setMessage("");setNotice("");};
  const submitAction=async(event)=>{event.preventDefault();setBusy(true);try{const payload=dialog.type==="invite"?{member_name:dialog.person.name,event_id:Number(eventId)}:{member_name:dialog.person.name,body:message};const result=await api(`/members/${dialog.person.ref}/${dialog.type}`,{method:"POST",body:JSON.stringify(payload)});setNotice(result.message);setDialog(null);}catch(error){setNotice(error.message);}finally{setBusy(false);}};

  return <main className="membersPage">
    <section className="membersHero"><img src="/images/memberimpact.png" alt="Impact Arlington members"/><div><p className="eyebrow"><SiteText contentKey="Members.e44b1dc797ed">{"Community network"}</SiteText></p><h1><SiteText contentKey="Members.706e226689f4">{"Find the people making Arlington stronger."}</SiteText></h1><p><SiteText contentKey="Members.ef67fcbb4809">{"Connect with neighbors, invite someone to your next event, or start a direct conversation."}</SiteText></p></div></section>
    <Namespace title="Impact Members" />
    <div className="memberSearchWrap"><label><span>⌕</span><input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search by name, business, role, or occupation"/></label><p><strong>{visible.length}</strong><SiteText contentKey="Members.7391c427b44f">{" members found"}</SiteText></p></div>
    {notice&&<p className="memberNotice" role="status">{notice}</p>}
    <div className="memOrganizer">{visible.map(person=><ActiveUser key={person.ref} personObj={person} connected={Boolean(user)&&connections.includes(person.ref)} onConnect={()=>connect(person)} onInvite={()=>openAction("invite",person)} onMessage={()=>openAction("message",person)}/>)}</div>
    {!visible.length&&<div className="memberEmpty"><span>⌕</span><h2><SiteText contentKey="Members.a4e937d25742">{"No members found"}</SiteText></h2><p><SiteText contentKey="Members.04c0fcb6326f">{"Try searching with a broader name, company, or position."}</SiteText></p></div>}
    {dialog&&<div className="modalBackdrop" onMouseDown={()=>setDialog(null)}><form className="memberActionModal" onSubmit={submitAction} onMouseDown={event=>event.stopPropagation()}><button type="button" className="modalClose" onClick={()=>setDialog(null)}>×</button><p className="eyebrow"><SiteText section="Members">{dialog.type==="invite"?"Event invitation":"Direct message"}</SiteText></p><h2>{dialog.type==="invite"?`Invite ${dialog.person.name}`:`Message ${dialog.person.name}`}</h2>{dialog.type==="invite"?<label><SiteText contentKey="Members.4349a7b25a72">{"Choose an event"}</SiteText><select required value={eventId} onChange={event=>setEventId(event.target.value)}><option value=""><SiteText contentKey="Members.c992ad297948">{"Select an upcoming event"}</SiteText></option>{events.map(item=><option key={item.id} value={item.id}>{item.title} · {new Date(item.starts_at).toLocaleDateString()}</option>)}</select></label>:<label><SiteText contentKey="Members.7a057bd996a3">{"Your message"}</SiteText><textarea required maxLength="1000" autoFocus value={message} onChange={event=>setMessage(event.target.value)} placeholder="Write a friendly message…"/></label>}<div className="formActions"><button type="button" className="secondaryButton" onClick={()=>setDialog(null)}><SiteText contentKey="Members.19766ed6ccb2">{"Cancel"}</SiteText></button><button className="primaryButton" disabled={busy}><SiteText section="Members">{busy?"Sending…":dialog.type==="invite"?"Send invitation":"Send message"}</SiteText></button></div></form></div>}
  </main>;
}

export default Members;
