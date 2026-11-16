import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function EventAttendanceClaim({ user, onAuthChange, onSignIn }) {
  const [scan] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has('attendance') ? { id: params.get('attendance'), code: params.get('code') } : null;
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const memberId = user?.id;

  useEffect(() => {
    if (!scan || !memberId) return;
    // Deferring avoids a second request during React's development effect check.
    const timer = window.setTimeout(async () => {
      if (!/^\d+$/.test(scan.id) || !scan.code) { setError('This event QR link is incomplete. Please scan the event QR code again.'); return; }
      setBusy(true); setError('');
      try {
        const result = await api(`/events/${scan.id}/attendance`, {
          method: 'POST', body: JSON.stringify({ code: scan.code }),
        });
        onAuthChange(result.user);
        setMessage(`${result.event.title}: ${result.message}`);
        const url = new URL(window.location.href);
        url.searchParams.delete('attendance'); url.searchParams.delete('code');
        window.history.replaceState(null, '', url);
      } catch (err) { setError(err.message); }
      finally { setBusy(false); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [scan, memberId, retry, onAuthChange]);

  if (!scan) return null;
  return <section className="earnPoints" aria-labelledby="attendance-claim-heading">
    <h3 id="attendance-claim-heading">Event attendance points</h3>
    {!user ? <><p>Sign in or create your rewards profile to receive points for this event.</p><button className="primaryButton" onClick={onSignIn}>Sign in to receive points</button></>
      : busy ? <p role="status">Confirming attendance…</p>
      : message ? <p className="formMessage" role="status">{message}</p> : !error && <p role="status">Preparing attendance claim…</p>}
    {error && <><p className="formMessage" role="alert">{error}</p><button className="secondaryButton" disabled={busy} onClick={() => setRetry(value => value + 1)}>Try again</button></>}
  </section>;
}
