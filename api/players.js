import { ROLES, sheets } from "./_sheets.js";

export default async function handler(_req, res) {
  try {
    const client = sheets();
    const ranges = ROLES.map(role => `'${role}'!A1:AZ`);
    const response = await client.spreadsheets.values.batchGet({ spreadsheetId: process.env.SPREADSHEET_ID || "1SSQTxpr4-TR8n6bk0mXyMvmu0hXSUd2W7revPjjDeXo", ranges });
    const players = response.data.valueRanges.flatMap((range, roleIndex) => {
      const [headers = [], ...rows] = range.values || [];
      return rows.filter(row => row[4]).map((row, rowIndex) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]))).map((player, rowIndex) => ({ ...player, id: `${ROLES[roleIndex]}:${rowIndex + 2}`, row: rowIndex + 2 }));
    });
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({ players });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Impossibile leggere il Google Sheet." });
  }
}

