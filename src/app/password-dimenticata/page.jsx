"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import styles from "./page.module.css";
// import { getEmailFromTokenApi } from "../../lib/mockApi";
import { requestPasswordReset } from "@app/lib/auth";
import { useToast } from "@app/components/ToastProvider";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  

  // Phase 1 state (account creation)
  const [accountEmail, setAccountEmail] = useState("");
  const [submittingAccount, setSubmittingAccount] = useState(false);
  const [accErrors, setAccErrors] = useState({});
  const [status, setStatus] = useState("step1");

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
    setAccErrors(e);
    return Object.keys(e).length === 0;
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    if (!validateAccount()) return;
    setSubmittingAccount(true);
    try {
      await requestPasswordReset({ email: accountEmail });
      toast.success("Richiesta di reimpostazione password inviata con successo!");
      setStatus("step2");
    } catch (err) {
      toast.error("Invio richiesta fallito: " + err.message);
    } finally {
      setSubmittingAccount(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={"card " + styles.card}>
          {status === "step1" && <>
            <h2>Reimposta password</h2>
            <form onSubmit={submitRequest} className={styles.formAccount}>
              <label className={styles.field}>
                <span className="label">Email</span>
                <input
                  className="input"
                  type="email"
                  placeholder="Inserisci la mail associata al tuo account"
                  value={accountEmail}
                  onChange={(e)=>setAccountEmail(e.target.value)}
                  required
                  // readOnly={loadingPrefill}
                />
                {accErrors.email && <span className={styles.error}>{accErrors.email}</span>}
              </label>
              <div className={styles.actions}>
                <button className="button" type="submit" disabled={submittingAccount}>
                  {submittingAccount ? "Invio..." : "Invia richiesta"}
                </button>
              </div>
            </form>
          </>}
          {status === "step2" && (
            <div>
              <p>Se l'email inserita è corretta, riceverai un link per reimpostare la password.</p>
            </div>
          )}
      </div>
    </div>
  );
}
