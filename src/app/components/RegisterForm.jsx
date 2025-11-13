"use client";
import { useMemo, useState } from "react";
import styles from "./RegisterForm.module.css";
import CheckboxConsent from "./CheckboxConsent";

const TAGLIE = ["S", "M", "L", "XL"];
const POSIZIONI = ["POR", "DIF", "CEN", "ATT"];

export default function RegisterForm({ onSubmit }) {
  const [form, setForm] = useState({
    email: "",
    nome: "",
    cognome: "",
    nascita: "",
    cf: "",
    numero: "",
    taglia: "",
    posizione: "",
    privacy: false,
    genitoreNome: "",
    genitoreCognome: "",
    genitoreNascita: "",
    genitoreCf: "",
  });
  const [errors, setErrors] = useState({});

  const isMinor = useMemo(() => {
    if (!form.nascita) return false;
    const today = new Date();
    const dob = new Date(form.nascita);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age < 18;
  }, [form.nascita]);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    const e = {};
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Email non valida";
    if (!form.nome) e.nome = "Obbligatorio";
    if (!form.cognome) e.cognome = "Obbligatorio";
    if (!form.nascita) e.nascita = "Obbligatorio";
    if (!form.cf || form.cf.length < 8) e.cf = "Codice fiscale non valido";
    const num = Number(form.numero);
    if (!num || num < 1 || num > 99) e.numero = "1–99";
    if (!form.taglia) e.taglia = "Seleziona";
    if (!form.posizione) e.posizione = "Seleziona";
    if (!form.privacy) e.privacy = "Richiesto";
    if (isMinor) {
      if (!form.genitoreNome) e.genitoreNome = "Obbligatorio";
      if (!form.genitoreCognome) e.genitoreCognome = "Obbligatorio";
      if (!form.genitoreNascita) e.genitoreNascita = "Obbligatorio";
      if (!form.genitoreCf || form.genitoreCf.length < 8) e.genitoreCf = "Codice fiscale non valido";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      alert("Per favore correggi gli errori del form.");
      return;
    }
    onSubmit?.(form);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form + " card"}>
      <div className={styles.section}>
        <h3>Dati giocatore</h3>
        <div className={styles.grid}>
          <Field label="Email" error={errors.email}>
            <input className="input" type="email" value={form.email} onChange={(e)=>update('email', e.target.value)} required />
          </Field>
          <Field label="Nome" error={errors.nome}>
            <input className="input" value={form.nome} onChange={(e)=>update('nome', e.target.value)} required />
          </Field>
          <Field label="Cognome" error={errors.cognome}>
            <input className="input" value={form.cognome} onChange={(e)=>update('cognome', e.target.value)} required />
          </Field>
          <Field label="Data di nascita" error={errors.nascita}>
            <input className="input" type="date" value={form.nascita} onChange={(e)=>update('nascita', e.target.value)} required />
          </Field>
          <Field label="Codice fiscale" error={errors.cf}>
            <input className="input" value={form.cf} onChange={(e)=>update('cf', e.target.value)} required />
          </Field>
          <Field label="Numero maglia (1–99)" error={errors.numero}>
            <input className="input" type="number" min={1} max={99} value={form.numero} onChange={(e)=>update('numero', e.target.value)} required />
          </Field>
          <Field label="Taglia maglia" error={errors.taglia}>
            <select className="select" value={form.taglia} onChange={(e)=>update('taglia', e.target.value)} required>
              <option value="" disabled>Seleziona</option>
              {TAGLIE.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Posizione" error={errors.posizione}>
            <select className="select" value={form.posizione} onChange={(e)=>update('posizione', e.target.value)} required>
              <option value="" disabled>Seleziona</option>
              {POSIZIONI.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {isMinor && (
        <div className={styles.section}>
          <h3>Dati genitore</h3>
          <div className={styles.grid}>
            <Field label="Nome genitore" error={errors.genitoreNome}>
              <input className="input" value={form.genitoreNome} onChange={(e)=>update('genitoreNome', e.target.value)} required={isMinor} />
            </Field>
            <Field label="Cognome genitore" error={errors.genitoreCognome}>
              <input className="input" value={form.genitoreCognome} onChange={(e)=>update('genitoreCognome', e.target.value)} required={isMinor} />
            </Field>
            <Field label="Data di nascita genitore" error={errors.genitoreNascita}>
              <input className="input" type="date" value={form.genitoreNascita} onChange={(e)=>update('genitoreNascita', e.target.value)} required={isMinor} />
            </Field>
            <Field label="Codice fiscale genitore" error={errors.genitoreCf}>
              <input className="input" value={form.genitoreCf} onChange={(e)=>update('genitoreCf', e.target.value)} required={isMinor} />
            </Field>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <CheckboxConsent checked={form.privacy} onChange={(v)=>update('privacy', v)} />
        {errors.privacy && <div className={styles.error}>{errors.privacy}</div>}
      </div>

      <div className={styles.actions}>
        <button className="button" type="submit">Continua</button>
      </div>
    </form>
  );
}

function Field({ label, error, children }) {
  return (
    <label className={styles.field}>
      <span className="label">{label}</span>
      {children}
      {error && <span className={styles.error}>{error}</span>}
    </label>
  );
}
