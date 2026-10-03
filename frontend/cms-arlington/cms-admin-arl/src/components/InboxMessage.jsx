import SiteText from "./SiteText";
import { useState } from "react";
import { api } from "../lib/api";
import LinkedText from "./LinkedText";

export default function InboxMessage({ item }) {
  const [replying, setReplying] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const name = `${item.first_name} ${item.last_name}`;
  const submit = async event => {
    event.preventDefault();
    if (sending || !draft.trim()) return;
    setSending(true); setError(""); setNotice("");
    try {
      const result = await api(`/messages/${item.id}/reply`, { method:"POST", body:JSON.stringify({body:draft.trim()}) });
      setDraft(""); setReplying(false); setNotice(result.message);
    } catch (err) { setError(err.message); } finally { setSending(false); }
  };
  return <article className="socialInboxItem">
    <span aria-hidden="true">✉</span>
    <div className="inboxMessageContent"><p><strong>{name}</strong>
      <small className="inboxMessageBody"><LinkedText>{item.body}</LinkedText></small></p>
      {!replying && <button type="button" className="secondaryButton inboxReplyButton"
        aria-expanded={false} aria-controls={`inbox-reply-${item.id}`}
        onClick={() => {setReplying(true);setNotice("");}}><SiteText contentKey="InboxMessage.c253f451bdd5">{"Reply"}</SiteText></button>}
      {replying && <form id={`inbox-reply-${item.id}`} className="inboxReplyForm" onSubmit={submit}>
        <label htmlFor={`inbox-draft-${item.id}`}><SiteText contentKey="InboxMessage.ec06f3d2590e">{"Reply to "}</SiteText>{name}</label>
        <textarea id={`inbox-draft-${item.id}`} autoFocus required maxLength={1000} rows={3}
          placeholder="Write your reply…" value={draft} disabled={sending}
          onChange={event => setDraft(event.target.value)} aria-describedby={`inbox-reply-count-${item.id}`} />
        <small id={`inbox-reply-count-${item.id}`}>{draft.length}<SiteText contentKey="InboxMessage.b3abe483ea14">{" / 1,000 characters"}</SiteText></small>
        <div className="formActions"><button type="button" className="secondaryButton" disabled={sending}
          onClick={() => {setReplying(false);setError("");}}><SiteText contentKey="InboxMessage.19766ed6ccb2">{"Cancel"}</SiteText></button>
          <button className="primaryButton" disabled={sending || !draft.trim()}><SiteText section="InboxMessage">{sending?"Sending…":"Send reply"}</SiteText></button></div>
        {error && <p className="formMessage" role="alert">{error}</p>}
      </form>}
      {notice && <p className="inboxReplyNotice" role="status">{notice}</p>}
    </div>
  </article>;
}
