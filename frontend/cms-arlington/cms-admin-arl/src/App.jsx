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
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [user, setUser] = useState(null);
  useEffect(() => {
    if (!localStorage.getItem("impact_token")) return;
    api("/auth/me").then(({ user: profile }) => setUser(profile)).catch(() => localStorage.removeItem("impact_token"));
  }, []);
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
      <footer className="siteFooter"><div><strong>impact / Arlington</strong><p>A community within the community.</p></div><nav aria-label="More about Impact">{[["Vision", "Our vision"], ["Rules", "Community rules"], ["Highlights", "Highlights"], ["Admin", "Admin"]].map(([page, label]) => <button key={page} onClick={() => setCurrentComponent(page)} aria-current={currentComponent === page ? "page" : undefined}>{label}</button>)}</nav><span>Better together. Right here.</span></footer>
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} user={user} onAuthChange={setUser} />
      <RewardsModal open={rewardsOpen} onClose={() => setRewardsOpen(false)} user={user} onAuthChange={setUser} onProfileClick={() => setProfileOpen(true)} />
    </>
  );
}

export default App;
