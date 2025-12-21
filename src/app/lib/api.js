"use server"
import {verifySession, addPlayerIdToSession} from "@app/lib/sessions";
import path from "path";
import { promises as fs, stat } from "fs";


// import { register } from "next/dist/next-devtools/userspace/pages/pages-dev-overlay-setup";
import {
  FILES_DIR,
  getRecord,
} from "@app/api/medical-certificate/utils";

export async function getTeamApi() {
  await delay(400);
  return {
    ok: true,
    teamName: "ASD Milano Nord",
    registerLink: "http://localhost:3000/register/abc123",
    players: [
      { id: 1, nome: "Luca", cognome: "Rossi", email: "l.rossi@example.com", nascita: "2000-05-12", numero: 10, taglia: "M", posizione: "ATT", pagato: true },
      { id: 2, nome: "Marco", cognome: "Bianchi", email: "m.bianchi@example.com", nascita: "2008-10-03", numero: 7, taglia: "L", posizione: "CEN", pagato: false },
    ],
  };
}

function api2frontendPlayerList(data) {
    return {
        teamName : data.name,
        registerLink : process.env.HOSTNAME + "/register/" + data.registration_token,
        registration_fee : data.registration_fee,
        confermata : data.submitted_at != null,
        players : data.players.map(p => ({
            id: p.id,
            nome: p.first_name || "",
            cognome: p.last_name || "",
            email: p.email || "",
            nascita: p.date_of_birth || "",
            numero: p.shirt_number || "",
            taglia: p.shirt_size || "",
            posizione: p.position || "",
            pagato:  false, // Placeholder, da implementare TODO
            confermato: p.registration_status === "SUB",
        }))
    };
}

function api2frontendMedicalCertificate(data) {
    if (!data){
        return { status: "missing", locked: false};
    }
    return {
        status: "uploaded",
        locked: true,
        certificateId: data.id,
        uploadedAt: data.uploaded_at,
        downloadUrl: data.file,
    };
}

export async function getPlayers(){
    const session = await verifySession();
    if (!session.list_manager_id) {
        return { teamName: "", registerLink: "", players: [] };
    }
    const request = process.env.API_URL_BASE + "/registration/player-lists/" + session.list_manager_id + "/";
    const res = await fetch(request, {
        method: "GET",
        headers: {
            'Authorization': 'Bearer ' + session.token,
        },
    });
    if (!res.ok) {
      const err = await res.json();
      const errorMessage = Object.values(err).flat().join(", ");
      return { ok: false, error: errorMessage || "Errore sconosciuto" };
    }
    const data =  await res.json();
    return {ok: true, ...api2frontendPlayerList(data)};
    
}

export async function updatePlayers(updatedPlayers) {
  const session = await verifySession();
  if (!session.list_manager_id) {
        // throw new Error("Permessi insufficienti");
        return { ok: false, error: "Permessi insufficienti" };
    }
  const request = process.env.API_URL_BASE + "/registration/player-lists/" + session.list_manager_id + "/";
  const res = await fetch(request, {
        method: "PUT",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + session.token,
        },
        body: JSON.stringify({
            players : updatedPlayers.map(p => ({
                id: p.id,
                shirt_number : p.numero === "" ? undefined : p.numero,
                shirt_size : p.taglia === "" ? undefined : p.taglia,
                position : p.posizione === "" ? undefined : p.posizione,
            })),
        }),
    });
    if (!res.ok) {
        const err = await res.json();
        const errorMessage = Object.values(err).flat().join(", ");
        // throw new Error(errorMessage || "Errore sconosciuto");
        return { ok: false, error: errorMessage || "Errore sconosciuto" };
    }

    const data = await res.json();

    return { ok: true, players: api2frontendPlayerList(data).players };
}

export async function updateSinglePlayer(updatedPlayer, hasParentData) {
    const session = await verifySession();
    if (!session.playerId) {
        return { ok: false, error: "Permessi insufficienti" };
    }
    const request = process.env.API_URL_BASE + "/registration/players/" + session.playerId + "/";
    const res = await fetch(request, {
        method: "PUT",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + session.token,
        },
        body: JSON.stringify({
            first_name : updatedPlayer.nome,
            last_name : updatedPlayer.cognome,
            date_of_birth : updatedPlayer.nascita,
            place_of_birth : updatedPlayer.luogoNascita,
            shirt_number : updatedPlayer.numero,
            shirt_size : updatedPlayer.taglia,
            position : updatedPlayer.posizione,
            code_fiscal : updatedPlayer.cf,
            privacy_accepted_at : updatedPlayer.privacy ? new Date().toISOString() : null,
            registration_status : "EDIT",
            parent : hasParentData ? {
                first_name : updatedPlayer.genitoreNome,
                last_name : updatedPlayer.genitoreCognome,
                date_of_birth : updatedPlayer.genitoreNascita,
                place_of_birth : updatedPlayer.genitoreLuogoNascita,
                code_fiscal : updatedPlayer.genitoreCf,
            } : undefined
        }),
    });
    if (!res.ok) {
      const err = await res.json();
      console.log(err);
      const errorMessage = Object.values(err).flat().join(", ");
      return { ok: false, error: errorMessage || "Errore sconosciuto" };
    }
    const data = await res.json();
    return {ok: true, ...data};
}

