import Stripe from "stripe";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "STRIPE_SECRET_KEY non configurata" }, { status: 500 });
    }

    const stripe = new Stripe(secretKey);

    // Body: { amount: number (in cents), currency?: string, metadata?: object }
    let body = {};
    try {
      body = await request.json();
    } catch (_) {
      body = {};
    }
    const amount = Number(body?.amount) || 60; // default 50.00€
    const currency = (body?.currency || "eur").toLowerCase();
    const metadata = (body && body.metadata) || undefined;
    const customerEmail = typeof body?.customer_email === "string" ? body.customer_email : undefined;

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Importo non valido" }, { status: 400 });
    }

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
            unit_amount: Math.round(amount),
            product_data: {
              name: "Quota iscrizione",
              description: "Pagamento iscrizione giocatore",
            },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      locale: "it",
      customer_email: customerEmail,
      metadata,
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error("Stripe checkout error", err);
    const message = err?.message || "Errore sconosciuto";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
