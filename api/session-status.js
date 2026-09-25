// Lets success.html show a real confirmation (paid / not paid, email, amount)
// without ever putting your secret key in the browser: the browser only
// asks this endpoint, and this endpoint asks Stripe using the secret key
// that lives on the server.
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

export default async function handler(req, res) {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: "Missing session_id" });

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    res.status(200).json({
      status: session.payment_status, // "paid", "unpaid", or "no_payment_required"
      email: session.customer_details?.email || session.customer_email || null,
      amount_total: session.amount_total,
      currency: session.currency,
      metadata: session.metadata,
    });
  } catch (err) {
    console.error("Could not retrieve session:", err);
    res.status(500).json({ error: "Could not retrieve session." });
  }
}
