"use server"
import {createSession, verifySession } from './sessions';
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
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "Registrazione fallita");
  }
  // Accept everything in mock
  return { ok: true };
}

export async function login({ email, password }) {
    const request = process.env.NEXT_PUBLIC_API_URL_BASE + "/registration/login/";
    const res = await fetch(request, {
        method: "POST",
        headers: {
          'Authorization': 'Basic ' + btoa(email + ":" + password),
        },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || "Login fallito");
    }
    const data = await res.json();
    await createSession(data.userId, data.playerId, data.list_manager_id, data.token, data.expiry);
    console.log("Authentication successful");
    if (data.list_manager_id){
        redirect('/dashboard');
    }
    else {
        redirect('/profile');
    }
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
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || "Logout fallito");
    }
    await deleteSession();
    redirect('/login');
}
