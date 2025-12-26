"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import PlayerTable from "@app/components/PlayerTable";
import Modal from "@app/components/Modal";
// import { getTeamApi, updatePlayersApi, requestRemovalApi } from "../lib/mockApi";
import {getPlayers, updatePlayers, requestRemovalApi, registerPlayerForManager, submitPlayerList} from "@app/lib/api";
import { useToast } from "@app/components/ToastProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUserPermissions } from "@app/lib/auth";

export default function DashboardPage() {
  const toast = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [teamName, setTeamName] = useState("");
  const [registerLink, setRegisterLink] = useState("");
  const [players, setPlayers] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removal, setRemoval] = useState(null);
  const [hidePayment, setHidePayment] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  useEffect(() => {
    (async () => {
      const user_permissions = await getUserPermissions()
      if (!user_permissions?.isManager) {
        router.push("/login");
      }
    })();
  }, []);


  useEffect(() => {
    (async () => {
      try {
        const data = await getPlayers();
        if (!data.ok) {
          toast.error("Errore caricamento dati squadra: " + (data.error || "Errore sconosciuto"));
        }
        else{
          setTeamName(data.teamName);
          setRegisterLink(data.registerLink);
          setPlayers(data.players);
          setHidePayment(data.registration_fee <= 0);
          setSubmitted(data.confermata);
        }
      } catch (e) {
        toast.error("Errore caricamento dati squadra");
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const saveChanges = async () => {
    setSaving(true);
    try {
      const res = await updatePlayers(players);
      if (!res.ok) {
        toast.error("Errore salvataggio: " + (res.error || "Errore sconosciuto"));
      }
      else {
        setPlayers(res.players);
        toast.success("Modifiche salvate");
      }
    } catch (e) {
      toast.error("Errore salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const requestRemoval = async (player) => {
    setRemoval(player);
  };

  const confirmRemoval = async () => {
    try {
      const res = await requestRemovalApi(removal.id);
      if (!res.ok) {
        toast.error("Errore invio richiesta: " + (res.error || "Errore sconosciuto"));
      }
      else {
        toast.success("Richiesta inviata alla lega");
      }
    } catch (e) {
      toast.error("Errore invio richiesta");
    } finally {
      setRemoval(null);
    }
  };

  const handleSubmitList = async (e) => {
    e.preventDefault();
    const playerNum = players.filter((p) => p.confermato).length
    if (playerNum < 22) {
      toast.error("Devi avere almeno 22 iscrizioni complete per inviare la conferma definitiva.");
      setShowSubmitConfirm(false);
      return;
    }
    if (playerNum > 25) {
      toast.error("Non puoi avere più di 25 iscrizioni complete per inviare la conferma definitiva.");
      setShowSubmitConfirm(false);
      return;
    }
    if (players.some((p) => !p.confermato)) {
      toast.error("Tutti i giocatori devono avere l'iscrizione completa per inviare la conferma definitiva.");
      setShowSubmitConfirm(false);
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitPlayerList();
      if (!res.ok) {
        toast.error("Errore invio lista: " + (res.error || "Errore sconosciuto"));
      }
      else {
        toast.success("Lista inviata con successo");
        setSubmitted(true);
      }
    } catch (e) {
      toast.error("Errore invio lista");
      console.log(e);
    } finally {
      setSubmitting(false);
      setShowSubmitConfirm(false);
    }
  };

  const handleRegisterPlayerForManager = async (e) => {
    e.preventDefault();
    try {
      const res = await registerPlayerForManager();
      if (!res.ok) {
        toast.error("Errore registrazione giocatore: " + (res.error || "Errore sconosciuto"));
      }
      else {
        toast.success("Giocatore registrato con successo");
        router.refresh();
      }
    } catch (e) {
      toast.error("Errore registrazione giocatore.: " + e.message);
    }
  };

  if (loading) return <p>Caricamento...</p>;

  const completedCount = players.filter((p) => p.confermato).length;

  return (
    <div className={styles.page}>
      <div className={styles.header + " card"}>
        <div>
          <h2>{teamName}</h2>
          <p className={styles.muted}>Gestione rosa giocatori</p>
        </div>
        {!submitted && <div className={styles.actions}>
          <button className="button secondary" onClick={()=> setShowInvite(true)}>➕ Aggiungi giocatore</button>
          <button className="button" onClick={saveChanges} disabled={saving}>{saving ? "Salvataggio..." : "Salva modifiche"}</button>
        </div>}
      </div>

      {!!submitted &&<div className={styles.header + " card"}>
          <h3>Lista giocatori inviata alla lega</h3>
      </div>}

      {!submitted && <div className={styles.header + " card"}>
        <p className={styles.muted} >Usa la tabella sottostante per gestire i giocatori della tua squadra. Puoi modificare il numero, la taglia della maglia e la posizione di ciascun giocatore. Ricorda di salvare dopo aver effettuato delle modifiche.</p>
      </div>}

      {!submitted && <div className={styles.header + " card"}>
        <div>
          <p>Iscrizioni iniziate / confermate</p>
          <h3>{completedCount} / {players.length}</h3>
        </div>
      </div>}

      <PlayerTable players={players} setPlayers={setPlayers} onRequestRemoval={requestRemoval} hidePayment={hidePayment} locked={submitted} />

      {!submitted && false && <div className={styles.header + " card"}>
        <div>
          <h3>Maglie Staff</h3>
          <p className={styles.muted}>Richiedi le maglie personalizzate per i membri dello staff della tua squadra.</p>
        </div>
        <div className={styles.actions}>
          <Link href="/staff-jerseys" className="button secondary">Vai a richieste maglie</Link>
        </div>
      </div>}

      {!submitted && <div className={styles.header + " card"}>
        <div>
          <h3>Conferma Iscrizione squadra</h3>
          <p className={styles.muted}>Dopo aver confermata tutti i dati dei giocatori è necessario inviare la conferma definitiva alla lega.</p> 
          
        </div>
        <div className={styles.actions}>
            <button className="button" onClick={()=> setShowSubmitConfirm(true)} disabled={submitted || submitting}>{"Invia conferma definitiva"}</button>
          </div> 
      </div>}

      
      

      <Modal open={showInvite} onClose={()=> setShowInvite(false)} title="Link invito registrazione">
        <div className={styles.inviteSection}>
          <p>Copia e invia il seguente link ai giocatori per registrarsi:</p>
          <div className={styles.inviteBox}>
            <code
              className={styles.inviteLink}
              tabIndex={0}
              title="Link invito registrazione"
            >
              {registerLink}
            </code>
            <button
              className={`button secondary ${styles.inviteCopyButton}`}
              aria-label="Copia link invito registrazione"
              onClick={()=>{
                navigator.clipboard.writeText(registerLink)
                  .then(()=> toast.success("Link copiato"))
                  .catch(()=> toast.error("Impossibile copiare"));
              }}
            >
              Copia
            </button>
          </div>
        </div>
        <div className={styles.inviteSelfBlock}>
          <p>Usa il bottone qua sotto per registrare te stesso come giocatore.</p>
          <button className="button secondary" onClick={handleRegisterPlayerForManager}>Registrami come giocatore</button>
        </div>
      </Modal>

      <Modal open={!!removal} onClose={()=> setRemoval(null)} title="Richiesta rimozione giocatore"
             actions={<button className="button" onClick={confirmRemoval}>Invia richiesta</button>}>
        <p>Sei sicuro di voler richiedere la rimozione di {removal?.nome} {removal?.cognome}?</p>
        <p className={styles.muted}>La lega valuterà la richiesta e ti contatterà.</p>
      </Modal>

      <Modal open={!!showSubmitConfirm} onClose={()=> setShowSubmitConfirm(false)} title="Invia conferma definitiva"
             actions={<button className="button" onClick={handleSubmitList}>{submitting ? "Invio in corso..." : "Invia conferma"}</button>}>
        <p>Sei sicuro di voler inviare la conferma definitiva? Dopo aver inviato la conferma le iscrizioni non potranno più essere modificate.</p>
      </Modal>
    </div>
  );
}
