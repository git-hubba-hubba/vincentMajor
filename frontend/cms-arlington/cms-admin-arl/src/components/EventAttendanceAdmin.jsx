import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { api } from '../lib/api';

export default function EventAttendanceAdmin() {
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [points, setPoints] = useState('50');
  const [generated, setGenerated] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    api('/events').then(items => { if (active) setEvents(items.filter(item => item.status === 'approved')); })
      .catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [refresh]);

  const generate = async event => {
    event.preventDefault();
    setBusy(true); setError(''); setGenerated(null);
    try {
      const item = await api(`/events/${eventId}/attendance-qr`, {
        method: 'POST', body: JSON.stringify({ points_awarded: points }),
      });
      setEvents(current => current.map(value => value.id === item.id ? { ...value, ...item } : value));
      const url = new URL(window.location.href);
      url.search = ''; url.hash = '';
      url.searchParams.set('attendance', item.id);
      url.searchParams.set('code', item.attendance_code);
      const link = url.toString();
      const image = await QRCode.toDataURL(link, { width: 320, margin: 4, errorCorrectionLevel: 'M' });
      setGenerated({ ...item, link, image });
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return <section className="siteTextAdmin" aria-labelledby="event-qr-heading">
    <p className="eyebrow">Event attendance</p>
    <h2 id="event-qr-heading">Event QR code generator</h2>
    <p>Select an approved event and assign its attendance points. Display the QR code at the event. Members scan it with their phone camera and sign in to receive points once per event.</p>
    <form className="siteTextTools" onSubmit={generate}>
      <label>Event<select required value={eventId} disabled={busy} onChange={event => {
        setEventId(event.target.value);
        setPoints(String(events.find(item => String(item.id) === event.target.value)?.points_awarded ?? 50));
        setGenerated(null);
      }}><option value="">Select an event</option>{events.map(item => <option key={item.id} value={item.id}>{item.title} · {new Date(item.starts_at).toLocaleDateString()}</option>)}</select></label>
      <label>Attendance points<input type="number" required min="0" step="1" value={points} disabled={busy} onChange={event => { setPoints(event.target.value); setGenerated(null); }} /></label>
      <button className="primaryButton" disabled={busy || !eventId}>{busy ? 'Generating…' : 'Save points & generate QR'}</button>
      <button type="button" className="secondaryButton" disabled={busy} onClick={() => {
        setEventId(''); setGenerated(null); setError(''); setRefresh(value => value + 1);
      }}>Refresh events</button>
    </form>
    {!events.length && <p>Create and approve an event in the Events panel to generate its QR code.</p>}
    {generated && <div className="incentiveScanLink">
      <strong>{generated.title} · {generated.points_awarded} attendance points</strong>
      <img src={generated.image} width="320" height="320" style={{ maxWidth: '100%', height: 'auto' }} alt={`Scan to earn attendance points for ${generated.title}`} />
      <a href={generated.image} download={`impact-event-${generated.id}-qr.png`}>Download QR image</a>
      <label>Attendance scan link<input readOnly value={generated.link} onFocus={event => event.target.select()} /></label>
      <p>Attendance code: <code>{generated.attendance_code}</code></p>
      <p role="status">Points saved. Changes apply to future scans; members who already attended keep their original award.</p>
    </div>}
    {error && <p className="formMessage" role="alert">{error}</p>}
  </section>;
}
