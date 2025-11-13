"use client";
import styles from "./CheckboxConsent.module.css";
import Link from "next/link";

export default function CheckboxConsent({ checked, onChange, onOpenDoc }) {
  return (
    <label className={styles.row}>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e)=> onChange?.(e.target.checked)}
      />
      <span>
        Dichiaro di aver letto e accettato l'informativa privacy. {" "}
        {onOpenDoc ? (
          <button type="button" className={styles.link} onClick={onOpenDoc}>Leggi documento</button>
        ) : (
          <Link href="/privacy" className={styles.link} target="_blank">Leggi documento</Link>
        )}
      </span>
    </label>
  );
}
