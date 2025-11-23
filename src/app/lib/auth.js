"use server"
import {createSession, verifySession, deleteSession } from './sessions';
import { redirect } from 'next/navigation';


export async function registerAccountApi({ token, email, password }) {
  if (!token) throw new Error("Token mancante");
  if (!email) throw new Error("Email mancante");
  if (!password || String(password).length < 6) throw new Error("Password troppo corta");
  const request = process.env.NEXT_PUBLIC_API_URL_BASE + "/registration/player-registration/";
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
    throw new Error(errorMessage || "Errore sconosciuto");
  }
  console.log("Registration successful");
}

export async function login({ email, password }, redirectOnSuccess = true) {
    const request = process.env.NEXT_PUBLIC_API_URL_BASE + "/registration/login/";
    const res = await fetch(request, {
        method: "POST",
        headers: {
          'Authorization': 'Basic ' + btoa(email + ":" + password),
        },
    });
    if (!res.ok) {
      const err = await res.json();
      const errorMessage = Object.values(err).flat().join(", ");
      throw new Error(errorMessage || "Errore sconosciuto");
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
    const request = process.env.NEXT_PUBLIC_API_URL_BASE + "/registration/logout/";
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
