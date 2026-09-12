import { useState } from "react";

const panels = {
  About: { title: "A community within the community.", body: "Impact is more than a social platform. It’s a community hub where people come together to improve their lives and their community, with a focus on health, finances, entertainment, and the positive things in life." },
  FAQ: { title: "Participate in community events.", body: "Explore community events, connect with members, and discover ways to take part in Impact Arlington.", page: "Events", action: "Explore events" },
  Contact: { title: "Let’s make an impact.", body: "Want to advertise with us, launch Impact in your city, or have your corporation walk with us? Contact Vincent Jenkins, CEO / Founder." },
};
const paths = [
  { number: "01", title: "Find your people.", text: "Meet neighbors, share ideas, and build connections close to home.", page: "Members", action: "Meet the members", icon: "◎" },
  { number: "02", title: "Show up for local.", text: "Discover businesses, services, and partners in our community.", page: "Directory", action: "Explore the directory", icon: "⌂" },
  { number: "03", title: "Be part of something.", text: "Come together at community events and earn points for participating.", page: "Events", action: "Find an event", icon: "↗" },
];
function Homepage({ onNavigate, onProfileClick }) {
  const [tab, setTab] = useState("About");
  const panel = panels[tab];
  return <main className="homePage">
    <section className="homeHero">
      <div className="homeHeroCopy"><p className="sectionKicker"><span /> ROOTED IN ARLINGTON. BUILT ON CONNECTION.</p><h1>Good things<br />happen <em>together.</em></h1><p className="heroDescription">Your neighbors. Your local businesses. Your next great connection. A place to come together and make life a little better.</p><div className="heroActions"><button className="primaryButton" onClick={onProfileClick}>Find your place <span aria-hidden="true">↗</span></button><button className="heroTextButton" onClick={() => onNavigate("Community")}>Explore the community <span aria-hidden="true">→</span></button></div><div className="heroFootnote"><span aria-hidden="true">✳</span><p>More than a platform.<br /><strong>A place to belong.</strong></p></div></div>
      <div className="heroVisual"><div className="heroArtFrame"><img src="/images/community-main.jpg" alt="Community members in Impact shirts gathering around a café table" /><span className="imageLabel">THE POWER OF SHOWING UP.</span></div><div className="heroNote"><span aria-hidden="true">✳</span><div>Local people.<br /><strong>Lasting impact.</strong></div><small>ARLINGTON / TX</small></div><span className="heroSideNote">LIVE LIFE DIFFERENT.</span></div>
    </section>
    <div className="valuesStrip"><span>A little connection. A lot of possibility.</span><p>Health <b>✳</b> Finances <b>✳</b> Entertainment <b>✳</b> Positive living</p></div>
    <section className="homePaths"><div className="sectionHeading"><div><p className="sectionKicker">YOUR COMMUNITY STARTS HERE</p><h2>Small steps. <em>Real impact.</em></h2></div><p>There’s more than one way to belong.<br />Find the one that feels like you.</p></div><div className="pathGrid">{paths.map(path => <button className="pathCard" key={path.page} onClick={() => onNavigate(path.page)}><div className="pathCardTop"><span>{path.icon}</span><small>{path.number} / GET INVOLVED</small></div><h3>{path.title}</h3><p>{path.text}</p><div className="pathLink">{path.action}<span>↗</span></div></button>)}</div></section>
    <section className="homeStory"><div className="storyIntro"><p className="sectionKicker">THIS IS IMPACT ARLINGTON</p><span className="storyStar" aria-hidden="true">✳</span><p>Better lives.<br />Stronger communities.</p><button onClick={() => onNavigate("Vision")}>Discover our vision ↗</button></div><div className="storyContent"><div className="storyTabs" role="tablist" aria-label="About Impact">{Object.keys(panels).map(label => <button role="tab" id={`tab-${label}`} aria-controls="story-panel" aria-selected={tab === label} key={label} onClick={() => setTab(label)}>{label}</button>)}</div><div id="story-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}><h2>{panel.title}</h2><p>{panel.body}</p>{panel.page && <button className="textButton" onClick={() => onNavigate(panel.page)}>{panel.action} →</button>}{tab === "Contact" && <div className="contactLinks"><a href="tel:6823051503">682-305-1503 ↗</a><a href="mailto:impactingcities101@gmail.com">impactingcities101@gmail.com ↗</a></div>}</div></div></section>
    <section className="homeClosing"><div><p className="sectionKicker">YOU HAVE A PLACE HERE</p><h2>Let’s build something <em>good.</em></h2></div><button className="primaryButton" onClick={onProfileClick}>Join the community ↗</button></section>
  </main>;
}
export default Homepage;
