import Stripe from "stripe";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "STRIPE_SECRET_KEY non configurata" }, { status: 500 });
    }

    const stripe = new Stripe(secretKey);

    let body = {};
    try {
      body = await request.json();
    } catch (_) {
      // ignore, body stays empty
    }

    const sessionId = body?.session_id;
    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "session_id mancante" }, { status: 400 });
    }


    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["payment_intent"] });


    if (!session || session.payment_status !== "paid") {
      return NextResponse.json({ status: session?.payment_status || "unknown" }, { status: 409 });
    }


    return NextResponse.json({
      id: session.id,
      customer_email: session.customer_details?.email || session.customer_email,
      metadata: session.metadata || {},
      amount_total: session.amount_total,
      currency: session.currency,
    });
  } catch (err) {
    console.error("Stripe checkout confirm error", err);
    const message = err?.message || "Errore sconosciuto";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

