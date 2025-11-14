"use client";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import styles from "./ToastProvider.module.css";

const ToastCtx = createContext(null);

let idSeq = 1;

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((arr) => arr.filter((t) => t.id !== id));
    const t = timersRef.current.get(id);
    if (t) clearTimeout(t);
    timersRef.current.delete(id);
  }, []);

  const hideToast = useCallback((id) => {
    setToasts((arr) => arr.map((t) => (t.id === id ? { ...t, visible: false } : t)));
    const t = setTimeout(() => removeToast(id), 300);
    timersRef.current.set(id, t);
  }, [removeToast]);

  const show = useCallback((message, type = "info", duration = 2200) => {
    const id = idSeq++;
    const toast = { id, message, type, visible: true };
    setToasts((arr) => [...arr, toast]);
    const t = setTimeout(() => hideToast(id), duration);
    timersRef.current.set(id, t);
    return id;
  }, [hideToast]);

  const api = useMemo(() => ({
    show,
    success: (msg, d) => show(msg, "success", d),
    error: (msg, d) => show(msg, "error", d),
    info: (msg, d) => show(msg, "info", d),
    warn: (msg, d) => show(msg, "warn", d),
  }), [show]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className={styles.viewport} aria-live="polite" aria-atomic>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              styles.toast,
              t.visible ? styles.visible : styles.hidden,
              styles[t.type] || "",
            ].join(" ")}
            role="status"
          >
            <span className={styles.icon} aria-hidden>
              {t.type === "success" ? "✓" : t.type === "error" ? "⚠" : t.type === "warn" ? "!" : "i"}
            </span>
            <span>{t.message}</span>
            <button className={styles.close} onClick={() => hideToast(t.id)} aria-label="Chiudi notifica">×</button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) {
    // Fallback no-op to avoid crashes if used outside provider
    return {
      show: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
      warn: () => {},
    };
  }
  return ctx;
}
