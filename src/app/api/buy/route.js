import { NextResponse } from 'next/server';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function POST(req) {
  try {
    const { player, owner, credits } = await req.json();

    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();

    let sheet = doc.sheetsByTitle['Acquisti'];
    if (!sheet) {
      sheet = await doc.addSheet({ 
        title: 'Acquisti', 
        headerValues: ['Nome', 'Ruolo', 'Team', 'Acquirente', 'Crediti', 'Data'] 
      });
    }

    await sheet.addRow({
      Nome: player.nome,
      Ruolo: player.ruolo,
      Team: player.team,
      Acquirente: owner,
      Crediti: credits,
      Data: new Date().toLocaleString('it-IT')
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Errore API Buy:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
