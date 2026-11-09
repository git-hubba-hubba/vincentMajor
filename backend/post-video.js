// Kept in both service roots so each Render service can deploy independently.
// Only known video providers become embeds; arbitrary pages remain regular links.
export function postVideoSource(value) {
  if (typeof value !== 'string') return null;
  let url;
  try { url = new URL(value.trim()); } catch { return null; }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (['youtube.com', 'm.youtube.com', 'youtu.be', 'youtube-nocookie.com'].includes(host)) {
    const id = host === 'youtu.be' ? url.pathname.split('/')[1] : url.searchParams.get('v') || url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1];
    if (/^[\w-]{11}$/.test(id || '')) return { type: 'embed', src: `https://www.youtube-nocookie.com/embed/${id}` };
    return null;
  }
  if (['vimeo.com', 'player.vimeo.com'].includes(host)) {
    const match = url.pathname.match(/^\/(?:video\/)?(\d+)(?:\/([\w]+))?\/?$/);
    if (match) {
      const hash = url.searchParams.get('h') || match[2];
      return { type: 'embed', src: `https://player.vimeo.com/video/${match[1]}${hash ? `?h=${encodeURIComponent(hash)}` : ''}` };
    }
    return null;
  }
  if (/\.(mp4|webm|mov)$/i.test(url.pathname) || (host === 'res.cloudinary.com' && /\/video\/upload\//.test(url.pathname))) return { type: 'video', src: url.href };
  return null;
}

export function videoFromPost(post) {
  if (post.video_url) return post.video_url;
  for (const match of String(post.body || '').matchAll(/https?:\/\/[^\s<>"']+/gi)) {
    const candidate = match[0].replace(/[.,!?;:)\]}]+$/, '');
    if (postVideoSource(candidate)) return candidate;
  }
  return '';
}

export const postCategories = ['The Latest', 'Community', 'Health', 'Finances', 'Entertainment', 'Business', 'Deals/Discounts', 'Local News'];
