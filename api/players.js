import { ROLES, sheets } from "./_sheets.js";

const normalize=value=>String(value||"").trim().toLocaleLowerCase("it-IT").replace(/[^a-z0-9]/g,"");
const nameKey=headers=>headers.find(header=>["nome","giocatore","player"].includes(normalize(header)))||headers[4]||headers[0];
const roleValues=value=>String(value||"").split(",").map(item=>item.trim()).filter(Boolean);

export default async function handler(_req,res){
  try{
    const client=sheets();
    const response=await client.spreadsheets.values.batchGet({
      spreadsheetId:process.env.SPREADSHEET_ID||"1SSQTxpr4-TR8n6bk0mXyMvmu0hXSUd2W7revPjjDeXo",
      ranges:ROLES.map(role=>`'${role}'!A1:ZZ`),
      majorDimension:"ROWS"
    });
    const unique=new Map();
    response.data.valueRanges.forEach((range,roleIndex)=>{
      const [headers=[],...rows]=range.values||[],keyForName=nameKey(headers);
      rows.forEach((row,rowIndex)=>{
        const player=Object.fromEntries(headers.map((header,index)=>[header,row[index]??""]));
        const name=String(player[keyForName]||"").trim(),team=String(player.Team||"").trim();
        if(!name)return;
        const key=`${normalize(name)}|${normalize(team)}`;
        const playerRoles=[...new Set(roleValues(player.Ruolo||ROLES[roleIndex]))];
        const existing=unique.get(key);
        if(existing){
          existing.roles=[...new Set([...existing.roles,...playerRoles])];
          existing.Ruolo=existing.roles.join(", ");
          return;
        }
        unique.set(key,{...player,id:key,row:rowIndex+2,roles:playerRoles,Ruolo:playerRoles.join(", "),sourceRole:ROLES[roleIndex]});
      });
    });
    const players=[...unique.values()];
    res.setHeader("Cache-Control","s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({players,totalRows:players.length});
  }catch(error){
    return res.status(500).json({error:error.message||"Impossibile leggere il Google Sheet."});
  }
}
