// Stripe webhook endpoint. Set this exact URL in your Stripe Dashboard:
//   https://YOUR-DOMAIN/api/webhook
// and select the "checkout.session.completed" event.
//
// Stripe signs every webhook request; this file checks that signature
// using STRIPE_WEBHOOK_SECRET so nobody can fake a "payment completed"
// call to your server.
import Stripe from "stripe";

// Required so we can read the raw request body, which Stripe's signature
// check needs (it cannot be pre-parsed as JSON).
export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

function buffer(readable) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readable.on("data", (chunk) => chunks.push(chunk));
    readable.on("end", () => resolve(Buffer.concat(chunks)));
    readable.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  const sig = req.headers["stripe-signature"];
  let event;
  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    // At this point the deposit has been paid. The Session ID and all the
    // reservation details you attached as metadata are already saved in
    // your Stripe Dashboard under Payments > this session — permanently,
    // with no extra database needed.
    //
    // If you later want this to also, say, email you automatically or
    // write to a spreadsheet/database, that logic goes here. It would
    // need one more service (e.g. an email API), since this server has
    // no mailbox of its own.
    console.log("Reservation deposit paid. Session:", session.id, "Details:", session.metadata);
  }

  res.status(200).json({ received: true });
}
