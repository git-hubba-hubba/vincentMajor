import SiteText from "./SiteText";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function ImageLightbox({ src, title, onClose }) {
  const dialogRef = useRef(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const dialog = dialogRef.current;
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
  return createPortal(<dialog ref={dialogRef} className="imageLightbox" aria-label={`Enlarged image: ${title}`}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <button type="button" className="imageLightboxClose" aria-label="Close enlarged image" onClick={onClose}>×</button>
    {failed ? <p role="alert"><SiteText contentKey="ImageLightbox.278a830763dc">{"This image could not be loaded."}</SiteText></p> :
      <img src={src} alt={`Image for ${title}`} onError={() => setFailed(true)} />}
    <p className="imageLightboxCaption">{title}</p>
  </dialog>, document.body);
}
