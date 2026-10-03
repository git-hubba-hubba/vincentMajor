import SiteText from "./SiteText";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import businessCategories from "../data/businessCategories";
import InboxMessage from "./InboxMessage";

const emptyAuth = { firstName: "", lastName: "", email: "", password: "" };
const emptyBusiness = { name: "", category: "", description: "", image_url: "", website: "", phone: "", address: "" };

function ProfileModal({ open, onClose, user, onAuthChange }) {
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState(emptyAuth);
  const [business, setBusiness] = useState(emptyBusiness);
  const [showBusiness, setShowBusiness] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({ first_name: "", last_name: "", email: "", bio: "", occupation: "", avatar_url: "" });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [profileEvents, setProfileEvents] = useState({ saved: [], attended: [] });
  const [profileRewards, setProfileRewards] = useState({ redeemed: [], donations: [] });
  const [ownedBusiness,setOwnedBusiness]=useState(null); const [editingBusiness,setEditingBusiness]=useState(false);
  const [socialInbox,setSocialInbox]=useState({invitations:[],messages:[]});

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !user) return;
    Promise.all([api("/profile/events"),api("/profile/rewards")]).then(([events,rewards])=>{setProfileEvents(events);setProfileRewards(rewards);}).catch(() => {setProfileEvents({ saved:[], attended:[] });setProfileRewards({ redeemed:[], donations:[] });});
    if (["pending","premium"].includes(user.business_tier)) api("/profile/business").then(company=>setOwnedBusiness({...company,images:company.images||[]})).catch(()=>setOwnedBusiness(null));
    api("/profile/social").then(setSocialInbox).catch(()=>setSocialInbox({invitations:[],messages:[]}));
  }, [open, user]);

  if (!open) return null;

  const submitAuth = async (event) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const payload = mode === "register"
        ? { firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password }
        : { email: form.email, password: form.password };
      const result = await api(`/auth/${mode === "register" ? "register" : "login"}`, { method: "POST", body: JSON.stringify(payload) });
      localStorage.setItem("impact_token", result.token); onAuthChange(result.user); setForm(emptyAuth);
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };

  const applyForBusiness = async (event) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      await api("/profile/business-application", { method: "POST", body: JSON.stringify(business) });
      onAuthChange({ ...user, business_tier: "pending" }); setShowBusiness(false); setMessage("Your Business Account application was sent for review.");
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };

  const signOut = async () => {
    try { await api("/auth/logout", { method: "POST" }); } catch { /* local sign-out still succeeds */ }
    localStorage.removeItem("impact_token"); onAuthChange(null); setMessage(""); setMode("signin");
  };

  const beginEdit = () => {
    setProfile({ first_name:user.first_name, last_name:user.last_name, email:user.email, bio:user.bio || "", occupation:user.occupation || "", avatar_url:user.avatar_url || "" });
    setMessage(""); setEditing(true);
  };

  const selectAvatar = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setMessage("Please select an image file."); return; }
    if (file.size > 2 * 1024 * 1024) { setMessage("Please select an image smaller than 2 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setProfile((current) => ({ ...current, avatar_url: reader.result }));
    reader.readAsDataURL(file);
  };

  const selectBusinessImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setMessage("Please select an image file."); return; }
    if (file.size > 2 * 1024 * 1024) { setMessage("Please select a business image smaller than 2 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setBusiness((current) => ({ ...current, image_url: reader.result }));
    reader.readAsDataURL(file);
  };

  const saveProfile = async (event) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try { const result = await api("/profile", { method:"PATCH", body:JSON.stringify(profile) }); onAuthChange(result.user); setEditing(false); setMessage("Profile updated successfully."); }
    catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };
  const selectOwnedBusinessImage=(event)=>{const file=event.target.files?.[0];if(!file)return;if(file.size>2*1024*1024){setMessage("Please select a business image smaller than 2 MB.");return;}const reader=new FileReader();reader.onload=()=>setOwnedBusiness(current=>({...current,image_url:reader.result}));reader.readAsDataURL(file);};
  const selectBusinessGallery=async(event)=>{const files=[...(event.target.files||[])].slice(0,5);if(files.some(file=>file.size>2*1024*1024)){setMessage("Each gallery image must be smaller than 2 MB.");return;}const images=await Promise.all(files.map(file=>new Promise(resolve=>{const reader=new FileReader();reader.onload=()=>resolve({image_url:reader.result});reader.readAsDataURL(file);})));setOwnedBusiness(current=>({...current,images}));};
  const saveBusiness=async(event)=>{event.preventDefault();setBusy(true);setMessage("");try{const result=await api("/profile/business",{method:"PATCH",body:JSON.stringify({...ownedBusiness,images:ownedBusiness.images||[]})});setEditingBusiness(false);setMessage(result.message);}catch(error){setMessage(error.message);}finally{setBusy(false);}};

  return (
    <div className="modalBackdrop" onMouseDown={onClose} role="presentation">
      <section className="profileModal" role="dialog" aria-modal="true" aria-labelledby="profile-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modalClose" type="button" onClick={onClose} aria-label="Close profile">×</button>
        {user ? (
          <>
            <div className="profileHeading">
              <div className="profileAvatar">{user.avatar_url ? <img src={user.avatar_url} alt={`${user.first_name} ${user.last_name}`} /> : <>{user.first_name[0]}{user.last_name[0]}</>}</div>
              <div><p className="eyebrow"><SiteText contentKey="ProfileModal.271c62fa2deb">{"My profile"}</SiteText></p><h2 id="profile-title">{user.first_name} {user.last_name} {user.sponsor_badge?<span className="sponsorBadge" title="Approved community reward sponsor"><SiteText contentKey="ProfileModal.94ef563338d4">{"★ Sponsor"}</SiteText></span>:null}</h2><p>{user.email}</p>{user.occupation&&<p className="profileOccupation">{user.occupation}</p>}</div>
            </div>
            {editing ? (
              <form className="profileForm editProfileForm" onSubmit={saveProfile}>
                <div className="avatarEditor">
                  <div className="profileAvatar previewAvatar">{profile.avatar_url ? <img src={profile.avatar_url} alt="Profile preview" /> : <>{profile.first_name[0]}{profile.last_name[0]}</>}</div>
                  <label className="uploadButton"><SiteText contentKey="ProfileModal.0aa62f7898f3">{"Upload picture"}</SiteText><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={selectAvatar} /></label>
                  {profile.avatar_url && <button className="textButton" type="button" onClick={() => setProfile({...profile,avatar_url:""})}><SiteText contentKey="ProfileModal.1bc6f23b5304">{"Remove picture"}</SiteText></button>}
                </div>
                <div className="formRow"><label><SiteText contentKey="ProfileModal.702ef921ed1d">{"First name"}</SiteText><input required value={profile.first_name} onChange={(e)=>setProfile({...profile,first_name:e.target.value})} /></label><label><SiteText contentKey="ProfileModal.7b4888049459">{"Last name"}</SiteText><input required value={profile.last_name} onChange={(e)=>setProfile({...profile,last_name:e.target.value})} /></label></div>
                <label><SiteText contentKey="ProfileModal.f2488fd4ef4a">{"Email address"}</SiteText><input required type="email" value={profile.email} onChange={(e)=>setProfile({...profile,email:e.target.value})} /></label>
                <label><SiteText contentKey="ProfileModal.04eb246f6e46">{"Occupation (optional)"}</SiteText><input maxLength={100} value={profile.occupation} placeholder="e.g. Teacher, Electrician, Small business owner" onChange={e=>setProfile({...profile,occupation:e.target.value})} /><span className="fieldHint"><SiteText contentKey="ProfileModal.4a05e159e9e5">{"Visible on your member card"}</SiteText></span></label>
                <label><SiteText contentKey="ProfileModal.1359ec883b21">{"About me"}</SiteText><textarea maxLength="500" value={profile.bio} onChange={(e)=>setProfile({...profile,bio:e.target.value})} /><span className="fieldHint">{profile.bio.length}<SiteText contentKey="ProfileModal.cff989c347d3">{"/500 characters"}</SiteText></span></label>
                {message && <p className="formMessage" role="alert">{message}</p>}
                <div className="formActions"><button type="button" className="secondaryButton" onClick={()=>setEditing(false)}><SiteText contentKey="ProfileModal.19766ed6ccb2">{"Cancel"}</SiteText></button><button className="primaryButton" disabled={busy}><SiteText section="ProfileModal">{busy?"Saving…":"Save profile"}</SiteText></button></div>
              </form>
            ) : <button className="editProfileButton secondaryButton" type="button" onClick={beginEdit}><SiteText contentKey="ProfileModal.15c4aa13037e">{"Edit profile"}</SiteText></button>}
            <div className="profileStats">
              <div><strong>{user.points}</strong><span><SiteText contentKey="ProfileModal.76e98b9490ca">{"Reward points"}</SiteText></span></div>
              <div><strong>{user.role}</strong><span><SiteText contentKey="ProfileModal.ad8cbd037148">{"Account role"}</SiteText></span></div>
              <div><strong>{user.business_tier}</strong><span><SiteText contentKey="ProfileModal.134d540f4780">{"Business tier"}</SiteText></span></div>
            </div>
            <div className="profileLinks"><span>{profileEvents.saved.length}<SiteText contentKey="ProfileModal.fd2d2cd432de">{" saved events"}</SiteText></span><span><SiteText contentKey="ProfileModal.32ec26e19488">{"Bookmarked posts"}</SiteText></span><span>{profileRewards.redeemed.length}<SiteText contentKey="ProfileModal.50f7ee4f6ae7">{" rewards claimed"}</SiteText></span></div>
            <section className="profileEventSection">
              <div className="profileSectionHeading"><div><p className="eyebrow"><SiteText contentKey="ProfileModal.79940bab3cb4">{"My event queue"}</SiteText></p><h3><SiteText contentKey="ProfileModal.82eec65d6f96">{"Saved events"}</SiteText></h3></div><span>{profileEvents.saved.length}</span></div>
              {profileEvents.saved.length ? <div className="savedEventList">{profileEvents.saved.slice(0,4).map(event=><div key={event.id}><span>◇</span><p><strong>{event.title}</strong><small>{new Date(event.starts_at).toLocaleDateString("en-US",{month:"short",day:"numeric"})} · {event.location}</small></p></div>)}</div> : <p className="profileEmptyState"><SiteText contentKey="ProfileModal.b65784fb2855">{"Save an event and it will appear in your queue."}</SiteText></p>}
            </section>
            <section className="profileEventSection attendedEvents">
              <div className="profileSectionHeading"><div><p className="eyebrow"><SiteText contentKey="ProfileModal.61ff0d291ae1">{"Events attended"}</SiteText></p><h3><SiteText contentKey="ProfileModal.1d6b64ffd5c1">{"My ticket collection"}</SiteText></h3></div><span>{profileEvents.attended.length}</span></div>
              {profileEvents.attended.length ? <div className="ticketCollection">{profileEvents.attended.map(event=><div className="profileTicket" key={event.id}><span aria-hidden="true">🎟</span><p><strong>{event.title}</strong><small>+{event.points_awarded}<SiteText contentKey="ProfileModal.b3c577bf3c50">{" points earned"}</SiteText></small></p></div>)}</div> : <p className="profileEmptyState"><SiteText contentKey="ProfileModal.576471a4779f">{"Enter an attendance code after an event to earn your first ticket."}</SiteText></p>}
            </section>
            <section className="profileEventSection profileRewardsSection">
              <div className="profileSectionHeading"><div><p className="eyebrow"><SiteText contentKey="ProfileModal.60da60dfe461">{"My rewards"}</SiteText></p><h3><SiteText contentKey="ProfileModal.c14d5e8c2e18">{"Claimed collection"}</SiteText></h3></div><span>{profileRewards.redeemed.length}</span></div>
              {profileRewards.redeemed.length?<div className="profileRewardList">{profileRewards.redeemed.map(reward=><div key={reward.id}><div style={{backgroundImage:`url(${reward.image_url||'/images/banner.png'})`}}></div><p><strong>{reward.name}</strong><small>{reward.points_spent.toLocaleString()}<SiteText contentKey="ProfileModal.3d774bc968f5">{" points · "}</SiteText>{reward.sponsor_name}</small></p></div>)}</div>:<p className="profileEmptyState"><SiteText contentKey="ProfileModal.5cd7217486f8">{"Redeem your points and your rewards will be kept here."}</SiteText></p>}
              {profileRewards.donations.length>0&&<div className="donationStatusList"><strong><SiteText contentKey="ProfileModal.8c74141f01a9">{"My donated rewards"}</SiteText></strong>{profileRewards.donations.map(item=><p key={item.id}><span>{item.name}</span><em className={`donationStatus ${item.status}`}>{item.status}</em></p>)}</div>}
            </section>
            {(socialInbox.invitations.length>0||socialInbox.messages.length>0)&&<section className="profileEventSection socialInbox"><div className="profileSectionHeading"><div><p className="eyebrow"><SiteText contentKey="ProfileModal.7aabcd8771c4">{"Community inbox"}</SiteText></p><h3><SiteText contentKey="ProfileModal.aff81808ea56">{"Invitations & messages"}</SiteText></h3></div><span>{socialInbox.invitations.length+socialInbox.messages.length}</span></div>{socialInbox.invitations.map(item=><div className="socialInboxItem" key={`invite-${item.id}`}><span>◫</span><p><strong>{item.first_name} {item.last_name}<SiteText contentKey="ProfileModal.e96bfc193c4b">{" invited you"}</SiteText></strong><small>{item.title} · {new Date(item.starts_at).toLocaleDateString()}</small></p></div>)}{socialInbox.messages.map(item=><InboxMessage key={`${user.id}-${item.id}`} item={item}/> )}</section>}
            {message && !editing && <p className="formMessage" role="status">{message}</p>}
            {user.business_tier === "standard" && !showBusiness && <button className="primaryButton" type="button" onClick={() => setShowBusiness(true)}><SiteText contentKey="ProfileModal.ba4c5705edb4">{"Apply for a Business Account"}</SiteText></button>}
            {user.business_tier === "pending" && <p className="pendingNote"><SiteText contentKey="ProfileModal.24fa88186972">{"Your Business Account application is awaiting board approval."}</SiteText></p>}
            {ownedBusiness&&!editingBusiness&&<section className="ownedBusinessSummary"><div style={{backgroundImage:`url(${ownedBusiness.image_url||'/images/impDirectory.png'})`}}></div><div><p className="eyebrow"><SiteText contentKey="ProfileModal.8a08f1a5ee3a">{"My business profile"}</SiteText></p><h3>{ownedBusiness.name}</h3><p>{ownedBusiness.category} · {ownedBusiness.status}</p></div><button className="secondaryButton" onClick={()=>setEditingBusiness(true)}><SiteText contentKey="ProfileModal.93a3582040aa">{"Edit business"}</SiteText></button></section>}
            {ownedBusiness&&editingBusiness&&<form className="profileForm businessForm ownedBusinessForm" onSubmit={saveBusiness}><h3><SiteText contentKey="ProfileModal.b10ac6c11787">{"Edit business profile"}</SiteText></h3><div className="businessImageUpload"><div className="businessImagePreview" style={{backgroundImage:`url(${ownedBusiness.image_url||'/images/impDirectory.png'})`}}><span><SiteText contentKey="ProfileModal.b62cee9371b0">{"Cover image"}</SiteText></span></div><label className="uploadButton"><SiteText contentKey="ProfileModal.02833c2a3372">{"Change cover image"}</SiteText><input type="file" accept="image/png,image/jpeg,image/webp" onChange={selectOwnedBusinessImage}/></label></div><div className="formRow"><label><SiteText contentKey="ProfileModal.a921756ed1cc">{"Business name"}</SiteText><input required value={ownedBusiness.name} onChange={event=>setOwnedBusiness({...ownedBusiness,name:event.target.value})}/></label><label><SiteText contentKey="ProfileModal.292c06f0045a">{"Category"}</SiteText><select required value={ownedBusiness.category} onChange={event=>setOwnedBusiness({...ownedBusiness,category:event.target.value})}>{businessCategories.map(category=><option key={category}>{category}</option>)}</select></label></div><label><SiteText contentKey="ProfileModal.526e0087cc3f">{"Description"}</SiteText><textarea value={ownedBusiness.description||""} onChange={event=>setOwnedBusiness({...ownedBusiness,description:event.target.value})}/></label><div className="formRow"><label><SiteText contentKey="ProfileModal.b5a229ac8bec">{"Website"}</SiteText><input type="url" value={ownedBusiness.website||""} onChange={event=>setOwnedBusiness({...ownedBusiness,website:event.target.value})}/></label><label><SiteText contentKey="ProfileModal.63dceb8800b2">{"Phone"}</SiteText><input value={ownedBusiness.phone||""} onChange={event=>setOwnedBusiness({...ownedBusiness,phone:event.target.value})}/></label></div><label><SiteText contentKey="ProfileModal.56ef8f20955f">{"Address"}</SiteText><input value={ownedBusiness.address||""} onChange={event=>setOwnedBusiness({...ownedBusiness,address:event.target.value})}/></label><div className="businessGalleryEditor"><div><strong><SiteText contentKey="ProfileModal.1f106c1d188b">{"Business gallery"}</SiteText></strong><small><SiteText contentKey="ProfileModal.1cacdf3c9293">{"Add up to five images of your location, products, team, or work."}</SiteText></small></div><label className="uploadButton"><SiteText contentKey="ProfileModal.eefd92138ffe">{"Choose gallery images"}</SiteText><input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={selectBusinessGallery}/></label><div className="businessGalleryPreview">{(ownedBusiness.images||[]).map((image,index)=><span key={`${image.image_url}-${index}`} style={{backgroundImage:`url(${image.image_url})`}}><button type="button" onClick={()=>setOwnedBusiness({...ownedBusiness,images:ownedBusiness.images.filter((_,itemIndex)=>itemIndex!==index)})}>×</button></span>)}</div></div><div className="formActions"><button type="button" className="secondaryButton" onClick={()=>setEditingBusiness(false)}><SiteText contentKey="ProfileModal.19766ed6ccb2">{"Cancel"}</SiteText></button><button className="primaryButton" disabled={busy}><SiteText section="ProfileModal">{busy?"Saving…":"Save business profile"}</SiteText></button></div></form>}
            {showBusiness && (
              <form className="profileForm businessForm" onSubmit={applyForBusiness}>
                <h3><SiteText contentKey="ProfileModal.8fd5ae966991">{"Business Account application"}</SiteText></h3>
                <div className="businessImageUpload">
                  <div className="businessImagePreview" style={business.image_url ? { backgroundImage:`url(${business.image_url})` } : undefined}><span><SiteText section="ProfileModal">{business.image_url ? "Image selected" : "Business image"}</SiteText></span></div>
                  <label className="uploadButton"><SiteText contentKey="ProfileModal.00d748af68a1">{"Upload business picture"}</SiteText><input type="file" accept="image/png,image/jpeg,image/webp" onChange={selectBusinessImage} /></label>
                </div>
                <div className="formRow"><label><SiteText contentKey="ProfileModal.a921756ed1cc">{"Business name"}</SiteText><input required value={business.name} onChange={(e) => setBusiness({...business,name:e.target.value})} /></label><label><SiteText contentKey="ProfileModal.292c06f0045a">{"Category"}</SiteText><select required value={business.category} onChange={(e) => setBusiness({...business,category:e.target.value})}><option value=""><SiteText contentKey="ProfileModal.b11f4a82b989">{"Select a category"}</SiteText></option>{businessCategories.map(category=><option key={category}>{category}</option>)}</select></label></div>
                <label><SiteText contentKey="ProfileModal.526e0087cc3f">{"Description"}</SiteText><textarea value={business.description} onChange={(e) => setBusiness({...business,description:e.target.value})} /></label>
                <div className="formRow"><label><SiteText contentKey="ProfileModal.b5a229ac8bec">{"Website"}</SiteText><input type="url" value={business.website} onChange={(e) => setBusiness({...business,website:e.target.value})} /></label><label><SiteText contentKey="ProfileModal.63dceb8800b2">{"Phone"}</SiteText><input value={business.phone} onChange={(e) => setBusiness({...business,phone:e.target.value})} /></label></div>
                <label><SiteText contentKey="ProfileModal.56ef8f20955f">{"Address"}</SiteText><input value={business.address} onChange={(e) => setBusiness({...business,address:e.target.value})} /></label>
                <div className="formActions"><button type="button" className="secondaryButton" onClick={() => setShowBusiness(false)}><SiteText contentKey="ProfileModal.19766ed6ccb2">{"Cancel"}</SiteText></button><button className="primaryButton" disabled={busy}><SiteText contentKey="ProfileModal.e977bbb06831">{"Submit application"}</SiteText></button></div>
              </form>
            )}
            <button className="textButton" type="button" onClick={signOut}><SiteText contentKey="ProfileModal.48f0d3d397d4">{"Sign out"}</SiteText></button>
          </>
        ) : (
          <>
            <p className="eyebrow"><SiteText contentKey="ProfileModal.db78fb3cad2e">{"Impact Arlington"}</SiteText></p><h2 id="profile-title"><SiteText section="ProfileModal">{mode === "signin" ? "Welcome back" : "Join the community"}</SiteText></h2>
            <img src="/images/signupimp.png" alt="" className="signer" />
            <div className="authTabs"><button className={mode === "signin" ? "active" : ""} type="button" onClick={() => {setMode("signin");setMessage("");}}><SiteText contentKey="ProfileModal.bfd402b2f6f3">{"Sign in"}</SiteText></button><button className={mode === "register" ? "active" : ""} type="button" onClick={() => {setMode("register");setMessage("");}}><SiteText contentKey="ProfileModal.bb7234ec1245">{"Register"}</SiteText></button></div>
            <form className="profileForm" onSubmit={submitAuth}>
              {mode === "register" && <div className="formRow"><label><SiteText contentKey="ProfileModal.702ef921ed1d">{"First name"}</SiteText><input required autoComplete="given-name" value={form.firstName} onChange={(e) => setForm({...form,firstName:e.target.value})} /></label><label><SiteText contentKey="ProfileModal.7b4888049459">{"Last name"}</SiteText><input required autoComplete="family-name" value={form.lastName} onChange={(e) => setForm({...form,lastName:e.target.value})} /></label></div>}
              <label><SiteText contentKey="ProfileModal.f2488fd4ef4a">{"Email address"}</SiteText><input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({...form,email:e.target.value})} /></label>
              <label><SiteText contentKey="ProfileModal.e7cf3ef4f17c">{"Password"}</SiteText><input required minLength="8" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={form.password} onChange={(e) => setForm({...form,password:e.target.value})} /></label>
              {message && <p className="formMessage" role="alert">{message}</p>}
              <button className="primaryButton" disabled={busy}><SiteText section="ProfileModal">{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create profile"}</SiteText></button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

export default ProfileModal;
