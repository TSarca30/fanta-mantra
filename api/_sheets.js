import { google } from "googleapis";

export const ROLES = ["Por", "Dc", "B", "Ds", "Dd", "E", "M", "C", "W", "T", "A", "Pc"];
export const TEAMS = ["IO", "Zago", "Mezza", "Baso", "Luca", "Gian", "Rav", "Righetto"];
const SHEET_ID = process.env.SPREADSHEET_ID || "1SSQTxpr4-TR8n6bk0mXyMvmu0hXSUd2W7revPjjDeXo";

function credentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Manca GOOGLE_SERVICE_ACCOUNT_JSON nelle variabili d'ambiente Vercel.");
  try { return JSON.parse(raw); } catch {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  }
}

export function sheets() {
  const auth = new google.auth.GoogleAuth({ credentials: credentials(), scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
  return google.sheets({ version: "v4", auth });
}

export async function getPurchases() {
  const client = sheets();
  try {
    const response = await client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: "Asta!A:F" });
    const rows = response.data.values || [];
    return rows.slice(1).filter(row => row[0]).map(([playerId, name, role, team, buyer, credits], index) => ({ playerId, name, role, team, buyer, credits: Number(credits || 0), row: index + 2 }));
  } catch (error) {
    if (error.code === 400 || error.code === 404) return [];
    throw error;
  }
}

export async function recordPurchase(purchase) {
  const client = sheets();
  const headers = [["playerId", "Giocatore", "Ruolo", "Squadra", "Acquirente", "Crediti"]];
  try {
    await client.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: "Asta!A1" });
  } catch (error) {
    if (error.code !== 400 && error.code !== 404) throw error;
    await client.spreadsheets.batchUpdate({ spreadsheetId: SHEET_ID, requestBody: { requests: [{ addSheet: { properties: { title: "Asta" } } }] } });
    await client.spreadsheets.values.update({ spreadsheetId: SHEET_ID, range: "Asta!A1:F1", valueInputOption: "RAW", requestBody: { values: headers } });
  }
  const existing = await getPurchases();
  const index = existing.findIndex(item => item.playerId === purchase.playerId || (item.name === purchase.name && item.team === purchase.team));
  const values = [[purchase.playerId, purchase.name, purchase.role, purchase.team, purchase.buyer, purchase.credits]];
  if (index >= 0) {
    await client.spreadsheets.values.update({ spreadsheetId: SHEET_ID, range: `Asta!A${existing[index].row}:F${existing[index].row}`, valueInputOption: "RAW", requestBody: { values } });
  } else {
    await client.spreadsheets.values.append({ spreadsheetId: SHEET_ID, range: "Asta!A:F", valueInputOption: "RAW", requestBody: { values } });
  }
}

export async function removePurchase(playerId) {
  const purchase = (await getPurchases()).find(item => item.playerId === playerId);
  if (!purchase) return false;
  await sheets().spreadsheets.values.clear({ spreadsheetId: SHEET_ID, range: `Asta!A${purchase.row}:F${purchase.row}` });
  return true;
}

