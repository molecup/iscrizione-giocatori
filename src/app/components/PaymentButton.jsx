"use client";
import styles from "./PaymentButton.module.css";
import { useToast } from "./ToastProvider";
import { useState } from "react";

const ALLOWED_AMOUNTS_EUR = new Set([25, 40]);

export default function PaymentButton({ amount = 25, customerEmail, metadata, disabled = false, productName, productDescription, label }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const amountNumber = Number(amount);
  const isCents = Number.isFinite(amountNumber) && Number.isInteger(amountNumber) && amountNumber > 200; // heuristic
  const amountEur = isCents ? amountNumber / 100 : amountNumber;
  const amountCents = Math.round(amountEur * 100);

  const handlePay = async () => {
    try {
      if (!Number.isFinite(amountEur) || amountEur <= 0) {
        toast.error("Importo non valido");
        return;
      }
      if (!ALLOWED_AMOUNTS_EUR.has(Math.round(amountEur))) {
        toast.error("Importo non supportato. Ammessi: 25€ o 40€.");
        return;
      }

      setLoading(true);

      const resp = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountCents,
          currency: "EUR",
          customer_email: customerEmail,
          metadata,
          product_name: productName,
          product_description: productDescription,
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
    <button className={styles.pay + " button"} onClick={handlePay} disabled={loading || disabled}>
      {loading ? "Reindirizzamento..." : (label || "Paga quota")}
      <span className={styles.amount}>{amountEur} €</span>
    </button>
  );
}
