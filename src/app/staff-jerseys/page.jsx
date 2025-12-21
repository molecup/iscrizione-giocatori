"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import PaymentButton from "@app/components/PaymentButton";
import { useToast } from "@app/components/ToastProvider";
import { useRouter } from "next/navigation";
import { getUserPermissions } from "@app/lib/auth";

export default function StaffJerseysPage() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [numero, setNumero] = useState("");
  const [persona, setPersona] = useState("");
  const [email, setEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    (async () => {
      const user_permissions = await getUserPermissions();
      if (!user_permissions?.isManager) {
        router.push("/login");
      } else {
        setAuthorized(true);
      }
    })();
  }, [router]);

  useEffect(() => {
    if (searchParams.get("session_id")) {
      setIsSuccess(true);
      toast.success("Pagamento effettuato con successo!");
    }
    if (searchParams.get("canceled")) {
      toast.error("Pagamento annullato.");
    }
  }, [searchParams, toast]);

  const handleNewRequest = () => {
    setIsSuccess(false);
    setNome("");
    setNumero("");
    setPersona("");
    setEmail("");
  };

  if (!authorized) return null;

  return (
    <>
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Richiesta Maglia Staff</h1>
          <p className={styles.description}>
            In questa pagina puoi richiedere le maglie per lo staff. Ogni maglia ha un costo di 25€.
            Dopo aver effettuato il pagamento, potrai richiederne un'altra.
          </p>

          {isSuccess ? (
            <div className={styles.successCard}>
              <p className={styles.successTitle}>Richiesta inviata!</p>
              <p>Il pagamento per la maglia è stato confermato. Riceverai presto aggiornamenti.</p>
              <button className="button primary" onClick={handleNewRequest}>
                Richiedi un'altra maglia
              </button>
            </div>
          ) : (
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="persona">Nome della persona</label>
                <input
                  type="text"
                  id="persona"
                  className={styles.input}
                  value={persona}
                  onChange={(e) => setPersona(e.target.value)}
                  placeholder="Esempio: Mario Rossi"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="email">Email della persona</label>
                <input
                  type="email"
                  id="email"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Esempio: mario.rossi@example.com"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="nome">Nome dietro la maglia</label>
                <input
                  type="text"
                  id="nome"
                  className={styles.input}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Esempio: ROSSI"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="numero">Numero</label>
                <input
                  type="number"
                  id="numero"
                  className={styles.input}
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="Esempio: 10"
                />
              </div>
              
              <div className={styles.priceInfo}>
                Prezzo: 25,00 €
              </div>

              <div className={styles.payButton}>
                <PaymentButton
                  amount={25}
                  customerEmail={email}
                  label="Paga maglia"
                  productName="Maglia Staff"
                  productDescription={`Maglia staff per ${persona || 'N/D'} (${email || 'N/D'}) - Nome: ${nome || 'N/D'}, Numero: ${numero || 'N/D'}`}
                  metadata={{
                    type: "staff_jersey",
                    persona: persona,
                    email: email,
                    nome_dietro: nome,
                    numero: numero
                  }}
                  disabled={!nome || !numero || !persona || !email}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
