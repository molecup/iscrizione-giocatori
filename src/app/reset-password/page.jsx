"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";
// import { getEmailFromTokenApi } from "../../lib/mockApi";
import { resetPassword as resetPasswordApi, login } from "@app/lib/auth";
import { useToast } from "@app/components/ToastProvider";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const mail = searchParams.get("mail");
  const router = useRouter();
  const toast = useToast();
  

  // Phase 1 state (account creation)
  const [accountPassword, setAccountPassword] = useState("");
  const [accountPasswordRepeat, setAccountPasswordRepeat] = useState("");
  const [submittingReset, setSubmittingReset] = useState(false);
  const [accErrors, setAccErrors] = useState({});

  // useEffect(() => {
  //   let ignore = true;
  //   (async () => {
  //     try {
  //       const res = await getEmailFromTokenApi(token);
  //       if (!ignore) setAccountEmail(res?.email || "");
  //     } catch (e) {
  //       // silent: keep empty
  //     } finally {
  //       if (!ignore) setLoadingPrefill(false);
  //     }
  //   })();
  //   return () => { ignore = true; };
  // }, [token]);

  const validateAccount = () => {
    const e = {};
    if (!accountPassword || accountPassword.length < 6) e.password = "Minimo 6 caratteri";
    if (accountPassword !== accountPasswordRepeat) e.passwordRepeat = "Le password non coincidono";
    setAccErrors(e);
    return Object.keys(e).length === 0;
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (!validateAccount()) return;
    setSubmittingReset(true);
    try {
      await resetPasswordApi(token, mail, accountPassword);
      toast.success("Password reimpostata con successo!");
      const login_info = await login({ email: mail, password: accountPassword }, false);
      if (login_info.ok && login_info.isPlayer)
         router.push("/profile");
      else if (login_info.ok && login_info.isManager)
         router.push("/dashboard");
      else
         router.push("/login");
    } catch (err) {
      toast.error("Reimpostazione password fallita: " + err.message);
    } finally {
    setSubmittingReset(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={"card " + styles.card}>
          <>
            <h2>Imposta password</h2>
            <form onSubmit={resetPassword} className={styles.formAccount}>
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
              <label className={styles.field}>
                <span className="label">Ripeti password</span>
                <input
                  className="input"
                  type="password"
                  value={accountPasswordRepeat}
                  onChange={(e)=>setAccountPasswordRepeat(e.target.value)}
                  required
                />
                {accErrors.passwordRepeat && <span className={styles.error}>{accErrors.passwordRepeat}</span>}
              </label>
              <div className={styles.actions}>
                <button className="button" type="submit" disabled={submittingReset}>
                  {submittingReset ? "Caricamento..." : "Reimposta password"}
                </button>
              </div>
            </form>
          </>
      </div>
    </div>
  );
}
