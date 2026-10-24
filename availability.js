import { createSign } from 'node:crypto';

export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function parseRanges(rows) {
  return rows.filter(row => row.some(v => v !== '')).map((row, i) => {
    const [start, end] = row;
    if (!validDate(start) || !validDate(end) || start > end) throw new Error(`Invalid dates in row ${i + 2}`);
    return [start, end];
  });
}
export const overlaps = (ranges, start, end) => ranges.some(([a,b]) => start <= b && end >= a);

export async function getAvailability() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!raw || !sheetId) throw new Error('Availability is not configured');
  const account = JSON.parse(raw);
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const unsigned = encode({alg:'RS256',typ:'JWT'}) + '.' + encode({
    iss:account.client_email,scope:'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600
  });
  const signer = createSign('RSA-SHA256'); signer.update(unsigned); signer.end();
  const assertion = unsigned + '.' + signer.sign(account.private_key, 'base64url');
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion}),
    signal:AbortSignal.timeout(10000)
  });
  if (!tokenResponse.ok) throw new Error('Google authentication failed');
  const {access_token} = await tokenResponse.json();
  const range = process.env.GOOGLE_SHEET_RANGE || 'Sheet1!A2:B1000';
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}?valueRenderOption=FORMATTED_VALUE`, {
    headers:{Authorization:`Bearer ${access_token}`},signal:AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error('Could not read availability');
  const data = await response.json();
  return parseRanges((data.values || []).map(row => row.map(normalizeDate)));
}
function normalizeDate(value) {
  if (validDate(value)) return value;
  // Existing sheet uses the US format M/D/YYYY.
  const match = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[1].padStart(2,'0')}-${match[2].padStart(2,'0')}` : value;
}