export async function submitRegistration(){
    const session = await verifySession();
    if (!session.playerId) {
        return { ok: false, error: "Permessi insufficienti" };
    }
    const request = process.env.API_URL_BASE + "/registration/players/" + session.playerId + "/";
    const res = await fetch(request, {
        method: "PATCH",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + session.token,
        },
        body: JSON.stringify({
            registration_status : "SUB",
        }),
    });
    if (!res.ok) {
      const err = await res.json();
      const errorMessage = Object.values(err).flat().join(", ");
      return { ok: false, error: errorMessage || "Errore sconosciuto" };
    }
    return {ok: true, ...await res.json()};
}

export async function requestRemovalApi(playerId) {
    const session = await verifySession();
    if (!session.list_manager_id) {
        return { ok: false, error: "Permessi insufficienti" };
    }
    const request = process.env.API_URL_BASE + "/registration/deletion-requests/";
    const res = await fetch(request, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + session.token,
        },
        body: JSON.stringify({ player_to_be_deleted: playerId }),
    });

    if (!res.ok) {
        console.log(res);
        console.log(await res.text());
        const err = await res.json();
        console.log(err)
        const errorMessage = Object.values(err).flat().join(", ");
        // throw new Error(errorMessage || "Errore sconosciuto");
        return { ok: false, error: errorMessage || "Errore sconosciuto" };
    }
    return { ok: true };
}

export async function getRemovalRequests() {
    const session = await verifySession();
    if (!session.list_manager_id) {
        return [];
    }
    const request = process.env.API_URL_BASE + "/registration/deletion-requests/";
    const res = await fetch(request, {
        method: "GET",
        headers: { 
            'Authorization': 'Bearer ' + session.token,
        },
    });
    if (!res.ok) {
      const err = await res.json();
      const errorMessage = Object.values(err).flat().join(", ");
      return { ok: false, error: errorMessage || "Errore sconosciuto" };
    }
    const data =  await res.json();
    return data.requests.map(r => ({
        ok: true,
        requestId: r.id,
        requestedAt: r.requested_at,
        status: r.status, // PENDING, APPROVED, REJECTED
        player: {
            id: r.player_to_be_deleted.id,
            nome: r.player_info.first_name || "",
            cognome: r.player_info.last_name || "",
            email: r.player_info.email || "",
            nascita: r.player_info.date_of_birth || "",
            numero: r.player_info.shirt_number || "",
            taglia: r.player_info.shirt_size || "",
            posizione: r.player_info.position || "",
        }
    }));
}

export async function createCheckoutSessionMock(amountCents = 2500) {
  await delay(500);
  // Return a test URL or signal
  return { ok: true, url: "https://checkout.stripe.com/pay/test_mock" };
}

export async function getUserData() {
    const session = await verifySession();
    if (!session.playerId) {
        return { formData : {}, info : {} };
    }
    const request = process.env.API_URL_BASE + "/registration/players/" + session.playerId + "/";

    const res = await fetch(request, {
        method: "GET",
        headers: {
            'Authorization': 'Bearer ' + session.token,
        },
    });
    if (!res.ok) {
      const err = await res.json();
      const errorMessage = Object.values(err).flat().join(", ");
      return { ok: false, error: errorMessage || "Errore sconosciuto" };
    }
    const data =  await res.json();
    if (!["PEND", "EDIT", "SUB"].includes(data.registration_status)){
        return { ok: false, error: "Stato di registrazione non valido" };
    }

    return {
        ok: true,
        formData : {
            nome : data.first_name || "",
            cognome : data.last_name || "",
            email : data.user.email || "",
            nascita : data.date_of_birth || "",
            luogoNascita : data.place_of_birth || "",
            numero : data.shirt_number || "",
            taglia : data.shirt_size || "",
            posizione : data.position || "",
            cf : data.code_fiscal || "",
            privacy: data.privacy_accepted_at != null,
            genitoreNome : data.parent?.first_name || "",
            genitoreCognome : data.parent?.last_name || "",
            genitoreNascita : data.parent?.date_of_birth || "",
            genitoreLuogoNascita : data.parent?.place_of_birth || "",
            genitoreCf : data.parent?.code_fiscal || "",
        },
        info : {
            list_name : data.player_list.name,
            registration_fee : data.player_list.registration_fee,
            can_edit: data.registration_status !== "SUB" && data.player_list.submitted_at == null,
            is_complete: data.registration_status === "SUB" || data.registration_status === "EDIT",
            email_verified: data.email_verified,
            medical_certificate: api2frontendMedicalCertificate(data.medical_certificate),
        }
    };
}

