import { useEffect, useState } from "react";

const confetti = Array.from({ length: 110 }, (_, index) => {
  const angle = index * 2.39996;
  const spread = 150 + (index % 13) * 32;
  return {
    x: Math.cos(angle) * spread,
    y: -100 - Math.abs(Math.sin(angle)) * spread * .65,
    fall: 250 + (index % 9) * 55,
    turn: (index % 2 ? 1 : -1) * (280 + index * 17),
    color: ['#ffffff', '#7dd3fc', '#38bdf8', '#dbeafe', '#60a5fa'][index % 5],
  };
});

export default function LogoSplash({ onComplete }) {
  const [hits, setHits] = useState(0);
  const celebrating = hits === 5;
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);
  useEffect(() => {
    if (!celebrating) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(onComplete, reduced ? 150 : 2100);
    return () => clearTimeout(timer);
  }, [celebrating, onComplete]);
  return <section className={`logoSplash${celebrating ? ' logoSplashCelebrating' : ''}`} aria-label="Welcome to Impact Arlington">
    <div className="splashGlow" aria-hidden="true" />
    <p className="splashEyebrow">Arlington, Texas · A community within the community</p>
    <button type="button" className="splashLogoButton" disabled={celebrating}
      aria-label={`Pop the logo piñata to enter. ${hits} of 5 clicks complete.`}
      onClick={() => setHits(current => Math.min(5, current + 1))}>
      <img key={hits} className={`splashLogo${hits ? ' splashLogoBounce' : ''}`} src="/images/impact-official-logo.png" alt="IMPACT — Walk With Us" width="2062" height="778" />
      {Array.from({ length: hits }, (_, burst) => <span key={burst} className="splashConfettiBurst" aria-hidden="true">
        {confetti.slice(0, burst === 4 ? 110 : 26).map((piece, index) => <span key={index}
          className={`splashConfetti${index % 3 === 0 ? ' splashConfettiRound' : ''}`}
          style={{ '--confetti-x': `${piece.x * (burst === 4 ? 1 : .55)}px`, '--confetti-y': `${piece.y}px`, '--confetti-fall': `${piece.fall}px`, '--confetti-turn': `${piece.turn}deg`, '--confetti-color': piece.color, '--confetti-delay': `${index % 7 * 16}ms` }} />)}
      </span>)}
    </button>
    <div className="splashInstructions" aria-live="polite">
      <h1>{celebrating ? 'Make an impact!' : hits ? 'Keep the celebration going.' : 'Make your entrance.'}</h1>
      <p>{celebrating ? 'Welcome to the community.' : `Click the logo ${5 - hits} ${5 - hits === 1 ? 'more time' : 'times'} for a confetti celebration.`}</p>
      <div className="splashProgress" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <span key={index} className={index < hits ? 'complete' : ''} />)}</div>
    </div>
  </section>;
}
