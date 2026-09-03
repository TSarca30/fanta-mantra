import { ROLES, sheets } from "./_sheets.js";

const normalize=value=>String(value||"").trim().toLocaleLowerCase("it-IT").replace(/[.\s_-]/g,"");

function findNameKey(headers) {
  return headers.find(header=>["nome","giocatore","player"].includes(normalize(header))) || headers[4] || headers[0];
}

export default async function handler(_req, res) {
  try {
    const client=sheets();
    const ranges=ROLES.map(role=>`'${role}'!A1:ZZ`);
    const response=await client.spreadsheets.values.batchGet({
      spreadsheetId:process.env.SPREADSHEET_ID||"1SSQTxpr4-TR8n6bk0mXyMvmu0hXSUd2W7revPjjDeXo",
      ranges,
      majorDimension:"ROWS"
    });
    const players=response.data.valueRanges.flatMap((range,roleIndex)=>{
      const [headers=[],...rows]=range.values||[];
      const nameKey=findNameKey(headers);
      return rows
        .map((row,rowIndex)=>({player:Object.fromEntries(headers.map((header,index)=>[header,row[index]??""])),row:rowIndex+2}))
        .filter(({player})=>String(player[nameKey]||"").trim())
        .map(({player,row})=>({...player,id:`${ROLES[roleIndex]}:${row}`,row}));
    });
    res.setHeader("Cache-Control","s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({players});
  }catch(error){
    return res.status(500).json({error:error.message||"Impossibile leggere il Google Sheet."});
  }
}
