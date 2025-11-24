"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";
// import { getEmailFromTokenApi } from "../../lib/mockApi";
import { verifyEmail } from "@app/lib/auth";
import { useToast } from "@app/components/ToastProvider";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const mail = searchParams.get("mail");
  // const router = useRouter();
  const toast = useToast();
  

  const [step, setStep] = useState("loading");

  useEffect(() => {
    (async () => {
      try {
        await verifyEmail(token, mail);
        setStep("done");
      } catch (err) {
        toast({ type: "error", message: err.message || "Errore di verifica" });
        setStep("error");
      }
    })();
  }, []);

  return (
    <div className={styles.wrapper}>
      <div className={"card " + styles.card}>
          {step === "loading" && <>
            <h2>Verifica mail in corso...</h2>
            <p>Attendi qualche istante</p>
          </>}
          {step === "done" && <>
            <h2>Mail verificata!</h2>
            <p>Ora puoi completare l&rsquo;iscrizione nella tua <a href="/profile">pagina personale</a>.</p>
          </>}
          {step === "error" && <>
            <h2>Errore di verifica</h2>
            <p>Il link di verifica non è valido o è scaduto.</p>
          </>}
      </div>
    </div>
  );
}
