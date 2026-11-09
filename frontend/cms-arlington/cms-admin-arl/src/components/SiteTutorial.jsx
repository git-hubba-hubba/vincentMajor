import { IconText, IconSymbol } from "./Icon";
import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

const steps = [
  { page: "Homepage", title: "Welcome to Impact Arlington", icon: "⌂", text: "This is your starting point for connecting with neighbors, local businesses, and community opportunities. Follow this tour to earn 25 points once per account." },
  { page: "Community", title: "Discover your community", icon: "♡", text: "The Community Hub brings together local stories, resources, and updates. Explore what is happening around Arlington." },
  { page: "Directory", title: "Find local businesses", icon: "⌕", text: "Browse the directory to discover businesses and services in your community and find your next local favorite." },
  { page: "Events", title: "Show up and make an impact", icon: "◷", text: "Explore upcoming events, register for activities, and check in when you attend to earn event points." },
  { page: "Members", title: "Meet your neighbors", icon: "☺", text: "Find members, explore profiles, and sign in to send messages or invite someone to an event." },
  { page: "Store", title: "Shop the Impact store", icon: "bag", text: "Explore available Impact products. Your profile also keeps your account details and community activity in one place." },
  { page: "Homepage", title: "Turn your points into rewards", icon: "✧", text: "Use Rewards in the header to see your balance, discover ways to earn points, and redeem available perks. Finish this tour to claim your 25-point bonus!" },
];

export default function SiteTutorial({ user, onAuthChange, onClose, onNavigate, onProfileClick, paused }) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const dialog = useRef(null);
  const item = steps[step];
  useEffect(() => { onNavigate(item.page); window.scrollTo({ top: 0, behavior: "smooth" }); }, [item.page, onNavigate]);
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    if (!paused) element.showModal();
    return () => { element.close(); previous?.focus(); };
  }, [paused]);
  async function finish() {
    if (!user) { onProfileClick(); return; }
    setBusy(true); setError("");
    try {
      const response = await api("/tutorial/complete", { method: "POST" });
      onAuthChange(response.user);
      setResult(response.awarded ? "You earned 25 points!" : "You already earned your 25 tutorial points.");
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <dialog ref={dialog} className="siteTutorial" aria-labelledby="tutorial-title" onCancel={event=>{event.preventDefault();if(!busy)onClose();}}>
    <button type="button" className="tutorialClose" aria-label="Close tutorial" disabled={busy} onClick={onClose}><IconText>×</IconText></button>
    <p className="tutorialProgress">SITE TOUR · {step + 1} OF {steps.length}</p>
    <progress value={step + 1} max={steps.length} aria-label="Tutorial progress" />
    <div aria-live="polite"><span className="tutorialIcon" aria-hidden="true"><IconSymbol value={result ? "✓" : item.icon}/></span>
    <h2 id="tutorial-title">{result || item.title}</h2>
    <p>{result ? "Your balance is up to date. Click the Impact logo any time to take another tour." : item.text}</p></div>
    {error && <p role="alert">{error}</p>}
    {!user && step === steps.length - 1 && <p>Sign in or create an account to claim your bonus, then return here to finish.</p>}
    <div className="tutorialActions">
      {result ? <button className="primaryButton" onClick={onClose}>Explore the site</button> : <>
        <button className="secondaryButton" disabled={step===0 || busy} onClick={()=>setStep(value=>value-1)}>Back</button>
        {step < steps.length-1 ? <button className="primaryButton" onClick={()=>setStep(value=>value+1)}><IconText>Next →</IconText></button> : <button className="primaryButton" disabled={busy} onClick={finish}>{busy ? "Claiming…" : user ? "Finish & claim 25 points" : "Sign in to claim 25 points"}</button>}
      </>}
    </div>
  </dialog>;
}
