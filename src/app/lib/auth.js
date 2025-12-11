"use server"
import {createSession, verifySession, deleteSession } from './sessions';
import { redirect } from 'next/navigation';


export async function registerAccountApi({ token, email, password }) {
  if (!token) return { ok: false, error: "Token mancante" };
  if (!email) return { ok: false, error: "Email mancante" };
  if (!password || String(password).length < 6) return { ok: false, error: "Password mancante o troppo corta" };
  const request = process.env.API_URL_BASE + "/registration/player-registration/";
  const res = await fetch(request, {
        method: "POST",
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            "player_list_token": token, 
            "mail": email, 
            "password": password ,
        })
    });
  if (!res.ok) {
    const err = await res.json();
    const errorMessage = Object.values(err).flat().join(", ");
    // throw new Error(errorMessage || "Errore sconosciuto");
    return { ok: false, error: errorMessage || "Errore sconosciuto" };
  }
  console.log("Registration successful");
  return { ok: true };
}

export async function getUserPermissions() {
    const session = await verifySession();

    return { isAuth: session.isAuth, isPlayer: !!session?.playerId, isManager: !!session?.list_manager_id };
}

export async function login({ email, password }, redirectOnSuccess = true) {
    const request = process.env.API_URL_BASE + "/registration/login/";
    console.log(request);
    const res = await fetch(request, {
        method: "POST",
        headers: {
          'Authorization': 'Basic ' + btoa(email + ":" + password),
        },
    });
    if (!res.ok) {
      const err = await res.json();
      const errorMessage = Object.values(err).flat().join(", ");
      // throw new Error(errorMessage || "Errore sconosciuto");
      return { ok: false, error: errorMessage || "Errore sconosciuto" };
    }
    const data = await res.json();
    const userId = data.user.id;
    const playerId = data.user.player_user?.id;
    const list_manager_id = data.user.player_list_manager?.id;
    await createSession(userId, playerId, list_manager_id, data.token, data.expiry);
    console.log("Authentication successful");
    if (redirectOnSuccess && playerId) {
        redirect('/profile');
    } else if (redirectOnSuccess && list_manager_id) {
        redirect('/dashboard');
    }
    return { ok: true, isPlayer: !!playerId, isManager: !!list_manager_id };
}

export async function logout() {
    const session = await verifySession();
    const request = process.env.API_URL_BASE + "/registration/logout/";
    const res =  await fetch(request, {
        method: "POST",
        headers: {
            'Authorization': `Bearer ${session.token}`,
        },
    });
    if (!res.ok) {
      const err = await res.json();
      const errorMessage = Object.values(err).flat().join(", ");
      throw new Error(errorMessage || "Logout fallito");
    }
    await deleteSession();
    redirect('/login');
}

export async function resetPassword(token, mail, password) {
    if (!token) return {ok: false, error: "Token mancante"};
    if (!password ) return {ok: false, error: "Password mancante"};

    const request = process.env.API_URL_BASE + "/registration/reset-password-requests/";
    const res = await fetch(request, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            "token": token, 
            "mail": mail,
            "new_password": password ,
        })
    });
    if (!res.ok) {
      console.log(res)
      const err = await res.json();
      const errorMessage = Object.values(err).flat().join(", ");
      // throw new Error(errorMessage || "Errore sconosciuto");
      return { ok: false, error: errorMessage || "Errore sconosciuto" };
    }
    console.log("Password reset successful");
    return { ok: true };
}

export async function requestPasswordReset({ email }) {
    if (!email) throw new Error("Email mancante");
    const request = process.env.API_URL_BASE + "/registration/create-password-reset-request/";
    const res = await fetch(request, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            "mail": email, 
        })
    });
    if (!res.ok) {
      console.log(res)
      const err = await res.json();
      const errorMessage = Object.values(err).flat().join(", ");
      throw new Error(errorMessage || "Errore sconosciuto");
    }
    console.log("Password reset request successful");
}

export async function verifyEmail(token, mail) {
    if (!token) return {ok: false, error: "Token mancante"};
    if (!mail ) return {ok: false, error: "Email mancante"};
    const request = process.env.API_URL_BASE + "/registration/confirm-user-mail-verification/";
    const res = await fetch(request, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            "token": token, 
            "mail": mail,
        })
    });
    if (!res.ok) {
      console.log(res)
      const err = await res.json();
      const errorMessage = Object.values(err).flat().join(", ");
      // throw new Error(errorMessage || "Errore sconosciuto");
      return { ok: false, error: errorMessage || "Errore sconosciuto" };
    }
    console.log("Email verification successful");
    return { ok: true };
}