import SiteText from "./components/SiteText";
import { useEffect, useState } from "react";
import "./App.css";
import Notifications from "./components/Notifications";
import Nav from "./components/Nav";
import AdminDash from './pages/AdminDash'
import Directory from './pages/Directory'
import EventMain from './pages/EventMain'
import Members from './pages/Members'
import Store from "./pages/Store";
import Homepage from "./pages/Homepage";
import ProfileModal from "./components/ProfileModal";
import RewardsModal from "./components/RewardsModal";
import JoinUs from "./components/JoinUs";
import { api } from "./lib/api";

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem("impact_darkMode") === "true"; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle("darkMode", darkMode);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", darkMode ? "#1e293b" : "#ffffff");
    try { localStorage.setItem("impact_darkMode", String(darkMode)); } catch { /* Theme works when storage is unavailable. */ }
  }, [darkMode]);
  const [currentComponent, setCurrentComponent] = useState(()=>new URLSearchParams(window.location.search).get("page")==="Store"?"Store":"Homepage")
  const [profileOpen, setProfileOpen] = useState(()=>new URLSearchParams(window.location.hash.slice(1)).has("reset-password"));
  useEffect(()=>{const followResetLink=()=>{if(new URLSearchParams(window.location.hash.slice(1)).has("reset-password"))setProfileOpen(true);};window.addEventListener("hashchange",followResetLink);return()=>window.removeEventListener("hashchange",followResetLink);},[]);
  const [rewardsOpen, setRewardsOpen] = useState(()=>new URLSearchParams(window.location.search).has("incentive"));
  const [user, setUser] = useState(null);
  useEffect(() => {
    if (!localStorage.getItem("impact_token")) return;
    api("/auth/me").then(({ user: profile }) => setUser(profile)).catch(() => localStorage.removeItem("impact_token"));
  }, []);
  const memberId=user?.id;
  useEffect(()=>{if(!memberId)return;let active=true;api('/incentives/website',{method:'POST'}).then(result=>{if(active)setUser(current=>current?.id===memberId&&current.points!==result.user.points?{...current,points:result.user.points}:current);}).catch(()=>{});return()=>{active=false;};},[memberId]);
  return (
    <>
      {/* Nav */}
      <Nav darkMode={darkMode} onToggleDarkMode={()=>setDarkMode(current=>!current)} currentComponent={currentComponent} setCurrentComponent={setCurrentComponent} user={user} onProfileClick={() => setProfileOpen(true)} onRewardsClick={() => setRewardsOpen(true)}/>
      {user && <Notifications key={user.id} userId={user.id} onOpenInbox={()=>setProfileOpen(true)} onOpenEvents={()=>setCurrentComponent("Events")} />}
      <div id="main-content" tabIndex={-1}>
      {/* TopDisplay */}
      { currentComponent === "Homepage" ? <Homepage onNavigate={setCurrentComponent} onProfileClick={() => setProfileOpen(true)} /> :null}
      { currentComponent === "Admin" ? <AdminDash user={user} /> :null}
      { currentComponent === "Directory" ? <Directory /> :null}
      { currentComponent === "Events" ? <EventMain user={user} onAuthChange={setUser} onProfileClick={() => setProfileOpen(true)} /> :null}
      { currentComponent === "Store" && <Store user={user} onProfileClick={()=>setProfileOpen(true)}/> }
      { currentComponent === "Members" ? <Members user={user} onProfileClick={() => setProfileOpen(true)} /> :null}
      {["Community", "Vision", "Rules", "Highlights"].includes(currentComponent) && <JoinUs currentObj={{contentTitle: {Community: "Community Hub", Vision: "Vision", Rules: "Community Rules", Highlights: "Make An Impact"}[currentComponent]}} user={user} onProfileClick={() => setProfileOpen(true)} />}
      </div>
      <footer className="siteFooter"><div><strong><SiteText contentKey="App.86dc93dee38c">{"impact / Arlington"}</SiteText></strong><p><SiteText contentKey="App.471e88cea8b6">{"A community within the community."}</SiteText></p></div><nav aria-label="More about Impact">{[["Vision", "Our vision"], ["Rules", "Community rules"], ["Highlights", "Highlights"], ["Admin", "Admin"]].map(([page, label]) => <button key={page} onClick={() => setCurrentComponent(page)} aria-current={currentComponent === page ? "page" : undefined}><SiteText section="App">{label}</SiteText></button>)}</nav><span><SiteText contentKey="App.6584e3b201f3">{"Better together. Right here."}</SiteText></span></footer>
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} user={user} onAuthChange={updated=>{setUser(updated);if(updated&&new URLSearchParams(window.location.search).has("incentive")){setProfileOpen(false);setRewardsOpen(true);}}} />
      <RewardsModal onEvents={()=>setCurrentComponent("Events")} open={rewardsOpen} onClose={() => setRewardsOpen(false)} user={user} onAuthChange={setUser} onProfileClick={() => setProfileOpen(true)} />
    </>
  );
}

export default App;
