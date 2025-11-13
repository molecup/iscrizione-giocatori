"use client";
import { useEffect } from "react";
import styles from "./Modal.module.css";

export default function Modal({ open, title, children, onClose, actions }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal + " card"} role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
        {title && <div className={styles.header}><h3>{title}</h3></div>}
        <div className={styles.content}>{children}</div>
        <div className={styles.footer}>
          {actions}
          <button className="button secondary" onClick={onClose}>Chiudi</button>
        </div>
      </div>
    </div>
  );
}
