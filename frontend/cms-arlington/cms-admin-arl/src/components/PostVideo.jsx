import { useState } from 'react';
import { postVideoSource } from '../lib/postVideo';

export default function PostVideo({ url, title, poster }) {
  const [failed, setFailed] = useState(false);
  const source = postVideoSource(url) || (/^data:video\/(mp4|webm);base64,/.test(url || '') ? { type: 'video', src: url } : null);
  if (!source) return null;
  return <div className="postVideo">
    {source.type === 'embed' ? <iframe src={source.src} title={`Watch: ${title}`} loading="lazy" allow="fullscreen; picture-in-picture; encrypted-media" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/> : <video src={source.src} controls playsInline preload="metadata" poster={poster || undefined} aria-label={title} onError={() => setFailed(true)}/>}
    {failed && <p role="status">This video could not be loaded. Please try again later.</p>}
    {!url.startsWith('data:') && <a href={url} target="_blank" rel="noopener noreferrer">Open video ↗</a>}
  </div>;
}
