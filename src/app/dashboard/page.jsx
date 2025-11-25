"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import PlayerTable from "@app/components/PlayerTable";
import Modal from "@app/components/Modal";
// import { getTeamApi, updatePlayersApi, requestRemovalApi } from "../lib/mockApi";
import {getPlayers, updatePlayers, requestRemovalApi, registerPlayerForManager} from "@app/lib/api";
import { useToast } from "@app/components/ToastProvider";
import { useRouter } from "next/navigation";
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
        setTeamName(data.teamName);
        setRegisterLink(data.registerLink);
        setPlayers(data.players);
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
      setPlayers(res.players);
      toast.success("Modifiche salvate");
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
      await requestRemovalApi(removal.id);
      toast.success("Richiesta inviata alla lega");
    } catch (e) {
      toast.error("Errore invio richiesta");
    } finally {
      setRemoval(null);
    }
  };

  const handleRegisterPlayerForManager = async (e) => {
    e.preventDefault();
    try {
      await registerPlayerForManager();
      toast.success("Giocatore registrato con successo");
      router.refresh();
    } catch (e) {
      toast.error("Errore registrazione giocatore.: " + e.message);
    }
  };

  if (loading) return <p>Caricamento...</p>;

  return (
    <div className={styles.page}>
      <div className={styles.header + " card"}>
        <div>
          <h2>{teamName}</h2>
          <p className={styles.muted}>Gestione rosa giocatori</p>
        </div>
        <div className={styles.actions}>
          <button className="button secondary" onClick={()=> setShowInvite(true)}>➕ Aggiungi giocatore</button>
          <button className="button" onClick={saveChanges} disabled={saving}>{saving ? "Salvataggio..." : "Salva modifiche"}</button>
        </div>
      </div>

      <PlayerTable players={players} setPlayers={setPlayers} onRequestRemoval={requestRemoval} />

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
    </div>
  );
}
