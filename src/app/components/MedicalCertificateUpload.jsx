"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import styles from "./MedicalCertificateUpload.module.css";
import { useToast } from "@app/components/ToastProvider";

const MAX_BYTES = Number(process.env.NEXT_PUBLIC_MED_CERT_MAX_BYTES || 5 * 1024 * 1024);
const CARD_SUBTITLE = "Serve il PDF firmato dal medico per completare l'iscrizione.";
const PRE_LOCK_HINT = "Carica il PDF firmato prima di confermare i dati.";
const POST_UPLOAD_HINT = "Il certificato resta modificabile finché non lo confermi manualmente.";
const LOCKED_HINT = "Certificato confermato: per modifiche contatta la segreteria.";
const ALLOW_FAKE_UPLOAD = process.env.NEXT_PUBLIC_ALLOW_FAKE_MED_CERT === "true";
const TOAST_FAKE_HINT = "Modalità demo certificato attiva";

export default function MedicalCertificateUpload({ certificate, onChange, locked = false, onConfirmCertificate, canLock = false }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  const effectiveStatus = certificate?.status || "missing";
  const statusMeta = useMemo(() => statusConfig[effectiveStatus] || statusConfig.missing, [effectiveStatus]);

  const handleFile = useCallback(async (file) => {
    if (locked) return;
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
  }, [locked, onChange, toast]);

  const handleDelete = useCallback(async () => {
    if (locked) return;
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
  }, [locked, onChange, toast]);

  const handleConfirmClick = useCallback(async () => {
    if (ALLOW_FAKE_UPLOAD) {
      onChange?.({
        ...(certificate || {}),
        status: "uploaded",
        locked: true,
        lockedAt: new Date().toISOString(),
        fileName: certificate?.fileName || "certificato-simulato.pdf",
        uploadedAt: certificate?.uploadedAt || new Date().toISOString(),
        size: certificate?.size || 512000,
        downloadUrl: certificate?.downloadUrl || "#",
      });
      toast.success("Certificato confermato (simulato).");
      return;
    }
    if (!onConfirmCertificate) return;
    setUploading(true);
    try {
      await onConfirmCertificate();
    } finally {
      setUploading(false);
    }
  }, [ALLOW_FAKE_UPLOAD, certificate, onChange, onConfirmCertificate, toast]);

  const simulateUpload = useCallback(() => {
    if (!ALLOW_FAKE_UPLOAD || locked) return;
    setUploading(true);
    setTimeout(() => {
      onChange?.({
        status: "uploaded",
        fileName: "certificato-simulato.pdf",
        uploadedAt: new Date().toISOString(),
        size: 512000,
        downloadUrl: "#",
      });
      toast.success("Certificato simulato (solo test).");
      setUploading(false);
    }, 600);
  }, [locked, onChange, toast]);

  const busy = uploading || effectiveStatus === "loading";
  const disabled = locked || busy;
  const helperText = locked ? LOCKED_HINT : (certificate?.status === "uploaded" ? POST_UPLOAD_HINT : PRE_LOCK_HINT);

  return (
    <div className={styles.card} aria-live="polite">
      {ALLOW_FAKE_UPLOAD && (
        <p className={styles.demoBanner}>{TOAST_FAKE_HINT}</p>
      )}

      <header className={styles.header}>
        <div>
          <h3>Certificato medico agonistico</h3>
          <p className={styles.subtitle}>{CARD_SUBTITLE}</p>
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
            {!locked && (
              <button className="button secondary" onClick={handleDelete} disabled={disabled}>
                Rimuovi
              </button>
            )}
            {!locked && canLock && (
              <button className="button" onClick={handleConfirmClick} disabled={disabled}>
                {ALLOW_FAKE_UPLOAD ? "Conferma simulata" : "Conferma certificato"}
              </button>
            )}
          </div>
        </div>
      )}

      <div
        className={[styles.dropzone, dragActive ? styles.dropzoneActive : "", disabled ? styles.dropzoneDisabled : ""].join(" ")}
        onDragOver={(e) => {
          e.preventDefault();
          if (disabled) return;
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (disabled) return;
          const file = e.dataTransfer.files?.[0];
          handleFile(file);
        }}
      >
        <div>
          <p className={styles.dropTitle}>{disabled ? (locked ? "Bloccato" : "Attendi...") : "Trascina qui il PDF"}</p>
          <p className={styles.dropHint}>{locked ? "Certificato non più modificabile" : "Oppure seleziona il file dal tuo dispositivo"}</p>
          <button className="button ghost" type="button" onClick={() => inputRef.current?.click()} disabled={disabled}>
            Sfoglia file
          </button>
          {ALLOW_FAKE_UPLOAD && !locked && (
            <button
              className="button secondary"
              type="button"
              onClick={simulateUpload}
              disabled={disabled}
              title="Disponibile solo in sviluppo"
            >
              Simula caricamento
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className={styles.hiddenInput}
          onChange={(e) => handleFile(e.target.files?.[0])}
          disabled={disabled}
        />
      </div>

      {helperText && (
        <p className={styles.lockedMessage}>{helperText}</p>
      )}
      {ALLOW_FAKE_UPLOAD && (
        <p className={styles.demoNote}>Operazioni simulate, nessun dato viene inviato al server.</p>
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