export async function registerPlayerForManager(){
    const session = await verifySession();
    if (!session.list_manager_id) {
        return { ok: false, error: "Permessi insufficienti" };
    }
    const request = process.env.API_URL_BASE + "/registration/player-registration-for-manager/";
    const res = await fetch(request, {
        method: "POST",
        headers: {
            'Authorization': 'Bearer ' + session.token,
        },
    });
    if (!res.ok) {
      const err = await res.json();
      const errorMessage = Object.values(err).flat().join(", ");
      return { ok: false, error: errorMessage || "Errore sconosciuto" };
    }
    console.log("Player registration for manager successfull");
    const data = await res.json();
    await addPlayerIdToSession(data.player.id);
    return { ok: true, playerId: data.player.id  };
}

export async function sendVerificationEmail(email) {
    const request = process.env.API_URL_BASE + "/registration/create-user-mail-verification/";
    const res = await fetch(request, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email }),
    });
    if (!res.ok) {
      const err = await res.json();
      const errorMessage = Object.values(err).flat().join(", ");
      throw new Error(errorMessage || "Errore sconosciuto");
    }
    return await res.json();
}

export async function submitPlayerList(){
    const session = await verifySession();
    if (!session.list_manager_id) {
        return { ok: false, error: "Permessi insufficienti" };
    }
    const request = process.env.API_URL_BASE + "/registration/submit-player-list/" + session.list_manager_id + "/";
    const res = await fetch(request, {
        method: "POST",
        headers: {
            'Authorization': 'Bearer ' + session.token,
        },
    });
    if (!res.ok) {
      const err = await res.json();
      const errorMessage = Object.values(err).flat().join(", ");
      return { ok: false, error: errorMessage || "Errore sconosciuto" };
    }
    return { ok: true };
}

// Simulate account registration with token, email and password


function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// export async function getMedicalCertificate() {
//     const session = await verifySession();
//     if (!session.playerId) {
//         throw new Error("Permessi insufficienti");
//     }
//     const request = process.env.API_URL_BASE + "/registration/players/" + session.playerId + "/medical-certificate/";
//     const res = await fetch(request, {
//         method: "GET",
//         headers: {
//             'Authorization': 'Bearer ' + session.token,
//         },
//     });
//     if (!res.ok) {
//       const err = await res.json();
//       const errorMessage = Object.values(err).flat().join(", ");
//       throw new Error(errorMessage || "Errore sconosciuto");
//     }
//     return await res.json();
// }

// export async function uploadMedicalCertificate(formData) {
//     const session = await verifySession();
//     if (!session.playerId) {
//         throw new Error("Permessi insufficienti");
//     }
//     const request = process.env.API_URL_BASE + "/registration/players/" + session.playerId + "/medical-certificate/";
//     const res = await fetch(request, {
//         method: "POST",
//         headers: {
//             'Authorization': 'Bearer ' + session.token,
//         },
//         body: formData,
//     });
//     if (!res.ok) {
//       const err = await res.json();
//       const errorMessage = Object.values(err).flat().join(", ");
//       throw new Error(errorMessage || "Errore sconosciuto");
//     }
//     return await res.json();
// }

// export async function deleteMedicalCertificate() {
//     const session = await verifySession();
//     if (!session.playerId) {
//         throw new Error("Permessi insufficienti");
//     }
//     const request = process.env.API_URL_BASE + "/registration/players/" + session.playerId + "/medical-certificate/";
//     const res = await fetch(request, {
//         method: "DELETE",
//         headers: {
//             'Authorization': 'Bearer ' + session.token,
//         },
//     });
//     if (!res.ok) {
//       const err = await res.json();
//       const errorMessage = Object.values(err).flat().join(", ");
//       throw new Error(errorMessage || "Errore sconosciuto");
//     }
//     return await res.json();
// }

export async function confirmMedicalCertificate() {
    const session = await verifySession();
    if (!session.playerId) {
        throw new Error("Permessi insufficienti");
    }

    const { record, meta } = await getRecord(session.playerId);
      if (!record) {
        throw new Error("Nessun certificato da confermare");
      }
      if (!record.storedFile) {
        throw new Error("File certificato non trovato");
      }
      const filePath = path.join(FILES_DIR, record.storedFile);
      try {
        var file = await fs.readFile(filePath);
      } catch (error) {
        throw new Error("File certificato non trovato");
      }   

    const formData = new FormData();
    formData.append("file", new Blob([file], { type: 'application/pdf' }), record.storedFile);
    formData.append("player", session.playerId)
    formData.append("expires_at", "2026-06-20")

    const request = process.env.API_URL_BASE + "/registration/medical-certificates/";
    const res = await fetch(request, {
        method: "POST",
        headers: {
            'Authorization': 'Bearer ' + session.token,
        },
        body: formData,


    });
    console.log(res);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const errorMessage = Object.values(err).flat().join(", ");
        throw new Error(errorMessage || "Errore sconosciuto");
    }
    const resData  = await res.json();
    return api2frontendMedicalCertificate(resData);
}


