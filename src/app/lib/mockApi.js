// Simple mock API to simulate backend interactions
export async function loginApi({ email, password }) {
  await delay(500);
  if (!email || !password) throw new Error("Credenziali mancanti");
  // Accept any email/password for demo
  return { token: "fake-jwt", user: { email } };
}

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
  await delay(600);
  // Pretend to save
  return { ok: true, players: updatedPlayers };
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

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}
