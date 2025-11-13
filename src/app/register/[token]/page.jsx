"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import RegisterForm from "../../components/RegisterForm";
import PaymentButton from "../../components/PaymentButton";
import styles from "./page.module.css";

export default function RegisterPage() {
  const { token } = useParams();
  const [step, setStep] = useState("form");
  const [data, setData] = useState(null);

  const handleSubmit = (formData) => {
    setData(formData);
    setStep("summary");
  };

  const handlePaid = () => {
    setStep("done");
  };

  return (
    <div className={styles.wrapper}>
      <div className={"card " + styles.card}>
        {step === "form" && (
          <>
            <h2>Registrazione giocatore</h2>
            <p className={styles.subtitle}>Token invito: <code>{token}</code></p>
            <RegisterForm onSubmit={handleSubmit} />
          </>
        )}

        {step === "summary" && (
          <>
            <h2>Riepilogo iscrizione</h2>
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
              {/* Genitore se minorenne */}
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
              <button className="button secondary" onClick={()=> setStep("form")}>Indietro</button>
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
