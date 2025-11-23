"use server"
import {verifySession} from "@app/lib/sessions";

export async function getTeamApi() {
  await delay(400);
  return {
    teamName: "ASD Milano Nord",
    registerLink: "http://localhost:3000/register/abc123",
    players: [
      { id: 1, nome: "Luca", cognome: "Rossi", email: "l.rossi@example.com", nascita: "2000-05-12", numero: 10, taglia: "M", posizione: "ATT", pagato: true },
      { id: 2, nome: "Marco", cognome: "Bianchi", email: "m.bianchi@example.com", nascita: "2008-10-03", numero: 7, taglia: "L", posizione: "CEN", pagato: false },
    ],
  };
}

export async function updatePlayersApi(updatedPlayers) {
  const session = await verifySession();
  await delay(600);
  return { ok: true, players: updatedPlayers };
}

export async function updateSinglePlayer(updatedPlayer, hasParentData) {
    const session = await verifySession();
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
                code_fiscal : updatedPlayer.genitoreCf,
            } : undefined
        }),
    });
    if (!res.ok) {
      const err = await res.json();
      console.log(err);
      const errorMessage = Object.values(err).flat().join(", ");
      throw new Error(errorMessage || "Errore sconosciuto");
    }
    return await res.json();
}

export async function requestRemovalApi(playerId) {
  await delay(600);
  return { ok: true };
}

export async function createCheckoutSessionMock(amountCents = 2500) {
  await delay(500);
  // Return a test URL or signal
  return { ok: true, url: "https://checkout.stripe.com/pay/test_mock" };
}

// Prefill an email address starting from an invitation token
export async function getEmailFromTokenApi(token) {
  await delay(250);
  if (!token) return { email: "" };
  // Simple mock strategy: known demo token → nice email, otherwise derive one
  if (token === "abc123") return { email: "invito.abc123@example.com" };
  return { email: `${String(token)}@example.com` };
}

export async function getUserData() {
    const session = await verifySession();
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
      throw new Error(errorMessage || "Errore sconosciuto");
    }
    const data =  await res.json();
    if (!["PEND", "EDIT", "SUB"].includes(data.registration_status)){
        throw new Error("Stato di registrazione non valido");
    }

    return {
        formData : {
            nome : data.first_name || "",
            cognome : data.last_name || "",
            email : data.user.email || "",
            nascita : data.date_of_birth || "",
            numero : data.shirt_number || "",
            taglia : data.shirt_size || "",
            posizione : data.position || "",
            cf : data.code_fiscal || "",
            privacy: data.privacy_accepted_at != null,
            genitoreNome : data.parent?.first_name || "",
            genitoreCognome : data.parent?.last_name || "",
            genitoreNascita : data.parent?.date_of_birth || "",
            genitoreCf : data.parent?.code_fiscal || "",
        },
        info : {
            list_name : data.player_list.name,
            registration_fee : data.player_list.registration_fee,
            can_edit: data.registration_status !== "SUB" && data.player_list.submitted_at == null,
            is_complete: data.registration_status === "SUB" || data.registration_status === "EDIT",
        }
    };
}

// Simulate account registration with token, email and password


function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}
