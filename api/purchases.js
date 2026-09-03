import { getPurchases, recordPurchase, TEAMS } from "./_sheets.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") return res.status(200).json({ purchases: await getPurchases() });
    if (req.method !== "POST") return res.status(405).json({ error: "Metodo non supportato" });
    const { playerId, name, role, team, buyer, credits } = req.body || {};
    if (!playerId || !name || !role || !team || !TEAMS.includes(buyer) || !Number.isFinite(Number(credits)) || Number(credits) < 0) {
      return res.status(400).json({ error: "Dati dell'assegnazione non validi." });
    }
    await recordPurchase({ playerId, name, role, team, buyer, credits: Number(credits) });
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Impossibile registrare l'acquisto." });
  }
}

