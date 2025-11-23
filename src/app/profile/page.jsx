"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import RegisterForm from "@app/components/RegisterForm";
import PaymentButton from "@app/components/PaymentButton";
import styles from "./page.module.css";
import { getEmailFromTokenApi } from "@app/lib/mockApi";
import { registerAccountApi } from "@app/lib/auth";
import { useToast } from "@app/components/ToastProvider";

export default function RegisterPage() {
  const { token } = useParams();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [step, setStep] = useState("player");
  const [data, setData] = useState(null);
  const [confirmingSession, setConfirmingSession] = useState(false);
  const [confirmError, setConfirmError] = useState(null);

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

  // Handle return from Stripe (success/cancel)
  useEffect(() => {
    const sessionId = searchParams?.get("session_id");
    const canceled = searchParams?.get("canceled");
    if (sessionId) {
      setConfirmError(null);
      setConfirmingSession(true);
      (async () => {
        try {
          const resp = await fetch("/api/checkout/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session_id: sessionId }),
          });
          if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(err?.error || "Pagamento non verificato");
          }
          setStep("done");
        } catch (err) {
          setConfirmError(err.message || "Impossibile verificare il pagamento");
          toast.error("Conferma pagamento fallita");
        } finally {
          setConfirmingSession(false);
        }
      })();
    } else if (canceled === "1") {
      setStep("payment");
      toast.error("Pagamento annullato");
    }
  }, [searchParams, toast]);

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
        {step === "player" && (
          <>
            <h2>Dati giocatore</h2>
            <p className={styles.subtitle}>L&apos;email è precompilata dall&apos;invito e non può essere modificata.</p>
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
            {confirmError && <p className={styles.error}>{confirmError}</p>}
            <div className={styles.actions}>
              <button className="button secondary" onClick={()=> setStep("player")}>Indietro</button>
              <PaymentButton
                amount={0.5}
                onSuccess={handlePaid}
                customerEmail={data.email}
                disabled={confirmingSession}
                metadata={{
                  token,
                  nome: data.nome,
                  cognome: data.cognome,
                  cf: data.cf,
                }}
              />
            </div>
            {confirmingSession && <p className={styles.subtitle}>Verifica pagamento in corso...</p>}
          </>
        )}

        {step === "done" && (
          <div className={styles.success}>
            <h2>Iscrizione completata con successo</h2>
            <p>Riceverai una email di conferma con i dettagli dell&apos;iscrizione.</p>
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
