"use client";
import styles from "./PaymentButton.module.css";
import { createCheckoutSessionMock } from "../lib/mockApi";

export default function PaymentButton({ amount = 25, onSuccess }) {
  const handlePay = async () => {
    try {
      const res = await createCheckoutSessionMock(amount * 100);
      if (res?.url) {
        window.open(res.url, "_blank", "noopener,noreferrer");
      }
      // Simulate success after redirect
      setTimeout(() => {
        onSuccess?.();
      }, 800);
    } catch (e) {
      alert("Pagamento non disponibile: " + e.message);
    }
  };

  return (
    <button className={styles.pay + " button"} onClick={handlePay}>
      Paga quota
      <span className={styles.amount}>{amount.toFixed(2)} €</span>
    </button>
  );
}
