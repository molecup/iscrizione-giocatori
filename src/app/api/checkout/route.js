import Stripe from "stripe";
import { NextResponse } from "next/server";

const ALLOWED_AMOUNTS_CENTS = new Set([2500, 4000]);

function sanitizeText(value, { max = 200 } = {}) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  // Remove control chars/new lines that can cause issues in Stripe UI/logs
  const cleaned = trimmed.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ");
  return cleaned.slice(0, max);
}

function isPlainObject(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

export async function POST(request) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "STRIPE_SECRET_KEY non configurata" }, { status: 500 });
    }

    const stripe = new Stripe(secretKey);

    // Body: { amount: number (in cents), currency?: string, metadata?: object, product_name?: string, product_description?: string }
    let body = {};
    try {
      body = await request.json();
    } catch (_) {
      body = {};
    }

    const amountCents = Number(body?.amount);
    if (!Number.isFinite(amountCents) || !Number.isInteger(amountCents) || amountCents <= 0) {
      return NextResponse.json({ error: "Importo non valido" }, { status: 400 });
    }
    if (!ALLOWED_AMOUNTS_CENTS.has(amountCents)) {
      return NextResponse.json({ error: "Importo non consentito" }, { status: 400 });
    }

    const currency = (body?.currency || "eur").toLowerCase();
    if (currency !== "eur") {
      return NextResponse.json({ error: "Valuta non supportata" }, { status: 400 });
    }

    const metadata = isPlainObject(body?.metadata) ? body.metadata : undefined;
    const customerEmail = typeof body?.customer_email === "string" ? body.customer_email : undefined;

    const productName = sanitizeText(body?.product_name, { max: 120 }) || "Quota iscrizione";
    const productDescription = sanitizeText(body?.product_description, { max: 400 }) || "Pagamento";

    // Build success/cancel URLs trying to return to the register page with token
    const url = new URL(request.url);
    const origin = url.origin; // e.g., http://localhost:3000
    const referer = request.headers.get("referer") || "";

    let successUrl = `${origin}/profile?session_id={CHECKOUT_SESSION_ID}`;
    let cancelUrl = `${origin}/profile?canceled=1`;
    const registerMatch = referer.match(/\/register\/([^/?#]+)/);
    if (registerMatch && registerMatch[1]) {
      const token = registerMatch[1];
      successUrl = `${origin}/register/${token}?session_id={CHECKOUT_SESSION_ID}`;
      cancelUrl = `${origin}/register/${token}?canceled=1`;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: amountCents,
            product_data: {
              name: productName,
              description: productDescription,
            },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      locale: "it",
      customer_email: customerEmail,
      billing_address_collection: "required",
      metadata,
    });

    // Post payment on backend
    const requestBackend = process.env.API_URL_BASE +"/registration/payment-transactions/"
    const res = await fetch(requestBackend, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: session.id,
          ...body.backend_metadata,
        }),
      });
    if (!res.ok) {
      const err = await res.json();
      const errorMessage = Object.values(err).flat().join(", ");
      return NextResponse.json({ error: "Errore nella creazione del pagamento: " + errorMessage }, { status: 500 });
    }

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error("Stripe checkout error", err);
    const message = err?.message || "Errore sconosciuto";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
