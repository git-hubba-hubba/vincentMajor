// One stroke-based icon family for every device. Color follows its UI context.
const paths = {
  mail: 'M3 5h18v14H3z M3 5l9 8 9-8',
  people: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M18 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-4',
  edit: 'M12 20H4v-8 M15 4l5 5 M8 16l3-1L21 5l-4-4L7 11z',
  star: 'm12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
  compass: 'M21 12a9 9 0 1 0-18 0 9 9 0 0 0 18 0 M16 8l-3 5-5 3 3-5z',
  award: 'M17 8a5 5 0 1 0-10 0 5 5 0 0 0 10 0 M8 12l-2 10 6-3 6 3-2-10',
  crown: 'm2 6 5 4 5-7 5 7 5-4-3 14H5z',
  photo: 'M3 4h18v16H3z M3 16l5-5 4 4 3-3 6 6 M16 8h.01',
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z',
  ticket: 'M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4z M15 5v3 m0 3v2 m0 3v3',
  calendar: 'M4 5h16v16H4z M4 10h16 M8 3v4 M16 3v4',
  comment: 'M21 11a9 8 0 0 1-9 8H5l-3 3V11a9 8 0 0 1 19 0z',
  bookmark: 'M6 3h12v18l-6-4-6 4z',
  search: 'M17 10a7 7 0 1 0-14 0 7 7 0 0 0 14 0 M15 15l6 6',
  home: 'm3 10 9-8 9 8 M5 8v13h5v-7h4v7h5V8',
  check: 'm4 12 5 5L20 6',
  plus: 'M12 4v16 M4 12h16',
  close: 'm6 6 12 12 M6 18 18 6',
  arrowUpRight: 'M6 18 18 6 M6 6h12v12',
  arrowRight: 'M4 12h16 m-6-6 6 6-6 6',
  arrowLeft: 'M20 12H4 m6-6-6 6 6 6',
  arrowDown: 'M12 4v16 m-6-6 6 6 6-6',
  chevronDown: 'm6 9 6 6 6-6',
  expand: 'M8 3H3v5 M16 3h5v5 M3 16v5h5 M21 16v5h-5',
  sparkle: 'm12 2 2.7 7.3L22 12l-7.3 2.7L12 22l-2.7-7.3L2 12l7.3-2.7z',
  burst: 'M12 2v20 M2 12h20 M5 5l14 14 M5 19 19 5',
  shield: 'm12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6z',
  lock: 'M5 10h14v11H5z M8 10V6a4 4 0 0 1 8 0v4',
  sun: 'M16 12a4 4 0 1 0-8 0 4 4 0 0 0 8 0 M12 2v2 m0 16v2 M2 12h2 m16 0h2 M5 5l1.5 1.5 m11 11L19 19 M5 19l1.5-1.5 m11-11L19 5',
  music: 'M9 18V5l12-2v13 M9 9l12-2 M9 18a3 3 0 1 0-6 0 3 3 0 0 0 6 0 M21 16a3 3 0 1 0-6 0 3 3 0 0 0 6 0',
  money: 'M12 2v20 M18 6H9a4 4 0 0 0 0 8h6a4 4 0 0 1 0 8H5',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
  bag: 'M4 7h16l1 14H3z M8 8V6a4 4 0 0 1 8 0v2',
};

export default function Icon({ name, className = '', filled = false, ...props }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props} className={`siteIcon ${className}`}><path d={paths[name] || paths.sparkle}/></svg>;
}

const symbols = {
  '×':'close', '✉':'mail', '◎':'people', '☺':'people', '♡':'heart', '♥':'heart',
  '🎟':'ticket', '💬':'comment', '◯':'comment', '▣':'calendar', '◫':'calendar', '◷':'calendar',
  '◇':'bookmark', '◆':'bookmark', '⌕':'search', '⌂':'home', '✓':'check', '＋':'plus',
  '↗':'arrowUpRight', '→':'arrowRight', '←':'arrowLeft', '↓':'arrowDown', '⌄':'chevronDown',
  '⤢':'expand', '✧':'sparkle', '✦':'sparkle', '✳':'burst', '★':'star', '⌾':'lock', '♪':'music', '☀':'sun',
};
const symbolPattern = /(🎟\uFE0F?|💬|[×✉◎☺♡♥◯▣◫◷◇◆⌕⌂✓＋↗→←↓⌄⤢✧✦✳★⌾♪☀])/u;

export function IconSymbol({ value }) {
  return <Icon name={symbols[value.replace(/\uFE0F/g, '')] || value} filled={['♥','◆'].includes(value)}/>;
}

// Preserve editable application labels while drawing their UI symbols as SVGs.
// Member-written content is rendered separately and never passes through this helper.
export function IconText({ children }) {
  if (typeof children !== 'string') return children;
  return children.split(symbolPattern).map((part, index) => symbols[part.replace(/\uFE0F/g, '')] ? <IconSymbol key={index} value={part}/> : part);
}
