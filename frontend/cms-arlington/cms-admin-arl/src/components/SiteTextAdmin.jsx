import { useContext, useEffect, useState } from "react";
import { api } from "../lib/api";
import { SiteTextContext } from "../lib/siteTextContext";
import defaults from "../data/siteText.json";

const sectionNames = {App:"Footer",Nav:"Navigation",Homepage:"Home",CommunityFeed:"Community posts",Directory:"Business directory",EventMain:"Events",EventCalendar:"Event calendar",Members:"Members",ProfileModal:"Profile and sign in",RewardsModal:"Rewards",Vision:"Vision",Rules:"Community rules",BusinessQuad:"Community partners",CarouselHP:"Highlights",Namespace:"Section headings",AdminCMS:"Content management",InboxMessage:"Inbox",ImageLightbox:"Image viewer"};
const sections = [...new Set(defaults.map(entry=>entry.section))];

function TextFieldEditor({ entry, value, busy, onSave }) {
  const [draft,setDraft]=useState(value);
  return <form className="siteTextForm" onSubmit={event=>{event.preventDefault();onSave(entry.key,draft===entry.text?null:draft);}}>
    <label htmlFor="site-text-value">Text shown in the application</label>
    <textarea id="site-text-value" required maxLength={5000} rows={6} disabled={busy} value={draft} onChange={event=>setDraft(event.target.value)} />
    <small>{draft.length.toLocaleString()} / 5,000 characters. Text is saved as plain text.</small>
    <details><summary>Original text</summary><p>{entry.text}</p></details>
    <div className="formActions"><button className="primaryButton" disabled={busy||draft===value||!draft.trim()}>{busy?"Saving…":"Save text"}</button>
      <button type="button" className="secondaryButton" disabled={busy||value===entry.text} onClick={()=>onSave(entry.key,null)}>Reset to original</button>
      {draft!==value&&<button type="button" className="secondaryButton" disabled={busy} onClick={()=>setDraft(value)}>Discard draft</button>}</div>
    {draft!==value&&<p className="siteTextDraftNote">You have unsaved changes.</p>}
  </form>;
}

export default function SiteTextAdmin({ user }) {
  const {overrides,setOverrides}=useContext(SiteTextContext);
  const [section,setSection]=useState("Homepage");const [search,setSearch]=useState("");const [selectedKey,setSelectedKey]=useState("");
  const [busy,setBusy]=useState(false);const [loading,setLoading]=useState(true);const [error,setError]=useState("");const [notice,setNotice]=useState("");
  useEffect(()=>{let active=true;api("/site-text").then(values=>{if(active)setOverrides(values);}).catch(err=>{if(active)setError(err.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[setOverrides]);
  if(user?.role!=="admin")return null;
  const term=search.trim().toLowerCase();
  const entries=defaults.filter(entry=>(!section||entry.section===section)&&(!term||`${entry.text} ${overrides[entry.key]||""}`.toLowerCase().includes(term)));
  const selected=entries.find(entry=>entry.key===selectedKey)||entries[0];
  const save=async(key,value)=>{setBusy(true);setError("");setNotice("");try{const result=await api("/site-text",{method:"PATCH",body:JSON.stringify({changes:{[key]:value}})});setOverrides(result.overrides);setNotice(value===null?"Original text restored.":"Text saved. Visitors will see it when they open or refocus the app.");}catch(err){setError(err.message);}finally{setBusy(false);}};
  return <section className="siteTextAdmin" aria-labelledby="site-text-heading">
    <header><p className="eyebrow">Site settings</p><h2 id="site-text-heading">Edit application text</h2><p>Choose a section and a text field. Changes apply to everyone and stay saved after a restart. Manage posts, events, and member details in their existing editors.</p></header>
    <div className="siteTextTools"><label>Section<select disabled={busy} value={section} onChange={event=>{setSection(event.target.value);setSelectedKey("");setNotice("");}}><option value="">All sections</option>{sections.map(value=><option value={value} key={value}>{sectionNames[value]||value}</option>)}</select></label>
      <label>Find text<input type="search" disabled={busy} value={search} placeholder="Search original or edited text" onChange={event=>{setSearch(event.target.value);setSelectedKey("");}} /></label></div>
    {loading?<p role="status">Loading site text…</p>:<div className="siteTextLayout"><nav aria-label="Text fields">{entries.map(entry=><button type="button" disabled={busy} key={entry.key} aria-current={selected?.key===entry.key?"true":undefined} onClick={()=>{setSelectedKey(entry.key);setNotice("");}}><small>{sectionNames[entry.section]||entry.section}{Object.hasOwn(overrides,entry.key)?" · Edited":""}</small><span>{overrides[entry.key]??entry.text}</span></button>)}</nav>
      {selected?<TextFieldEditor key={`${selected.key}:${overrides[selected.key]??selected.text}`} entry={selected} value={overrides[selected.key]??selected.text} busy={busy} onSave={save}/>:<p>No text matches your search.</p>}</div>}
    {error&&<p className="formMessage" role="alert">{error}</p>}{notice&&<p className="formMessage" role="status">{notice}</p>}
  </section>;
}
