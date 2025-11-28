"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import styles from "./MedicalCertificateUpload.module.css";
import { useToast } from "@app/components/ToastProvider";

const MAX_BYTES = Number(process.env.NEXT_PUBLIC_MED_CERT_MAX_BYTES || 5 * 1024 * 1024);
const LOCK_HINT = "Puoi caricare o sostituire il certificato anche dopo aver bloccato i dati.";

export default function MedicalCertificateUpload({ certificate, onChange, locked = false }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const effectiveStatus = certificate?.status || "missing";
  const statusMeta = useMemo(() => statusConfig[effectiveStatus] || statusConfig.missing, [effectiveStatus]);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Carica un file PDF valido.");
      return;
    }
    if (file.size > MAX_BYTES) {
      const mb = Math.round((MAX_BYTES / (1024 * 1024)) * 10) / 10;
      toast.error(`Il file supera il limite di ${mb} MB.`);
      return;
    }

    const data = new FormData();
    data.append("file", file);
    setUploading(true);
    try {
      const res = await fetch("/api/medical-certificate", {
        method: "POST",
        body: data,
      });
      if (!res.ok) {
        const body = await safeJson(res);
        throw new Error(body?.error || "Upload non riuscito.");
      }
      const payload = await res.json();
      onChange?.(payload);
      toast.success("Certificato caricato correttamente.");
    } catch (error) {
      toast.error(error.message || "Errore durante l'upload.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [onChange, toast]);

  const handleDelete = useCallback(async () => {
    setUploading(true);
    try {
      const res = await fetch("/api/medical-certificate", { method: "DELETE" });
      if (!res.ok) {
        const body = await safeJson(res);
        throw new Error(body?.error || "Impossibile eliminare il certificato.");
      }
      const payload = await res.json();
      onChange?.(payload);
      toast.info("Certificato rimosso.");
    } catch (error) {
      toast.error(error.message || "Errore nella rimozione.");
    } finally {
      setUploading(false);
    }
  }, [onChange, toast]);

  const showLockHint = locked;
  const busy = uploading || effectiveStatus === "loading";

  return (
    <div className={styles.card} aria-live="polite">
      <header className={styles.header}>
        <div>
          <h3>Certificato medico agonistico</h3>
          <p className={styles.subtitle}>Serve il PDF firmato dal medico per completare l&apos;iscrizione. {LOCK_HINT}</p>
        </div>
        <span className={`${styles.badge} ${styles[statusMeta.tone]}`}>{statusMeta.label}</span>
      </header>

      {certificate?.fileName && (
        <div className={styles.fileInfo}>
          <div>
            <strong>{certificate.fileName}</strong>
            <p>Caricato il {formatDate(certificate.uploadedAt)} · {formatSize(certificate.size)}</p>
          </div>
          <div className={styles.fileActions}>
            {certificate.downloadUrl && (
              <a className="button ghost" href={certificate.downloadUrl} target="_blank" rel="noreferrer">
                Scarica
              </a>
            )}
            <button className="button secondary" onClick={handleDelete} disabled={busy}>
              Rimuovi
            </button>
          </div>
        </div>
      )}

      <div
        className={[styles.dropzone, dragActive ? styles.dropzoneActive : "", busy ? styles.dropzoneDisabled : ""].join(" ")}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (busy) return;
          const file = e.dataTransfer.files?.[0];
          handleFile(file);
        }}
      >
        <div>
          <p className={styles.dropTitle}>{busy ? "Attendi..." : "Trascina qui il PDF"}</p>
          <p className={styles.dropHint}>Oppure seleziona il file dal tuo dispositivo</p>
          <button className="button ghost" type="button" onClick={() => inputRef.current?.click()} disabled={busy}>
            Sfoglia file
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className={styles.hiddenInput}
          onChange={(e) => handleFile(e.target.files?.[0])}
          disabled={busy}
        />
      </div>

      {showLockHint && (
        <p className={styles.lockedMessage}>{LOCK_HINT}</p>
      )}
    </div>
  );
}

const statusConfig = {
  loading: { label: "Verifica in corso", tone: "badgeInfo" },
  missing: { label: "Certificato mancante", tone: "badgeWarning" },
  uploaded: { label: "Certificato caricato", tone: "badgeSuccess" },
};

async function safeJson(res) {
  try {
    return await res.json();
  } catch (error) {
    return null;
  }
}

function formatDate(value) {
  if (!value) return "";
  const dt = new Date(value);
  return dt.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
}

function formatSize(bytes) {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  if (mb < 1) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${mb.toFixed(1)} MB`;
}
