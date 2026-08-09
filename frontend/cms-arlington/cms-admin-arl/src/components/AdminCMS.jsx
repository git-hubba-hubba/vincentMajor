import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

const models = {
  events: { label: "Events", fields: ["title","description","location","starts_at","status"] },
  posts: { label: "Posts", fields: ["title","body","category","status"] },
  rewards: { label: "Rewards", fields: ["name","description","image_url","sponsor_name","points_cost","inventory","status"] },
  companies: { label: "Companies", fields: ["name","category","image_url","website","status","spotlight_position"] },
  users: { label: "Users", fields: ["first_name","last_name","email","role","status"] },
  employees: { label: "Employees", fields: ["user_id","company_id","title","status"] },
};
const statusOptions = ["pending","approved","denied"];

function AdminCMS({ user }) {
  const [active, setActive] = useState("events"); const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false); const [form, setForm] = useState({});
  const isAdmin = user && ["admin","board"].includes(user.role);
  const load = useCallback(async () => {
    if (!isAdmin) return; setLoading(true); setError("");
    try { const [records, dashboard] = await Promise.all([api(`/${active}`), api("/dashboard/summary")]); setItems(records); setSummary(dashboard); }
    catch (err) { setError(err.message); } finally { setLoading(false); }
  }, [active,isAdmin]);
  useEffect(() => { const request = window.setTimeout(load, 0); return () => window.clearTimeout(request); }, [load]);
  if (!isAdmin) return <section className="cmsGate"><h2>Board &amp; Admin workspace</h2><p>Sign in with an authorized board or administrator account to manage community content, approvals, and activity.</p></section>;

  const update = async (id, changes) => { try { await api(`/${active}/${id}`, {method:"PATCH",body:JSON.stringify(changes)}); await load(); } catch(err) { setError(err.message); } };
  const remove = async (id) => { if (!window.confirm(`Delete this ${active.slice(0,-1)}?`)) return; try { await api(`/${active}/${id}`,{method:"DELETE"}); await load(); } catch(err) { setError(err.message); } };
  const create = async (event) => {
    event.preventDefault(); const payload={...form};
    if (active === "events") payload.creator_id=user.id; if (active === "posts") payload.author_id=user.id; if (active === "companies") payload.owner_id=user.id;
    try { await api(`/${active}`,{method:"POST",body:JSON.stringify(payload)}); setForm({}); setCreating(false); await load(); } catch(err) { setError(err.message); }
  };
  const displayFields=models[active].fields;
  return <section className="cmsShell">
    <div className="cmsHeader"><div><p className="eyebrow">Content management</p><h2>Community operations</h2></div><button className="primaryButton" onClick={() => setCreating(!creating)}>+ Add {models[active].label.slice(0,-1)}</button></div>
    {summary && <div className="summaryGrid"><div><strong>{summary.counts.users}</strong><span>Members</span></div><div><strong>{summary.counts.events}</strong><span>Events</span></div><div><strong>{summary.counts.rewards}</strong><span>Rewards</span></div><div><strong>{summary.counts.redemptions}</strong><span>Rewards redeemed</span></div><div><strong>{Object.values(summary.pending).reduce((a,b)=>a+b,0)}</strong><span>Awaiting approval</span></div></div>}
    <div className="cmsTabs" role="tablist">{Object.entries(models).map(([key,value])=><button key={key} className={active===key?"active":""} onClick={()=>{setActive(key);setCreating(false);}}>{value.label}<span>{summary?.counts[key] ?? 0}</span></button>)}</div>
    {creating && <form className="createPanel" onSubmit={create}><h3>Create {models[active].label.slice(0,-1)}</h3><div className="createGrid">{displayFields.filter(f=>!['status','role'].includes(f)).map(field=><label key={field}>{field.replaceAll('_',' ')}{['description','body'].includes(field)?<textarea required value={form[field]||''} onChange={e=>setForm({...form,[field]:e.target.value})}/>:field==='image_url'&&active==='rewards'?<span className="uploadButton">{form.image_url?"Reward image selected":"Upload reward image"}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event=>{const file=event.target.files?.[0];if(!file)return;if(file.size>2*1024*1024){setError('Reward image must be smaller than 2 MB.');return;}const reader=new FileReader();reader.onload=()=>setForm({...form,image_url:reader.result});reader.readAsDataURL(file);}}/></span>:<input required={!['website','image_url','company_id','inventory','spotlight_position'].includes(field)} min={field==='inventory'||field.includes('points')?1:undefined} type={field==='starts_at'?'datetime-local':field.includes('id')||field.includes('points')||field==='inventory'||field==='spotlight_position'?'number':'text'} value={form[field]||''} onChange={e=>setForm({...form,[field]:e.target.value})}/>}</label>)}</div><div className="formActions"><button type="button" className="secondaryButton" onClick={()=>setCreating(false)}>Cancel</button><button className="primaryButton">Save</button></div></form>}
    {error && <p className="formMessage">{error}</p>}
    <div className="cmsTableWrap"><table className="cmsTable"><thead><tr>{displayFields.map(field=><th key={field}>{field.replaceAll('_',' ')}</th>)}<th>Actions</th></tr></thead><tbody>{loading?<tr><td colSpan={displayFields.length+1}>Loading…</td></tr>:items.length===0?<tr><td colSpan={displayFields.length+1}>No {active} yet.</td></tr>:items.map(item=><tr key={item.id}>{displayFields.map(field=><td key={field}>{field==='status'?<select value={item[field]} onChange={e=>update(item.id,{status:e.target.value})}>{[...new Set([item[field],...statusOptions,'active','suspended'])].map(v=><option key={v}>{v}</option>)}</select>:field==='role'?<select value={item.role} onChange={e=>update(item.id,{role:e.target.value})}>{['member','employee','board','admin'].map(v=><option key={v}>{v}</option>)}</select>:field==='spotlight_position'?<select value={item.spotlight_position||''} disabled={item.status!=="approved"} onChange={e=>update(item.id,{spotlight_position:e.target.value?Number(e.target.value):null})}><option value="">Not spotlighted</option>{[1,2,3,4,5].map(slot=><option value={slot} key={slot}>Slot {slot}</option>)}</select>:field==='image_url'?<label className="cmsImageUpload"><span style={{backgroundImage:`url(${item.image_url||'/images/impDirectory.png'})`}}></span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={event=>{const file=event.target.files?.[0];if(!file)return;if(file.size>2*1024*1024){setError(`${active==='rewards'?'Reward':'Business'} image must be smaller than 2 MB.`);return;}const reader=new FileReader();reader.onload=()=>update(item.id,{image_url:reader.result});reader.readAsDataURL(file);}}/></label>:<span title={item[field]}>{String(item[field]??'—')}</span>}</td>)}<td><button className="tableButton" onClick={()=>{const value=window.prompt(`Update ${displayFields[0]}`,item[displayFields[0]]||'');if(value!==null)update(item.id,{[displayFields[0]]:value});}}>Edit</button><button className="tableButton danger" onClick={()=>remove(item.id)}>Delete</button></td></tr>)}</tbody></table></div>
    {summary?.activity?.length>0 && <div className="activityPanel"><h3>Recent activity</h3>{summary.activity.map(entry=><p key={entry.id}><strong>{entry.first_name ? `${entry.first_name} ${entry.last_name}` : 'System'}</strong> {entry.action} {entry.entity_type} #{entry.entity_id}</p>)}</div>}
  </section>;
}
export default AdminCMS;
