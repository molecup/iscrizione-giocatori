"use client";
import { useState } from "react";
import styles from "./EditableCell.module.css";

export default function EditableCell({ value, onChange, type = "text", options = [], placeholder = "", required = false, min, max }) {
  const [local, setLocal] = useState(value ?? "");

  const handleBlur = () => {
    if (type === "number") {
      const n = local === "" ? "" : Number(local);
      if (min != null && n < min) return setLocal(String(min));
      if (max != null && n > max) return setLocal(String(max));
    }
    onChange?.(local);
  };

  if (type === "select") {
    return (
      <select className={styles.input}
              value={local}
              onChange={(e)=>{ setLocal(e.target.value); onChange?.(e.target.value);} }
              onBlur={handleBlur}
              required={required}
      >
        <option value="" disabled>{placeholder || "Seleziona"}</option>
        {options.map(opt => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>{opt.label ?? opt}</option>
        ))}
      </select>
    );
  }

  if (type === "checkbox") {
    return (
      <input type="checkbox" className={styles.checkbox}
             checked={!!local}
             onChange={(e)=>{ setLocal(e.target.checked); onChange?.(e.target.checked);} } />
    );
  }

  return (
    <input
      className={styles.input}
      type={type}
      value={local}
      onChange={(e)=> setLocal(e.target.value)}
      onBlur={handleBlur}
      placeholder={placeholder}
      required={required}
      min={min}
      max={max}
    />
  );
}
