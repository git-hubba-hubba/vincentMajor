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
      <div className="navContainer">
        <div className="navTabs">
          <div className="ntabSm abril-fatface-regular" onClick={() => {
            setCurrentComponent('Admin')
          }}>
            Admin
          </div>
          <div className="ntabSm abril-fatface-regular" onClick={() => {
            setCurrentComponent('Directory')
          }}>
            Directory
          </div>
          <div className="ntabSm abril-fatface-regular" onClick={() => {
            setCurrentComponent('Events')
          }}>
            Events
          </div>
          <div className="ntabSm abril-fatface-regular" onClick={() => {
            setCurrentComponent('Members')
          }}>
            Members
          </div>
          
        </div>
      </div>
      {/* TopDisplay */}
      { currentComponent === "Homepage" ? <Homepage /> :null}
      { currentComponent === "Admin" ? <AdminDash user={user} /> :null}
      { currentComponent === "Directory" ? <Directory /> :null}
      { currentComponent === "Events" ? <EventMain user={user} onAuthChange={setUser} onProfileClick={() => setProfileOpen(true)} /> :null}
      { currentComponent === "Members" ? <Members user={user} onProfileClick={() => setProfileOpen(true)} /> :null}
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} user={user} onAuthChange={setUser} />
      <RewardsModal open={rewardsOpen} onClose={() => setRewardsOpen(false)} user={user} onAuthChange={setUser} onProfileClick={() => setProfileOpen(true)} />
    </>
  );
}

export default App;
