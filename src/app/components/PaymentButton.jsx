"use client";
import styles from "./PaymentButton.module.css";
import { useToast } from "./ToastProvider";
import { useState } from "react";


export default function PaymentButton({ amount = 50, onSuccess, customerEmail, metadata }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const handlePay = async () => {
    try {
      setLoading(true);

      const resp = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          currency: "EUR",
          customer_email: customerEmail,
          metadata,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error || "Impossibile creare la sessione di pagamento");
      }

      if (!data.url) {
        throw new Error("URL della sessione non disponibile");
      }

      // Reindirizza direttamente all'URL della sessione Stripe
      window.location.href = data.url;
      // Nota: in caso di successo si verrà reindirizzati alla pagina di successo configurata
      // Non possiamo chiamare onSuccess qui poiché c'è un full redirect
    } catch (e) {
      toast.error("Pagamento non disponibile: " + (e?.message || "Errore sconosciuto"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className={styles.pay + " button"} onClick={handlePay} disabled={loading}>
      {loading ? "Reindirizzamento..." : "Paga quota"}
      <span className={styles.amount}>{amount.toFixed(2)} €</span>
    </button>
  );
}
