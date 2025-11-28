"use client";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import RegisterForm from "@app/components/RegisterForm";
import PaymentButton from "@app/components/PaymentButton";
import styles from "./page.module.css";
import { useToast } from "@app/components/ToastProvider";
import { getUserData, updateSinglePlayer, submitRegistration, sendVerificationEmail, confirmMedicalCertificate } from "@app/lib/api";
import { useRouter } from "next/navigation";
import { getUserPermissions } from "@app/lib/auth";
import MedicalCertificateUpload from "@app/components/MedicalCertificateUpload";

const ALLOW_FAKE_CERT = process.env.NEXT_PUBLIC_ALLOW_FAKE_MED_CERT === "true";

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
  const [certificate, setCertificate] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [paymentMessage, setPaymentMessage] = useState("");
  const certificateStatus = certificate?.status || "missing";
  const certificateLockedManually = certificate?.locked === true;
  const canLockCertificate = certificateStatus === "uploaded" && !certificateLockedManually;
  const isCertificateLocked = backDisabled || certificateLockedManually;
  const certificateBadge = certificateStatus === "uploaded"
    ? { className: styles.badgeCertReady, label: "Certificato caricato" }
    : certificateStatus === "loading"
      ? { className: styles.badgeCertReview, label: "Certificato in revisione" }
      : { className: styles.badgeCertPending, label: "Certificato da caricare" };
  const emailBadgeClass = emailVerified ? styles.badgeEmailOk : styles.badgeEmailWarn;
  const dataBadgeClass = backDisabled ? styles.badgeDataLocked : styles.badgeDataEditable;
  const requiresPayment = price > 0;
  const paymentComplete = !requiresPayment || paymentStatus === "paid";
  const summaryTitle = paymentComplete
    ? "Iscrizione completata"
    : backDisabled
      ? "Ultimo passo: completa il pagamento"
      : "Riepilogo dati";
  const summaryDescription = paymentComplete
    ? "Abbiamo ricevuto tutto ciò che serve. Puoi rivedere i dati in qualsiasi momento."
    : backDisabled
      ? "Hai appena bloccato i dati: completa il pagamento per chiudere l'iscrizione."
      : "Ricontrolla le informazioni e bloccale solo quando sei sicuro al 100%.";
  const summaryEyebrow = paymentComplete ? "Grazie!" : backDisabled ? "Ancora un passo" : "Quasi fatto";
  const paymentBadge = !requiresPayment
    ? { className: styles.badgePaymentOk, label: "Quota non dovuta" }
    : paymentStatus === "paid"
      ? { className: styles.badgePaymentOk, label: "Pagamento registrato" }
      : paymentStatus === "failed" || paymentStatus === "canceled"
        ? { className: styles.badgePaymentWarn, label: "Pagamento da riprovare" }
        : paymentStatus === "processing"
          ? { className: styles.badgePaymentInfo, label: "Pagamento in verifica" }
          : { className: styles.badgePaymentWarn, label: "Pagamento mancante" };
  const paymentMessageTone = paymentStatus === "paid" || paymentStatus === "not_required"
    ? styles.paymentMessageSuccess
    : paymentStatus === "failed" || paymentStatus === "canceled"
      ? styles.paymentMessageError
      : styles.paymentMessageWarn;
  const router = useRouter();
  const paymentCalloutClass = !requiresPayment || paymentStatus === "paid"
    ? styles.paymentCalloutSuccess
    : paymentStatus === "failed" || paymentStatus === "canceled"
      ? styles.paymentCalloutError
      : styles.paymentCalloutPending;
  const paymentCalloutTitle = !requiresPayment
    ? "Nessun pagamento richiesto"
    : paymentStatus === "paid"
      ? "Quota saldata"
      : backDisabled
        ? "Serve ancora il pagamento"
        : "Prima blocca i dati";
  const paymentCalloutBody = !requiresPayment
    ? "Il club copre la quota di iscrizione, non è necessario alcun versamento."
    : paymentStatus === "paid"
      ? "Abbiamo registrato il pagamento e l'iscrizione è completa."
      : backDisabled
        ? "Premi sul pulsante qui sotto per aprire Stripe e saldare la quota."
        : "Verifica l'email e blocca i dati per sbloccare il pagamento.";
  const formattedPrice = Number(price || 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
        const registrationFee = Number(userData.info.registration_fee || 0);
        setPrice(registrationFee);
        const initialPaymentStatus = registrationFee > 0 ? userData.info.payment_status || "pending" : "not_required";
        setPaymentStatus(initialPaymentStatus);
        setPaymentMessage(initialPaymentStatus === "paid" ? "Pagamento già registrato." : "");
        if (userData.info.is_complete) {
          setStep("summary");
        }
        setBackDisabled(!userData.info.can_edit);
        setCertificate(userData.info.medical_certificate || { status: "missing" });
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
      setPaymentMessage("");
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
          setPaymentStatus("paid");
          setPaymentMessage("Pagamento registrato con successo.");
          toast.success("Pagamento registrato con successo.");
          setStep("summary");
        } catch (err) {
          setPaymentStatus("failed");
          setConfirmError(err.message || "Impossibile verificare il pagamento");
          setPaymentMessage("Non siamo riusciti a verificare il pagamento. Riprova.");
          toast.error("Conferma pagamento fallita");
        } finally {
          setConfirmingSession(false);
          router.replace("/profile");
        }
      })();
    } else if (canceled === "1") {
      setStep("summary");
      setPaymentStatus("canceled");
      setPaymentMessage("Pagamento annullato. Puoi riprovare quando vuoi.");
      toast.error("Pagamento annullato");
      router.replace("/profile");
    }
  }, [router, searchParams, toast]);

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
    if (certificate?.status !== "uploaded") {
      toast.error("Carica prima il certificato medico in PDF.");
      return;
    }
    try {
      await submitRegistration();
      setBackDisabled(true);
      toast.success(requiresPayment ? "Dati confermati. Completa il pagamento per concludere." : "Iscrizione completata.");
      if (!requiresPayment) {
        setPaymentStatus("paid");
        setPaymentMessage("Quota non dovuta, iscrizione completata.");
      }
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

  const handleConfirmCertificate = useCallback(async () => {
    if (ALLOW_FAKE_CERT) {
      setCertificate((prev) => ({
        ...(prev || {}),
        status: "uploaded",
        locked: true,
        lockedAt: new Date().toISOString(),
        fileName: prev?.fileName || "certificato-simulato.pdf",
        uploadedAt: prev?.uploadedAt || new Date().toISOString(),
      }));
      toast.success("Certificato confermato (simulato).");
      return;
    }
    try {
      const payload = await confirmMedicalCertificate();
      setCertificate(payload);
      toast.success("Certificato confermato correttamente.");
    } catch (error) {
      toast.error(error.message || "Errore nella conferma del certificato.");
      throw error;
    }
  }, [ALLOW_FAKE_CERT, toast]);

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
            <div className={styles.summaryHero}>
              <div className={styles.summaryIntro}>
                <span className={styles.summaryEyebrow}>{summaryEyebrow}</span>
                <h2>{summaryTitle}</h2>
                <p className={styles.subtitle}>{summaryDescription}</p>
                <div className={styles.summaryStatus}>
                  <span className={`${styles.badge} ${emailBadgeClass}`}>
                    {emailVerified ? "Email verificata" : "Email da verificare"}
                  </span>
                  <span className={`${styles.badge} ${dataBadgeClass}`}>
                    {backDisabled ? "Dati bloccati" : "Ancora modificabili"}
                  </span>
                  <span className={`${styles.badge} ${certificateBadge.className}`}>
                    {certificateBadge.label}
                  </span>
                  <span className={`${styles.badge} ${paymentBadge.className}`}>
                    {paymentBadge.label}
                  </span>
                </div>
                <p className={styles.certificateNote}>
                  {backDisabled ? "Il certificato è stato confermato e non può più essere modificato." : "Il certificato medico si può caricare finché l'iscrizione non viene bloccata."}
                </p>
              </div>
              <div className={styles.summaryVisual}>
                <Image src="/globe.svg" alt="Profilo" width={120} height={120} />
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
            <div className={styles.certificateSection}>
              {!isCertificateLocked ? (
                <MedicalCertificateUpload
                  certificate={certificate}
                  onChange={setCertificate}
                  locked={false}
                  canLock={canLockCertificate}
                  onConfirmCertificate={handleConfirmCertificate}
                />
              ) : (
                <div className={styles.certificateSummary}>
                  <h4>Certificato medico confermato</h4>
                  <p>Caricato il {certificate?.uploadedAt ? new Date(certificate.uploadedAt).toLocaleDateString("it-IT") : "-"}.</p>
                  {certificate?.fileName && <p>File: {certificate.fileName}</p>}
                </div>
              )}
            </div>
            {confirmError && <p className={styles.error}>{confirmError}</p>}
            {!emailVerified && (
              <div className={styles.alertBox}>
                <h3>Verifica email richiesta</h3>
                <p>Per confermare devi aprire il link ricevuto via email. Al termine potrai proseguire con il pagamento.</p>
                <div className={styles.resendLink}>
                  <a href="/verify-email-resend" className="button secondary" onClick={handleResendVerification}>Reinvia email di verifica</a>
                </div>
              </div>
            )}

            {!backDisabled && (
              <div className={styles.finalLock} role="alert">
                <div className={styles.finalLockIcon}>
                  <Image src="/window.svg" alt="Avviso" width={40} height={40} />
                </div>
                <div>
                  <h3>Conferma definitiva dei dati</h3>
                  <p className={styles.subtitle}>Una volta confermato non potrai più modificare le informazioni inserite né sostituire il certificato medico.</p>
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

            <div className={`${styles.paymentCallout} ${paymentCalloutClass}`}>
              <div className={styles.paymentCalloutText}>
                <span className={styles.paymentEyebrow}>Pagamento</span>
                <h3>{paymentCalloutTitle}</h3>
                <p>{paymentCalloutBody}</p>
                {paymentMessage && (
                  <p className={`${styles.paymentMessage} ${paymentMessageTone}`}>{paymentMessage}</p>
                )}
              </div>
              {requiresPayment && (
                <div className={styles.paymentCalloutAmount}>
                  <span>Da versare</span>
                  <strong>{formattedPrice} €</strong>
                </div>
              )}
            </div>

            <div className={styles.actions}>
              {!backDisabled && (
                <>
                  <button className="button secondary" onClick={handleBackToForm}>Indietro e modifica</button>
                  <button
                    className="button"
                    onClick={handleConfirmData}
                    disabled={!emailVerified || !hasAcceptedFinalLock || confirmingSession || certificateStatus !== "uploaded"}
                  >
                    Conferma dati
                  </button>
                </>
              )}

              {requiresPayment && paymentStatus !== "paid" && (
                <PaymentButton
                  amount={price}
                  customerEmail={data.email}
                  disabled={!backDisabled || confirmingSession}
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
