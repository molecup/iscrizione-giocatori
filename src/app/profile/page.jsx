"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import RegisterForm from "@app/components/RegisterForm";
import PaymentButton from "@app/components/PaymentButton";
import styles from "./page.module.css";
import { useToast } from "@app/components/ToastProvider";
import { getUserData, updateSinglePlayer, submitRegistration, sendVerificationEmail } from "@app/lib/api";
import { useRouter } from "next/navigation";
import { getUserPermissions } from "@app/lib/auth";

export default function RegisterPage() {
  // const { token } = useParams();

  const initialData = {
    email: "",
    nome: "",
    cognome: "",
    nascita: "",
    luogoNascita: "",
    cf: "",
    numero: "",
    taglia: "",
    posizione: "",
    privacy: false,
    genitoreNome: "",
    genitoreCognome: "",
    genitoreNascita: "",
    genitoreLuogoNascita: "",
    genitoreCf: "",
  };

  const searchParams = useSearchParams();
  const toast = useToast();
  const [step, setStep] = useState("player");
  const [data, setData] = useState(initialData);
  const [emailVerified, setEmailVerified] = useState(false);
  const [confirmingSession, setConfirmingSession] = useState(false);
  const [confirmError, setConfirmError] = useState(null);
  const [backDisabled, setBackDisabled] = useState(false);
  const [price, setPrice] = useState(0.0);
  const [hasAcceptedFinalLock, setHasAcceptedFinalLock] = useState(false);
  const [finalConsentError, setFinalConsentError] = useState("");
  const router = useRouter();

  // Phase 1 state (account creation)

  const [loadingPrefill, setLoadingPrefill] = useState(true);

  useEffect(() => {
    (async () => {
      const user_permissions = await getUserPermissions()
      if (!user_permissions?.isPlayer) {
        router.push("/login");
      }
    })();
  }, [router]);

  // Fetch user data to prefill the form
  useEffect(() => {
    (async () => {
      try {
        const userData = await getUserData();
        setData({
          ...userData.formData
        });
        setEmailVerified(userData.info.email_verified);
        setPrice(userData.info.registration_fee);
        if (userData.info.is_complete) {
          setStep("summary");
        }
        setBackDisabled(!userData.info.can_edit);
      } catch (error) {
        toast.error("Errore nel caricamento dati: " + error.message);
      } finally {
        setLoadingPrefill(false);
      }
    })();
  }, []);

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
      setStep("summary");
      toast.error("Pagamento annullato");
    }
  }, [searchParams, toast]);

  // const validateAccount = () => {
  //   const e = {};
  //   if (!accountEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(accountEmail)) e.email = "Email non valida";
  //   if (!accountPassword || accountPassword.length < 6) e.password = "Minimo 6 caratteri";
  //   setAccErrors(e);
  //   return Object.keys(e).length === 0;
  // };

  // const submitAccount = async (e) => {
  //   e.preventDefault();
  //   if (!validateAccount()) return;
  //   setSubmittingAccount(true);
  //   try {
  //     await registerAccountApi({ token, email: accountEmail, password: accountPassword });
  //     setStep("player");
  //   } catch (err) {
  //     toast.error("Registrazione fallita: " + err.message);
  //   } finally {
  //     setSubmittingAccount(false);
  //   }
  // };

  const handlePlayerSubmit = async (formData, isMinor) => {
    // setData(formData);
    try {
      await updateSinglePlayer(formData, isMinor);
      setHasAcceptedFinalLock(false);
      setFinalConsentError("");
      setStep("summary");
    } catch (error) {
      toast.error("Errore: " + error.message);
    }
  };

  const handlePaid = () => {
    setStep("done");
  };

  const handleBackToForm = () => {
    setHasAcceptedFinalLock(false);
    setFinalConsentError("");
    setStep("player");
  };

  const handleConfirmData = async (e) => {
    e.preventDefault();
    if (!hasAcceptedFinalLock) {
      setFinalConsentError("Devi confermare di aver verificato i dati per poter procedere.");
      toast.error("Accetta il blocco definitivo dei dati prima di continuare.");
      return;
    }
    setFinalConsentError("");
    if (emailVerified === false) {
      toast.error("Devi verificare la tua email prima di procedere.");
      return;
    }
    try {
      await submitRegistration();
      setBackDisabled(true);
    } catch (error) {
      toast.error("Errore: " + error.message);
    }
  };

  const handleResendVerification = async (e) => {
    e.preventDefault();
    try {
      await sendVerificationEmail(data.email);
      toast.success("Email di verifica reinviata con successo!");
    } catch (error) {
      toast.error("Errore invio email di verifica: " + error.message);
    }
  };

  if (loadingPrefill) {
    return (
      <div className={styles.wrapper}>
        <div className={"card " + styles.loadingCard}>
          <p>Caricamento del profilo in corso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={"card " + styles.card}>
        {step === "player" && (
          <>
            <h2>Dati giocatore</h2>
            <p className={styles.subtitle}>L&apos;email è precompilata dall&apos;invito e non può essere modificata.</p>
            <RegisterForm
              onSubmit={handlePlayerSubmit}
              // initialEmail={accountEmail}
              form={data}
              setForm={setData}
              emailReadOnly
              // initialData={data}
            />
          </>
        )}

        {step === "summary" && data && (
          <>
            <div className={styles.summaryHeader}>
              <div>
                {!backDisabled ? (
                  <>
                    <h2>Riepilogo dati</h2>
                    <p className={styles.subtitle}>Rivedi con attenzione ogni informazione prima della conferma definitiva.</p>
                  </>
                ) : (
                  <>
                    <h2>Iscrizione completata</h2>
                    <p className={styles.subtitle}>I tuoi dati sono stati bloccati e non sono più modificabili.</p>
                  </>
                )}
                <div className={styles.statusRow}>
                  <span className={`${styles.badge} ${emailVerified ? styles.badgeSuccess : styles.badgeWarning}`}>
                    {emailVerified ? "Email verificata" : "Email da verificare"}
                  </span>
                  <span className={`${styles.badge} ${backDisabled ? styles.badgeMuted : styles.badgeInfo}`}>
                    {backDisabled ? "Dati bloccati" : "Ancora modificabili"}
                  </span>
                </div>
              </div>
              <div className={styles.summaryVisual}>
                <Image src="/globe.svg" alt="Profilo" width={96} height={96} />
              </div>
            </div>

            <section className={styles.sectionCard}>
              <h3>Dati giocatore</h3>
              <div className={styles.summaryGrid}>
                <SummaryRow label="Email" value={data.email} />
                <SummaryRow label="Nome" value={data.nome} />
                <SummaryRow label="Cognome" value={data.cognome} />
                <SummaryRow label="Data di nascita" value={data.nascita} />
                <SummaryRow label="Luogo di nascita" value={data.luogoNascita} />
                <SummaryRow label="Codice fiscale" value={data.cf} />
                <SummaryRow label="Numero maglia" value={data.numero} />
                <SummaryRow label="Taglia" value={data.taglia} />
                <SummaryRow label="Posizione" value={data.posizione} />
                {data.privacy && <SummaryRow label="Privacy" value="Accettata" />}
              </div>
            </section>

            {Boolean(data.genitoreNome || data.genitoreCognome) && (
              <section className={styles.sectionCard}>
                <h3>Dati genitore</h3>
                <div className={styles.summaryGrid}>
                  <SummaryRow label="Nome genitore" value={data.genitoreNome} />
                  <SummaryRow label="Cognome genitore" value={data.genitoreCognome} />
                  <SummaryRow label="Data di nascita genitore" value={data.genitoreNascita} />
                  <SummaryRow label="Luogo di nascita genitore" value={data.genitoreLuogoNascita} />
                  <SummaryRow label="Codice fiscale genitore" value={data.genitoreCf} />
                </div>
              </section>
            )}

            {confirmError && <p className={styles.error}>{confirmError}</p>}
            {!emailVerified && (
              <div className={styles.alertBox}>
                <h3>Verifica email richiesta</h3>
                <p>Per confermare devi aprire il link ricevuto via email. Al termine potrai proseguire con il pagamento.</p>
                <a href="/verify-email-resend" className="button secondary" onClick={handleResendVerification}>Reinvia email di verifica</a>
              </div>
            )}

            {!backDisabled && (
              <div className={styles.finalLock} role="alert">
                <div className={styles.finalLockIcon}>
                  <Image src="/window.svg" alt="Avviso" width={40} height={40} />
                </div>
                <div>
                  <h3>Conferma definitiva dei dati</h3>
                  <p className={styles.subtitle}>Una volta confermato non potrai più modificare le informazioni inserite. Usa il tasto indietro se devi correggere qualcosa.</p>
                  <label className={styles.consentCheckbox}>
                    <input
                      type="checkbox"
                      checked={hasAcceptedFinalLock}
                      onChange={(e) => setHasAcceptedFinalLock(e.target.checked)}
                      disabled={backDisabled}
                    />
                    <span>Ho verificato che tutti i dati sono corretti e accetto che non saranno più modificabili.</span>
                  </label>
                  {finalConsentError && <p className={styles.error}>{finalConsentError}</p>}
                </div>
              </div>
            )}

            <div className={styles.actions}>
              {!backDisabled && (
                <>
                  <button className="button secondary" onClick={handleBackToForm}>Indietro e modifica</button>
                  <button
                    className="button"
                    onClick={handleConfirmData}
                    disabled={!emailVerified || !hasAcceptedFinalLock || confirmingSession}
                  >
                    Conferma dati
                  </button>
                </>
              )}

              {price > 0.0 && (
                <PaymentButton
                  amount={price}
                  onSuccess={handlePaid}
                  customerEmail={data.email}
                  disabled={confirmingSession}
                  metadata={{
                    nome: data.nome,
                    cognome: data.cognome,
                    cf: data.cf,
                  }}
                />
              )}
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
