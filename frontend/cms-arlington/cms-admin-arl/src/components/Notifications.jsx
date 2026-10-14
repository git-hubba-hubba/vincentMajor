import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";

export default function Notifications({ userId, onOpenInbox, onOpenEvents }) {
  const [items, setItems] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const seen = useRef(null);
  const revision = useRef(0);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const version = revision.current;
      try {
        const data = await api('/notifications');
        if (!active || version !== revision.current) return;
        if (seen.current !== null) {
          const fresh = data.filter(item => item.id > seen.current);
          if (fresh.length) setToasts(current => [...fresh, ...current].slice(0, 5));
        }
        seen.current = Math.max(seen.current || 0, ...data.map(item => item.id));
        setItems(data); setError("");
      } catch { if (active) setError("Unable to load notifications. Retrying…"); }
    };
    refresh();
    const timer = setInterval(refresh, 5000);
    window.addEventListener('focus', refresh);
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [userId]);
  const clear = async id => {
    revision.current += 1;
    try {
      await api(`/notifications${id ? `/${id}` : ''}`, { method: 'DELETE' });
      setItems(current => id ? current.filter(item => item.id !== id) : []);
      setToasts(current => id ? current.filter(item => item.id !== id) : []);
      setError("");
    } catch (err) { setError(err.message); }
    finally { revision.current += 1; }
  };
  const view = item => {
    setOpen(false); setToasts(current => current.filter(entry => entry.id !== item.id));
    if (item.type === 'new-event') onOpenEvents(); else onOpenInbox();
  };
  return <aside className="notificationCenter" aria-label="Notifications">
    <button className="notificationToggle" type="button" aria-label={`Notifications, ${items.length} items`} title="Notifications" aria-expanded={open} onClick={() => setOpen(!open)}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
      {items.length > 0 && <span className="notificationBadge" aria-hidden="true">{items.length > 99 ? '99+' : items.length}</span>}
    </button>
    {open && <section className="notificationPanel" aria-label="Your notifications">
      <h3>Notifications</h3>
      {items.length > 0 && <button type="button" className="textButton" onClick={() => clear()}>Clear all notifications</button>}
      {error && <p role="alert">{error}</p>}
      {!items.length && !error && <p>No notifications.</p>}
      {items.map(item => <article key={item.id}><button type="button" className="textButton" onClick={() => view(item)}>{item.message}</button><button type="button" className="textButton" aria-label={`Clear notification: ${item.message}`} onClick={() => clear(item.id)}>Clear</button></article>)}
    </section>}
    <div className="notificationToasts" aria-live="polite" aria-relevant="additions">
      {toasts.map(item => <article key={item.id}><p>{item.message}</p><button type="button" className="textButton" onClick={() => view(item)}>View</button><button type="button" className="textButton" onClick={() => setToasts(current => current.filter(entry => entry.id !== item.id))}>Dismiss</button></article>)}
    </div>
  </aside>;
}
