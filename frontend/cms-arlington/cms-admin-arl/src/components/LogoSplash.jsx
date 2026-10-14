import { useEffect, useId, useState } from "react";

const WIDTH = 1031;
const HEIGHT = 389;
// Fixed masonry joints: every piece uses the same original image coordinates.
const bricks = Array.from({ length: 4 }, (_, row) => {
  const edges = row % 2 ? [0, 103, 309, 515, 721, 927, WIDTH] : [0, 206, 412, 618, 824, WIDTH];
  return edges.slice(0, -1).map((left, col) => {
    const right = edges[col + 1];
    const top = row * HEIGHT / 4;
    const bottom = (row + 1) * HEIGHT / 4;
    const index = row * 6 + col;
    return {
      points: `${left},${top} ${right},${top} ${right},${bottom} ${left},${bottom}`,
      x: (left + right) / 2, y: (top + bottom) / 2,
      release: row === 3 && col === 0 ? 2 : row === 3 && col === 5 ? 3 : row === 2 && col === 0 ? 4 : 5,
      drift: ((left + right) / 2 - WIDTH / 2) * .22,
      turn: (index % 2 ? 1 : -1) * (8 + index % 5 * 4),
      delay: (3 - row) * 65 + col * 18,
    };
  });
}).flat();

export default function LogoSplash({ onComplete }) {
  const [hits, setHits] = useState(0);
  const id = useId().replaceAll(':', '');
  const breaking = hits === 5;
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);
  useEffect(() => {
    if (!breaking) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(onComplete, reduced ? 150 : 1700);
    return () => clearTimeout(timer);
  }, [breaking, onComplete]);
  return <section className={`logoSplash${breaking ? ' logoSplashBreaking' : ''}`} aria-label="Welcome to Impact Arlington">
    <div className="splashGlow" aria-hidden="true" />
    <p className="splashEyebrow">Arlington, Texas · A community within the community</p>
    <button type="button" className="splashLogoButton" disabled={breaking}
      aria-label={`Break through the brick logo to enter. ${hits} of 5 clicks complete.`}
      onClick={() => setHits(current => Math.min(5, current + 1))}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="splashBrickLogo" role="img" aria-label="IMPACT — Walk With Us">
        <defs>{bricks.map((brick, index) => <clipPath key={index} id={`${id}-brick-${index}`}><polygon points={brick.points} /></clipPath>)}</defs>
        {bricks.map((brick, index) => <g key={index} className={`splashBrick${hits >= brick.release ? ' splashBrickFalling' : ''}`}
          style={{ transformOrigin: `${brick.x}px ${brick.y}px`, '--brick-drift': `${brick.drift}px`, '--brick-turn': `${brick.turn}deg`, '--brick-delay': `${brick.delay}ms` }}>
          {hits >= brick.release && <polygon points={brick.points} transform="translate(0 6)" fill="#64748b" />}
          <image href="/images/impact-official-logo.png" width={WIDTH} height={HEIGHT} clipPath={`url(#${id}-brick-${index})`} />
          <polygon points={brick.points} className="splashMortar" style={{ opacity: hits ? Math.min(.85, hits * .22) : 0 }} />
        </g>)}
      </svg>
    </button>
    <div className="splashInstructions" aria-live="polite">
      <h1>{breaking ? 'Make an impact.' : hits ? 'Keep making an impact.' : 'Make your entrance.'}</h1>
      <p>{breaking ? 'Welcome to the community.' : `Click the logo ${5 - hits} ${5 - hits === 1 ? 'more time' : 'times'} to break through.`}</p>
      <div className="splashProgress" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <span key={index} className={index < hits ? 'complete' : ''} />)}</div>
    </div>
  </section>;
}
