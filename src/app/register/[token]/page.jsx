"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import RegisterForm from "../../components/RegisterForm";
import PaymentButton from "../../components/PaymentButton";
import styles from "./page.module.css";
import { getEmailFromTokenApi, registerAccountApi } from "../../lib/mockApi";
import { useToast } from "../../components/ToastProvider";

export default function RegisterPage() {
  const { token } = useParams();
  const toast = useToast();
  const [step, setStep] = useState("account");
  const [data, setData] = useState(null);

  // Phase 1 state (account creation)
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [loadingPrefill, setLoadingPrefill] = useState(true);
  const [submittingAccount, setSubmittingAccount] = useState(false);
  const [accErrors, setAccErrors] = useState({});

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await getEmailFromTokenApi(token);
        if (!ignore) setAccountEmail(res?.email || "");
      } catch (e) {
        // silent: keep empty
      } finally {
        if (!ignore) setLoadingPrefill(false);
      }
    })();
    return () => { ignore = true; };
  }, [token]);

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
      setStep("player");
    } catch (err) {
      toast.error("Registrazione fallita: " + err.message);
    } finally {
      setSubmittingAccount(false);
    }
  };

  const handlePlayerSubmit = (formData) => {
    setData(formData);
    setStep("payment");
  };

  const handlePaid = () => {
    setStep("done");
  };

  return (
    <div className={styles.wrapper}>
      <div className={"card " + styles.card}>
        {step === "account" && (
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
                  readOnly={loadingPrefill}
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
        )}

        {step === "player" && (
          <>
            <h2>Dati giocatore</h2>
            <p className={styles.subtitle}>L'email è precompilata dall'invito e non può essere modificata.</p>
            <RegisterForm
              onSubmit={handlePlayerSubmit}
              initialEmail={accountEmail}
              emailReadOnly
              initialData={data}
            />
          </>
        )}

        {step === "payment" && data && (
          <>
            <h2>Pagamento</h2>
            <p className={styles.subtitle}>Controlla i dati prima del pagamento.</p>
            <div className={styles.summaryGrid}>
              <SummaryRow label="Email" value={data.email} />
              <SummaryRow label="Nome" value={data.nome} />
              <SummaryRow label="Cognome" value={data.cognome} />
              <SummaryRow label="Data di nascita" value={data.nascita} />
              <SummaryRow label="Codice fiscale" value={data.cf} />
              <SummaryRow label="Numero maglia" value={data.numero} />
              <SummaryRow label="Taglia" value={data.taglia} />
              <SummaryRow label="Posizione" value={data.posizione} />
              {data.privacy && <SummaryRow label="Privacy" value="Accettata" />}
              {data.genitoreNome || data.genitoreCognome ? (
                <>
                  <SummaryRow label="Nome genitore" value={data.genitoreNome} />
                  <SummaryRow label="Cognome genitore" value={data.genitoreCognome} />
                  <SummaryRow label="Data di nascita genitore" value={data.genitoreNascita} />
                  <SummaryRow label="Codice fiscale genitore" value={data.genitoreCf} />
                </>
              ) : null}
            </div>
            <div className={styles.actions}>
              <button className="button secondary" onClick={()=> setStep("player")}>Indietro</button>
              <PaymentButton amount={25} onSuccess={handlePaid} />
            </div>
          </>
        )}

        {step === "done" && (
          <div className={styles.success}>
            <h2>Iscrizione completata con successo</h2>
            <p>Riceverai una email di conferma con i dettagli dell'iscrizione.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className={styles.row}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
    </div>
  );
}
