"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { loginApi } from "../lib/mockApi";
import { useToast } from "../components/ToastProvider";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Email non valida";
    if (!password || password.length < 6) e.password = "Minimo 6 caratteri";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await loginApi({ email, password });
      router.push("/dashboard");
    } catch (err) {
      toast.error("Login fallito: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <form onSubmit={onSubmit} className={styles.form + " card"}>
        <h2>Accedi</h2>
        <p className={styles.subtitle}>Referente squadra (capitano/allenatore)</p>
        <label className={styles.field}>
          <span className="label">Email</span>
          <input className="input" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          {errors.email && <span className={styles.error}>{errors.email}</span>}
        </label>
        <label className={styles.field}>
          <span className="label">Password</span>
          <input className="input" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
          {errors.password && <span className={styles.error}>{errors.password}</span>}
        </label>
        <button disabled={loading} className="button" type="submit">{loading ? "Accesso..." : "Entra"}</button>
      </form>
    </div>
  );
}
