import { useEffect, useState } from "react";
import { api } from "../lib/api";
import businessCategories from "../data/businessCategories";

const emptyAuth = { firstName: "", lastName: "", email: "", password: "" };
const emptyBusiness = { name: "", category: "", description: "", image_url: "", website: "", phone: "", address: "" };

function ProfileModal({ open, onClose, user, onAuthChange }) {
  const [mode, setMode] = useState("signin");
  const [form, setForm] = useState(emptyAuth);
  const [business, setBusiness] = useState(emptyBusiness);
  const [showBusiness, setShowBusiness] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({ first_name: "", last_name: "", email: "", bio: "", avatar_url: "" });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [profileEvents, setProfileEvents] = useState({ saved: [], attended: [] });

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !user) return;
    api("/profile/events").then(setProfileEvents).catch(() => setProfileEvents({ saved:[], attended:[] }));
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
    setProfile({ first_name:user.first_name, last_name:user.last_name, email:user.email, bio:user.bio || "", avatar_url:user.avatar_url || "" });
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

  return (
    <div className="modalBackdrop" onMouseDown={onClose} role="presentation">
      <section className="profileModal" role="dialog" aria-modal="true" aria-labelledby="profile-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modalClose" type="button" onClick={onClose} aria-label="Close profile">×</button>
        {user ? (
          <>
            <div className="profileHeading">
              <div className="profileAvatar">{user.avatar_url ? <img src={user.avatar_url} alt={`${user.first_name} ${user.last_name}`} /> : <>{user.first_name[0]}{user.last_name[0]}</>}</div>
              <div><p className="eyebrow">My profile</p><h2 id="profile-title">{user.first_name} {user.last_name}</h2><p>{user.email}</p></div>
            </div>
            {editing ? (
              <form className="profileForm editProfileForm" onSubmit={saveProfile}>
                <div className="avatarEditor">
                  <div className="profileAvatar previewAvatar">{profile.avatar_url ? <img src={profile.avatar_url} alt="Profile preview" /> : <>{profile.first_name[0]}{profile.last_name[0]}</>}</div>
                  <label className="uploadButton">Upload picture<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={selectAvatar} /></label>
                  {profile.avatar_url && <button className="textButton" type="button" onClick={() => setProfile({...profile,avatar_url:""})}>Remove picture</button>}
                </div>
                <div className="formRow"><label>First name<input required value={profile.first_name} onChange={(e)=>setProfile({...profile,first_name:e.target.value})} /></label><label>Last name<input required value={profile.last_name} onChange={(e)=>setProfile({...profile,last_name:e.target.value})} /></label></div>
                <label>Email address<input required type="email" value={profile.email} onChange={(e)=>setProfile({...profile,email:e.target.value})} /></label>
                <label>About me<textarea maxLength="500" value={profile.bio} onChange={(e)=>setProfile({...profile,bio:e.target.value})} /><span className="fieldHint">{profile.bio.length}/500 characters</span></label>
                {message && <p className="formMessage" role="alert">{message}</p>}
                <div className="formActions"><button type="button" className="secondaryButton" onClick={()=>setEditing(false)}>Cancel</button><button className="primaryButton" disabled={busy}>{busy?"Saving…":"Save profile"}</button></div>
              </form>
            ) : <button className="editProfileButton secondaryButton" type="button" onClick={beginEdit}>Edit profile</button>}
            <div className="profileStats">
              <div><strong>{user.points}</strong><span>Reward points</span></div>
              <div><strong>{user.role}</strong><span>Account role</span></div>
              <div><strong>{user.business_tier}</strong><span>Business tier</span></div>
            </div>
            <div className="profileLinks"><span>{profileEvents.saved.length} saved events</span><span>Bookmarked posts</span><span>Rewards</span></div>
            <section className="profileEventSection">
              <div className="profileSectionHeading"><div><p className="eyebrow">My event queue</p><h3>Saved events</h3></div><span>{profileEvents.saved.length}</span></div>
              {profileEvents.saved.length ? <div className="savedEventList">{profileEvents.saved.slice(0,4).map(event=><div key={event.id}><span>◇</span><p><strong>{event.title}</strong><small>{new Date(event.starts_at).toLocaleDateString("en-US",{month:"short",day:"numeric"})} · {event.location}</small></p></div>)}</div> : <p className="profileEmptyState">Save an event and it will appear in your queue.</p>}
            </section>
            <section className="profileEventSection attendedEvents">
              <div className="profileSectionHeading"><div><p className="eyebrow">Events attended</p><h3>My ticket collection</h3></div><span>{profileEvents.attended.length}</span></div>
              {profileEvents.attended.length ? <div className="ticketCollection">{profileEvents.attended.map(event=><div className="profileTicket" key={event.id}><span aria-hidden="true">🎟</span><p><strong>{event.title}</strong><small>+{event.points_awarded} points earned</small></p></div>)}</div> : <p className="profileEmptyState">Enter an attendance code after an event to earn your first ticket.</p>}
            </section>
            {message && !editing && <p className="formMessage" role="status">{message}</p>}
            {user.business_tier === "standard" && !showBusiness && <button className="primaryButton" type="button" onClick={() => setShowBusiness(true)}>Apply for a Business Account</button>}
            {user.business_tier === "pending" && <p className="pendingNote">Your Business Account application is awaiting board approval.</p>}
            {showBusiness && (
              <form className="profileForm businessForm" onSubmit={applyForBusiness}>
                <h3>Business Account application</h3>
                <div className="businessImageUpload">
                  <div className="businessImagePreview" style={business.image_url ? { backgroundImage:`url(${business.image_url})` } : undefined}><span>{business.image_url ? "Image selected" : "Business image"}</span></div>
                  <label className="uploadButton">Upload business picture<input type="file" accept="image/png,image/jpeg,image/webp" onChange={selectBusinessImage} /></label>
                </div>
                <div className="formRow"><label>Business name<input required value={business.name} onChange={(e) => setBusiness({...business,name:e.target.value})} /></label><label>Category<select required value={business.category} onChange={(e) => setBusiness({...business,category:e.target.value})}><option value="">Select a category</option>{businessCategories.map(category=><option key={category}>{category}</option>)}</select></label></div>
                <label>Description<textarea value={business.description} onChange={(e) => setBusiness({...business,description:e.target.value})} /></label>
                <div className="formRow"><label>Website<input type="url" value={business.website} onChange={(e) => setBusiness({...business,website:e.target.value})} /></label><label>Phone<input value={business.phone} onChange={(e) => setBusiness({...business,phone:e.target.value})} /></label></div>
                <label>Address<input value={business.address} onChange={(e) => setBusiness({...business,address:e.target.value})} /></label>
                <div className="formActions"><button type="button" className="secondaryButton" onClick={() => setShowBusiness(false)}>Cancel</button><button className="primaryButton" disabled={busy}>Submit application</button></div>
              </form>
            )}
            <button className="textButton" type="button" onClick={signOut}>Sign out</button>
          </>
        ) : (
          <>
            <p className="eyebrow">Impact Arlington</p><h2 id="profile-title">{mode === "signin" ? "Welcome back" : "Join the community"}</h2>
            <p className="modalIntro">{mode === "signin" ? "Sign in to manage events, bookmarks, and reward points." : "Create your free member profile."}</p>
            <img src="../../public/images/signupimp.png" alt="" className="signer" />
            <div className="authTabs"><button className={mode === "signin" ? "active" : ""} type="button" onClick={() => {setMode("signin");setMessage("");}}>Sign in</button><button className={mode === "register" ? "active" : ""} type="button" onClick={() => {setMode("register");setMessage("");}}>Register</button></div>
            <form className="profileForm" onSubmit={submitAuth}>
              {mode === "register" && <div className="formRow"><label>First name<input required autoComplete="given-name" value={form.firstName} onChange={(e) => setForm({...form,firstName:e.target.value})} /></label><label>Last name<input required autoComplete="family-name" value={form.lastName} onChange={(e) => setForm({...form,lastName:e.target.value})} /></label></div>}
              <label>Email address<input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({...form,email:e.target.value})} /></label>
              <label>Password<input required minLength="8" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={form.password} onChange={(e) => setForm({...form,password:e.target.value})} /></label>
              {message && <p className="formMessage" role="alert">{message}</p>}
              <button className="primaryButton" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create profile"}</button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

export default ProfileModal;
