import SiteText from "./components/SiteText";
import { useEffect, useState } from "react";
import "./App.css";
import Nav from "./components/Nav";
import AdminDash from './pages/AdminDash'
import Directory from './pages/Directory'
import EventMain from './pages/EventMain'
import Members from './pages/Members'
import Homepage from "./pages/Homepage";
import ProfileModal from "./components/ProfileModal";
import RewardsModal from "./components/RewardsModal";
import JoinUs from "./components/JoinUs";
import { api } from "./lib/api";

function App() {
  const [currentComponent, setCurrentComponent] = useState("Homepage")
  const [profileOpen, setProfileOpen] = useState(false);
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
      <Nav currentComponent={currentComponent} setCurrentComponent={setCurrentComponent} user={user} onProfileClick={() => setProfileOpen(true)} onRewardsClick={() => setRewardsOpen(true)}/>
      <div id="main-content" tabIndex={-1}>
      {/* TopDisplay */}
      { currentComponent === "Homepage" ? <Homepage onNavigate={setCurrentComponent} onProfileClick={() => setProfileOpen(true)} /> :null}
      { currentComponent === "Admin" ? <AdminDash user={user} /> :null}
      { currentComponent === "Directory" ? <Directory /> :null}
      { currentComponent === "Events" ? <EventMain user={user} onAuthChange={setUser} onProfileClick={() => setProfileOpen(true)} /> :null}
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
