import { useEffect, useId, useState } from "react";

const WIDTH = 1031;
const HEIGHT = 389;
const points = Array.from({ length: 5 }, (_, row) =>
  Array.from({ length: 9 }, (_, col) => [
    col * WIDTH / 8 + (col > 0 && col < 8 ? Math.sin(row * 13 + col * 7) * 32 : 0),
    row * HEIGHT / 4 + (row > 0 && row < 4 ? Math.cos(col * 11 + row * 3) * 26 : 0),
  ]),
);
const shards = [];
for (let row = 0; row < 4; row++) {
  for (let col = 0; col < 8; col++) {
    const a = points[row][col], b = points[row][col + 1];
    const c = points[row + 1][col], d = points[row + 1][col + 1];
    for (const triangle of [[a, b, c], [b, d, c]]) {
      const index = shards.length;
      const x = triangle.reduce((sum, point) => sum + point[0], 0) / 3;
      const y = triangle.reduce((sum, point) => sum + point[1], 0) / 3;
      // Only a few fragments release early; the fifth impact releases every shard.
      const release = index % 13 === 0 ? 1 : index % 11 === 0 ? 2 : index % 7 === 0 ? 3 : index % 5 === 0 ? 4 : 5;
      shards.push({ points: triangle.map(point => point.join(',')).join(' '), x, y, release,
        dx: (x - WIDTH / 2) * 1.9 + Math.sin(index * 7) * 130,
        dy: (y - HEIGHT / 2) * 2.3 + 240,
        rotation: Math.sin(index * 17) * 140, delay: (index % 7) * 22 });
    }
  }
}

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
    const timer = setTimeout(onComplete, reduced ? 150 : 1500);
    return () => clearTimeout(timer);
  }, [breaking, onComplete]);
  return <section className={`logoSplash${breaking ? ' logoSplashBreaking' : ''}`} aria-label="Welcome to Impact Arlington">
    <div className="splashGlow" aria-hidden="true" />
    <p className="splashEyebrow">Arlington, Texas · A community within the community</p>
    <button type="button" className="splashLogoButton" disabled={breaking}
      aria-label={`Break the glass logo to enter. ${hits} of 5 clicks complete.`}
      onClick={() => setHits(current => Math.min(5, current + 1))}>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="IMPACT — Walk With Us" className="splashGlass">
        <defs>{shards.map((shard, index) => <clipPath key={index} id={`${id}-shard-${index}`}><polygon points={shard.points} /></clipPath>)}</defs>
        {shards.map((shard, index) => <g key={index} className={`splashShard${hits >= shard.release ? ' splashShardLoose' : ''}`}
          style={{ '--shard-x': `${shard.dx}px`, '--shard-y': `${shard.dy}px`, '--shard-turn': `${shard.rotation}deg`, '--shard-delay': `${shard.delay}ms`, transformOrigin: `${shard.x}px ${shard.y}px` }}>
          <image href="/images/impact-official-logo.png" width={WIDTH} height={HEIGHT} clipPath={`url(#${id}-shard-${index})`} />
          <polygon points={shard.points} className="splashCrack" style={{ opacity: hits > 0 && (index % 5 < hits) ? .75 : 0 }} />
        </g>)}
        {hits > 0 && !breaking && <path className="splashImpactCrack" d="M515 194 L453 129 L471 84 L420 0 M453 129 L343 147 L274 101 L180 117 L0 32 M515 194 L592 138 L647 151 L735 81 L839 100 L1031 0 M515 194 L551 259 L512 294 L535 389 M551 259 L679 287 L738 261 L850 342 L1031 350 M515 194 L397 238 L334 224 L253 307 L99 276 L0 389" />}
      </svg>
    </button>
    <div className="splashInstructions" aria-live="polite">
      <h1>{breaking ? 'Make an impact.' : hits ? 'Keep making an impact.' : 'Make your entrance.'}</h1>
      <p>{breaking ? 'Welcome to the community.' : `Click the logo ${5 - hits} ${5 - hits === 1 ? 'more time' : 'times'} to break through.`}</p>
      <div className="splashProgress" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <span key={index} className={index < hits ? 'complete' : ''} />)}</div>
    </div>
  </section>;
}
