"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import styles from "./page.module.css";
// import { getEmailFromTokenApi } from "../../lib/mockApi";
import { registerAccountApi, login } from "@app/lib/auth";
import { useToast } from "@app/components/ToastProvider";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const { token } = useParams();
  const router = useRouter();
  const toast = useToast();
  

  // Phase 1 state (account creation)
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  // const [loadingPrefill, setLoadingPrefill] = useState(true);
  const [submittingAccount, setSubmittingAccount] = useState(false);
  const [accErrors, setAccErrors] = useState({});

  // useEffect(() => {
  //   let ignore = true;
  //   (async () => {
  //     try {
  //       const res = await getEmailFromTokenApi(token);
  //       if (!ignore) setAccountEmail(res?.email || "");
  //     } catch (e) {
  //       // silent: keep empty
  //     } finally {
  //       if (!ignore) setLoadingPrefill(false);
  //     }
  //   })();
  //   return () => { ignore = true; };
  // }, [token]);

  const validateAccount = () => {
    const e = {};
    if (!accountEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountEmail)) e.email = "Email non valida";
    if (!accountPassword || accountPassword.length < 6) e.password = "Minimo 6 caratteri";
    setAccErrors(e);
    return Object.keys(e).length === 0;
  };

  const submitAccount = async (e) => {
    e.preventDefault();
    if (!validateAccount()) return;
    setSubmittingAccount(true);
    try {
      await registerAccountApi({ token, email: accountEmail, password: accountPassword });
      toast.success("Account creato con successo!");
      const login_status = await login({ email: accountEmail, password: accountPassword }, false);
      console.log("Login status after registration:", login_status);
      if (login_status.ok && login_status.isPlayer)
         router.push("/profile");
    } catch (err) {
      toast.error("Registrazione fallita: " + err.message);
    } finally {
      setSubmittingAccount(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={"card " + styles.card}>
          <>
            <h2>Creazione account</h2>
            <p className={styles.subtitle}>Token invito: <code>{token}</code></p>
            <form onSubmit={submitAccount} className={styles.formAccount}>
              <label className={styles.field}>
                <span className="label">Email</span>
                <input
                  className="input"
                  type="email"
                  value={accountEmail}
                  onChange={(e)=>setAccountEmail(e.target.value)}
                  required
                  // readOnly={loadingPrefill}
                />
                {accErrors.email && <span className={styles.error}>{accErrors.email}</span>}
              </label>
              <label className={styles.field}>
                <span className="label">Password</span>
                <input
                  className="input"
                  type="password"
                  value={accountPassword}
                  onChange={(e)=>setAccountPassword(e.target.value)}
                  required
                />
                {accErrors.password && <span className={styles.error}>{accErrors.password}</span>}
              </label>
              <div className={styles.actions}>
                <button className="button" type="submit" disabled={submittingAccount}>
                  {submittingAccount ? "Creazione..." : "Crea account"}
                </button>
              </div>
            </form>
          </>
      </div>
    </div>
  );
}
