import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function GET() {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();

    const roleSheets = ['Por', 'Dc', 'B', 'Ds', 'Dd', 'E', 'M', 'C', 'W', 'T', 'A', 'Pc'];
    let allPlayers = [];

    for (const sheetName of roleSheets) {
      const sheet = doc.sheetsByTitle[sheetName];
      if (!sheet) continue;

      const rows = await sheet.getRows();
      rows.forEach((row, index) => {
        const nome = row.get('Nome');
        if (!nome) return;

        const isObjective = (row.get('Obiett.') || '').toString().toLowerCase() === 'true';

        allPlayers.push({
          id: `${sheetName}-${index}-${nome}`,
          nome: nome,
          ruolo: row.get('Ruolo') || sheetName,
          ruoloMacro: sheetName,
          team: row.get('Team') || '',
          prezzo: parseFloat(row.get('Prezzo')) || 1,
          pma: row.get('PMA') || '0%',
          quo: parseFloat(row.get('Quo')) || 1,
          titolarita: row.get('Titolarità') || '3',
          affidabilita: row.get('Affidabilità') || '3',
          integrita: row.get('Integrità') || '3',
          commento: row.get('Commento') || '',
          note: [
            row.get('Nota 1'),
            row.get('Nota 2'),
            row.get('Nota 3'),
            row.get('Nota 4'),
            row.get('Nota 5')
          ].filter(Boolean).join(' • '),
          mv: row.get('MV') || '-',
          fmv: row.get('FMV') || '-',
          obiett: isObjective,
        });
      });
    }

    return NextResponse.json({ players: allPlayers });
  } catch (error) {
    console.error('Errore API Players:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
