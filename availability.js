import { getAvailability } from '../lib/availability.js';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') { res.setHeader('Allow','GET'); return res.status(405).json({error:'Method not allowed'}); }
  try { return res.status(200).json({ranges:await getAvailability()}); }
  catch { return res.status(503).json({error:'Availability could not be verified. Please contact Harmony before booking.'}); }
}
