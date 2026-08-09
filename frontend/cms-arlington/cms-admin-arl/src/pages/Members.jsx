import { useEffect, useMemo, useState } from "react";
import Namespace from "../components/Namespace";
import ActiveUser from "../components/ActiveUser";
import members from "../data/members";
import { api } from "../lib/api";

function Members({ user, onProfileClick }) {
  const [search,setSearch]=useState(""); const [connections,setConnections]=useState([]); const [realMembers,setRealMembers]=useState([]); const [dialog,setDialog]=useState(null);
  const [events,setEvents]=useState([]); const [eventId,setEventId]=useState(""); const [message,setMessage]=useState(""); const [notice,setNotice]=useState(""); const [busy,setBusy]=useState(false);
  const profiles=useMemo(()=>[...realMembers.filter(member=>member.id!==user?.id),...members.map((member,index)=>({...member,ref:`community-${index+1}`}))],[realMembers,user]);
  const visible=useMemo(()=>{const term=search.trim().toLowerCase();return profiles.filter(member=>!term||[member.name,member.company,member.position].some(value=>value.toLowerCase().includes(term)));},[profiles,search]);
  useEffect(()=>{api("/community-members").then(setRealMembers).catch(()=>{});if(!user)return;Promise.all([api("/member-actions"),api("/community-events")]).then(([actions,available])=>{setConnections(actions.connections);setEvents(available);}).catch(()=>{});},[user]);
  const requireUser=()=>{if(user)return true;onProfileClick();return false;};
  const connect=async(person)=>{if(!requireUser())return;try{const result=await api(`/members/${person.ref}/connect`,{method:"POST",body:JSON.stringify({member_name:person.name})});setConnections(current=>result.connected?[...current,person.ref]:current.filter(ref=>ref!==person.ref));setNotice(result.connected?`You and ${person.name} are now connected.`:`${person.name} was removed from your connections.`);}catch(error){setNotice(error.message);}};
  const openAction=(type,person)=>{if(!requireUser())return;setDialog({type,person});setEventId("");setMessage("");setNotice("");};
  const submitAction=async(event)=>{event.preventDefault();setBusy(true);try{const payload=dialog.type==="invite"?{member_name:dialog.person.name,event_id:Number(eventId)}:{member_name:dialog.person.name,body:message};const result=await api(`/members/${dialog.person.ref}/${dialog.type}`,{method:"POST",body:JSON.stringify(payload)});setNotice(result.message);setDialog(null);}catch(error){setNotice(error.message);}finally{setBusy(false);}};

  return <main className="membersPage">
    <section className="membersHero"><img src="/images/memberimpact.png" alt="Impact Arlington members"/><div><p className="eyebrow">Community network</p><h1>Find the people making Arlington stronger.</h1><p>Connect with neighbors, invite someone to your next event, or start a direct conversation.</p></div></section>
    <Namespace title="Impact Members" />
    <div className="memberSearchWrap"><label><span>⌕</span><input type="search" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search by member, business, or role"/></label><p><strong>{visible.length}</strong> members found</p></div>
    {notice&&<p className="memberNotice" role="status">{notice}</p>}
    <div className="memOrganizer">{visible.map(person=><ActiveUser key={person.ref} personObj={person} connected={Boolean(user)&&connections.includes(person.ref)} onConnect={()=>connect(person)} onInvite={()=>openAction("invite",person)} onMessage={()=>openAction("message",person)}/>)}</div>
    {!visible.length&&<div className="memberEmpty"><span>⌕</span><h2>No members found</h2><p>Try searching with a broader name, company, or position.</p></div>}
    {dialog&&<div className="modalBackdrop" onMouseDown={()=>setDialog(null)}><form className="memberActionModal" onSubmit={submitAction} onMouseDown={event=>event.stopPropagation()}><button type="button" className="modalClose" onClick={()=>setDialog(null)}>×</button><p className="eyebrow">{dialog.type==="invite"?"Event invitation":"Direct message"}</p><h2>{dialog.type==="invite"?`Invite ${dialog.person.name}`:`Message ${dialog.person.name}`}</h2>{dialog.type==="invite"?<label>Choose an event<select required value={eventId} onChange={event=>setEventId(event.target.value)}><option value="">Select an upcoming event</option>{events.map(item=><option key={item.id} value={item.id}>{item.title} · {new Date(item.starts_at).toLocaleDateString()}</option>)}</select></label>:<label>Your message<textarea required maxLength="1000" autoFocus value={message} onChange={event=>setMessage(event.target.value)} placeholder="Write a friendly message…"/></label>}<div className="formActions"><button type="button" className="secondaryButton" onClick={()=>setDialog(null)}>Cancel</button><button className="primaryButton" disabled={busy}>{busy?"Sending…":dialog.type==="invite"?"Send invitation":"Send message"}</button></div></form></div>}
  </main>;
}

export default Members;
