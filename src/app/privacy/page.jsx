export const metadata = { title: "Privacy" };

import styles from "./page.module.css";

export default function PrivacyPage() {
  const lastUpdated = "21/12/2025";

  return (
    <article className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Informativa sulla Privacy</h1>
        <p className={styles.lead}>
          Questa informativa descrive come trattiamo i dati personali raccolti tramite il sito di iscrizione, inclusi i
          dati inseriti nei moduli e i documenti caricati. I dati vengono registrati e gestiti in un database al solo
          fine di erogare il servizio e adempiere agli obblighi di legge.
        </p>
        <p className={styles.updated}>Ultimo aggiornamento: {lastUpdated}</p>
      </header>

      <section className={styles.grid}>
        <section className={`card ${styles.card}`}>
          <h2 className={styles.h2}>1) Titolare del trattamento</h2>
          <p className={styles.p}>
            Il Titolare del trattamento è la società/associazione/ente che organizza la Lega (di seguito “Lega”). Per
            richieste relative alla privacy puoi contattarci tramite i recapiti indicati nella sezione “Contatti” al punto 9.
          </p>

          <div className={styles.kv}>
            <div className={styles.kvItem}>
              <div className={styles.kvLabel}>Ruolo</div>
              <div className={styles.kvValue}>Titolare del trattamento</div>
            </div>
            <div className={styles.kvItem}>
              <div className={styles.kvLabel}>Ambito</div>
              <div className={styles.kvValue}>Gestione iscrizioni, squadre e pagamenti</div>
            </div>
          </div>
        </section>

        <section className={`card ${styles.card}`}>
          <h2 className={styles.h2}>2) Quali dati trattiamo</h2>
          <p className={styles.p}>A seconda delle funzionalità utilizzate, possiamo trattare:</p>
          <ul className={styles.list}>
            <li>
              <strong>Dati identificativi e di contatto</strong>: nome, cognome, email, eventuale telefono.
            </li>
            <li>
              <strong>Dati relativi all’iscrizione sportiva</strong>: squadra, ruolo, categoria, informazioni necessarie
              all’organizzazione.
            </li>
            <li>
              <strong>Documenti caricati</strong> (es. certificato medico), se previsto dal regolamento.
            </li>
            <li>
              <strong>Dati di accesso</strong>: credenziali e log tecnici (es. data/ora accesso, eventi di sicurezza).
            </li>
            <li>
              <strong>Dati di pagamento</strong>: l’applicazione può generare una richiesta di pagamento; i dati della carta o
              i dettagli sensibili non vengono salvati nei nostri sistemi se gestiti da provider di pagamento.
            </li>
          </ul>
        </section>

        <section className={`card ${styles.card}`}>
          <h2 className={styles.h2}>3) Finalità e base giuridica</h2>
          <p className={styles.p}>Trattiamo i dati per le seguenti finalità:</p>
          <ul className={styles.list}>
            <li>
              <strong>Gestione dell’iscrizione e del rapporto</strong> (creazione account, registrazione giocatori, gestione
              squadre): base giuridica è l’esecuzione di un contratto o misure precontrattuali (art. 6(1)(b) GDPR).
            </li>
            <li>
              <strong>Obblighi legali e regolamentari</strong> (es. requisiti sportivi/assicurativi): base giuridica è
              l’adempimento di un obbligo legale (art. 6(1)(c) GDPR).
            </li>
            <li>
              <strong>Sicurezza e prevenzione abusi</strong> (audit, log, tutela del servizio): base giuridica è il legittimo
              interesse del Titolare (art. 6(1)(f) GDPR) nel rispetto dei diritti e libertà dell’interessato.
            </li>
          </ul>
          <p className={styles.p}>
            Se dovessimo trattare categorie particolari di dati (es. dati sanitari contenuti nel certificato medico), il
            trattamento avverrà solo se necessario, con misure di sicurezza adeguate e secondo la normativa applicabile.
          </p>
        </section>

        <section className={`card ${styles.card}`}>
          <h2 className={styles.h2}>4) Modalità del trattamento e sicurezza</h2>
          <p className={styles.p}>
            I dati vengono trattati con strumenti informatici e archiviati in un database. Adottiamo misure tecniche e
            organizzative ragionevoli per proteggere i dati, tra cui controllo degli accessi, logging, backup e
            protezione dei canali di trasmissione quando disponibile.
          </p>
          <p className={styles.p}>
            Nonostante le misure adottate, nessun sistema è totalmente immune da rischi. In caso di incidenti rilevanti,
            seguiremo le procedure previste dalla normativa.
          </p>
        </section>

        <section className={`card ${styles.card}`}>
          <h2 className={styles.h2}>5) Conservazione dei dati</h2>
          <p className={styles.p}>
            Conserviamo i dati per il tempo strettamente necessario a gestire l’iscrizione e la stagione sportiva, e
            comunque per il periodo imposto da obblighi di legge o necessari a tutelare eventuali diritti in sede
            giudiziaria.
          </p>
          <p className={styles.p}>
            I documenti caricati (es. certificati) vengono mantenuti per il tempo necessario ai controlli richiesti e poi
            eliminati o anonimizzati secondo le policy interne.
          </p>
        </section>

        <section className={`card ${styles.card}`}>
          <h2 className={styles.h2}>6) Destinatari e responsabili del trattamento</h2>
          <p className={styles.p}>
            I dati possono essere comunicati a soggetti che forniscono servizi tecnici (hosting, manutenzione, invio email,
            pagamento) nominati, ove necessario, Responsabili del trattamento. I dati possono inoltre essere comunicati
            ad autorità competenti quando previsto dalla legge.
          </p>
          <p className={styles.p}>Non vendiamo i dati personali e non li usiamo per finalità di profilazione commerciale.</p>
        </section>

        <section className={`card ${styles.card}`}>
          <h2 className={styles.h2}>8) Diritti dell’interessato</h2>
          <p className={styles.p}>In qualunque momento puoi esercitare i diritti previsti dagli artt. 15-22 GDPR, tra cui:</p>
          <ul className={styles.list}>
            <li>accesso ai dati;</li>
            <li>rettifica e aggiornamento;</li>
            <li>cancellazione (nei limiti applicabili);</li>
            <li>limitazione del trattamento;</li>
            <li>opposizione al trattamento per motivi legittimi;</li>
            <li>portabilità dei dati (quando applicabile).</li>
          </ul>
          <p className={styles.p}>
            Hai inoltre il diritto di proporre reclamo all’Autorità Garante per la protezione dei dati personali.
          </p>
        </section>

        <section className={`card ${styles.card}`}>
          <h2 className={styles.h2}>9) Contatti</h2>
          <p className={styles.p}>
            Per esercitare i tuoi diritti o per richieste sulla privacy, contattaci indicando il contesto (account/email di
            registrazione) e una descrizione dettagliata della richiesta.
          </p>
          <div className={styles.kv}>
            <div className={styles.kvItem}>
              <div className={styles.kvLabel}>Email</div>
              <div className={styles.kvValue}>amministrazione@estudentsleague.com</div>
            </div>
            <div className={styles.kvItem}>
              <div className={styles.kvLabel}>Tempi di risposta</div>
              <div className={styles.kvValue}>Di norma entro 30 giorni (salvo casi complessi)</div>
            </div>
          </div>
        </section>

        <section className={`card ${styles.card}`}>
          <h2 className={styles.h2}>10) Modifiche a questa informativa</h2>
          <p className={styles.p}>
            Potremmo aggiornare questa informativa per adeguarla a modifiche normative o tecniche. La versione aggiornata
            sarà sempre disponibile su questa pagina, con indicazione della data di aggiornamento.
          </p>
        </section>
      </section>
    </article>
  );
}
