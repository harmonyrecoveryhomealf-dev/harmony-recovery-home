// This file runs on the server (Vercel), never in the visitor's browser.
// It reads your Stripe secret key from an environment variable — it is
// never written into this file and never sent to the browser.
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

// The amount actually charged is decided HERE, on the server, from an
// environment variable — never from anything the browser sends. This is
// what keeps a visitor from being able to change their own price.
const DEPOSIT_AMOUNT_CENTS = Number(process.env.DEPOSIT_AMOUNT_CENTS || 0);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "Stripe is not configured (missing STRIPE_SECRET_KEY)." });
  }
  if (!DEPOSIT_AMOUNT_CENTS) {
    return res.status(500).json({
      error: "Deposit amount is not configured. Set DEPOSIT_AMOUNT_CENTS in your environment variables (e.g. 15000 for $150.00)."
    });
  }

  const { firstName, lastName, email, phone, checkIn, checkOut } = req.body || {};
  if (!email || !firstName) {
    return res.status(400).json({ error: "Missing name or email." });
  }

  const origin = req.headers.origin || `https://${req.headers.host}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Harmony Recovery Home — Reservation Deposit",
              description: checkIn && checkOut ? `Requested stay: ${checkIn} to ${checkOut}` : undefined,
            },
            unit_amount: DEPOSIT_AMOUNT_CENTS,
          },
          quantity: 1,
        },
      ],
      // Stripe stores this metadata with the payment in your Dashboard —
      // this is how the reservation details stay attached to the payment
      // without needing a separate database.
      metadata: {
        firstName: firstName || "",
        lastName: lastName || "",
        phone: phone || "",
        checkIn: checkIn || "",
        checkOut: checkOut || "",
      },
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel.html`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe error creating session:", err);
    res.status(500).json({ error: "Could not start checkout. Please try again." });
  }
}
