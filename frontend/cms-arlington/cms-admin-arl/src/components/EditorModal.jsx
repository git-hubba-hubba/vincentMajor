import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function EditorModal({ title, onClose, busy = false, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      previousFocus?.focus();
    };
  }, []);
  return createPortal(<dialog ref={ref} className="editorModal" aria-labelledby="editor-modal-title"
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <header className="editorModalHeader"><h2 id="editor-modal-title">{title}</h2>
      <button type="button" className="secondaryButton" aria-label="Close editor" disabled={busy} onClick={onClose}>×</button>
    </header>{children}
  </dialog>, document.body);
}
