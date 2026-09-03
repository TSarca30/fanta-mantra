const roles=["Por","Dc","B","Ds","Dd","E","M","C","W","T","A","Pc"],teams=["IO","Zago","Mezza","Baso","Luca","Gian","Rav","Righetto"];
const sortOptions=[
  ["Prezzo","desc"],["Prezzo","asc"],["PMA","desc"],["PMA","asc"],["Quo","desc"],["Quo","asc"],
  ["MV","desc"],["FMV","desc"],["Presenze","desc"],["Presenze","asc"],["Gol","desc"],
  ["Ass","desc"],["Amm","asc"],["Esp","asc"]
];
const metricFields=[["Prezzo","Prezzo"],["PMA","PMA"],["Quo","Quo"],["MV","MV"],["FMV","FMV"],["Presenze","Presenze"],["Gol","Gol"],["Ass","Assist"],["Amm","Amm"],["Esp","Esp"]];
let players=[],purchases=[],selected,role="";
let favorites=new Set(JSON.parse(localStorage.getItem("mantra-favorites")||"[]"));
const $=s=>document.querySelector(s);
const num=v=>Number(String(v||0).replace("%","").replace(",", "."))||0;
const purchase=p=>purchases.find(x=>x.playerId===p.id||(x.name===p.Nome&&x.team===p.Team));
const saveFavorites=()=>localStorage.setItem("mantra-favorites",JSON.stringify([...favorites]));

function teamsView(){
  $("#teams").innerHTML=teams.map(team=>{
    const roster=purchases.filter(item=>item.buyer===team),spent=roster.reduce((sum,item)=>sum+item.credits,0);
    return `<article class="team"><div class="team-top"><span>${team}</span><span class="budget">● ${500-spent}</span></div><small>${roster.length} giocatori · ${spent} spesi</small><span class="team-players">${roster.map(item=>item.name).join(" · ")||"Rosa da costruire"}</span></article>`;
  }).join("");
}

function toggleFavorite(player){
  favorites.has(player.id)?favorites.delete(player.id):favorites.add(player.id);
  saveFavorites(); list(); unavailable(); search();
}

function card(player,off=false){
  const fragment=$("#player-template").content.cloneNode(true);
  const flag=fragment.querySelector(".flag"),assignButton=fragment.querySelector(".assign");
  const isFavorite=favorites.has(player.id);
  flag.classList.toggle("active",isFavorite);
  flag.setAttribute("aria-pressed",String(isFavorite));
  flag.setAttribute("aria-label",isFavorite?"Rimuovi dai segnalati":"Segnala giocatore");
  flag.textContent=isFavorite?"★":"☆";
  flag.onclick=()=>toggleFavorite(player);
  fragment.querySelector(".role").textContent=player.Ruolo;
  fragment.querySelector(".name").textContent=player.Nome;
  fragment.querySelector(".club").textContent=player.Team;
  fragment.querySelector(".badges").innerHTML=[player["Obiett."]&&'<span class="badge goal">★ Obiettivo</span>',player.Fascia&&`<span class="badge">${player.Fascia}</span>`].filter(Boolean).join("");
  fragment.querySelector(".metrics").innerHTML=metricFields.map(([key,label])=>`<span class="metric"><small>${label}</small><b>${player[key]||"–"}</b></span>`).join("");
  assignButton.textContent=off?"Rimetti disponibile":"Assegna";
  assignButton.classList.toggle("undo",off);
  assignButton.onclick=()=>off?undo(purchase(player)):assign(player);
  return fragment;
}

function list(){
  const query=$("#search").value.toLowerCase(),[key,direction]=$("#sort").value.split("|");
  let visible=players.filter(player=>!purchase(player)&&(!role||player.roles?.includes(role)||player.Ruolo.includes(role))&&(!$("#favorites-only").checked||favorites.has(player.id))&&(`${player.Nome} ${player.Team}`.toLowerCase().includes(query)));
  visible.sort((a,b)=>direction==="asc"?num(a[key])-num(b[key]):num(b[key])-num(a[key]));
  const fragment=document.createDocumentFragment(); visible.forEach(player=>fragment.append(card(player)));
  $("#players").replaceChildren(fragment);
  $("#available-count").textContent=`${visible.length} disponibili`;
}

function unavailable(){
  const sold=players.filter(player=>purchase(player)),fragment=document.createDocumentFragment();
  sold.forEach(player=>fragment.append(card(player,true)));
  $("#unavailable").replaceChildren(fragment);
  $("#unavailable-count").textContent=`${sold.length} acquistati`;
}

function search(){
  const query=$("#search").value.toLowerCase(),box=$("#search-result");
  if(!query){box.replaceChildren();return;}
  const player=players.find(item=>`${item.Nome} ${item.Team}`.toLowerCase().includes(query));
  if(!player){box.innerHTML='<p class="muted search-empty">Nessun giocatore trovato.</p>';return;}
  const detailFields=[["Fascia","Fascia"],["Ruolo","Ruolo"],["Team","Squadra"],["Prezzo","Prezzo"],["PMA","PMA"],["Quo","Quotazione"],["MV","MV"],["FMV","FMV"],["Presenze","Presenze"],["Pt. Tit.","Pt. titolare"],["Gol","Gol"],["Ass","Assist"],["Amm","Ammonizioni"],["Esp","Espulsioni"]];
  const note=player.Commento||player["Nota 1"]||"Nessuna nota";
  box.innerHTML=`<div class="search-detail"><div class="search-detail-top"><div><p class="eyebrow">SCHEDA GIOCATORE</p><h2>${player.Nome}</h2><p class="muted">${player.Ruolo} · ${player.Team}</p></div><div class="detail-actions"><button id="detail-flag" class="flag ${favorites.has(player.id)?"active":""}" type="button" aria-label="Segnala giocatore">${favorites.has(player.id)?"★":"☆"}</button><button id="detail">Assegna giocatore</button></div></div><div class="detail-grid">${detailFields.filter(([key])=>player[key]!==""&&player[key]!==undefined).map(([key,label])=>`<span class="detail"><small>${label}</small><b>${player[key]}</b></span>`).join("")}</div><p class="player-note"><strong>Note:</strong> ${note}</p></div>`;
  $("#detail").disabled=!!purchase(player);
  $("#detail").onclick=()=>assign(player);
  $("#detail-flag").onclick=()=>toggleFavorite(player);
}

function assign(player){
  selected=player;
  $("#modal-name").textContent=player.Nome;
  $("#modal-info").textContent=`${player.Ruolo} · ${player.Team}`;
  $("#modal-note").textContent=player.Commento||player["Nota 1"]||"Nessuna nota disponibile";
  $("#credits").value=player.Prezzo||"";
  $("#assign-dialog").showModal();
  $("#buyer").focus();
}

async function refresh(){
  const response=await fetch("/api/purchases");
  purchases=(await response.json()).purchases||[];
  teamsView();list();unavailable();search();
}

async function undo(item){
  if(!item||!confirm(`Rimettere ${item.name} tra i disponibili?`))return;
  const response=await fetch("/api/purchases",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({playerId:item.playerId})});
  if(!response.ok)throw new Error("Impossibile rimuovere l'acquisto.");
  refresh();
}

async function load(){
  try{
    const [playersResponse,purchasesResponse]=await Promise.all([fetch("/api/players"),fetch("/api/purchases")]);
    const data=await playersResponse.json();
    if(!playersResponse.ok)throw new Error(data.error||"Impossibile caricare i giocatori.");
    players=data.players||[];
    purchases=(await purchasesResponse.json()).purchases||[];
    $("#role-buttons").innerHTML=`<button class="active" data-role="">Tutti</button>${roles.map(item=>`<button data-role="${item}">${item}</button>`).join("")}`;
    $("#role-buttons").onclick=event=>{const button=event.target.closest("[data-role]");if(!button)return;role=button.dataset.role;document.querySelectorAll("[data-role]").forEach(item=>item.classList.toggle("active",item===button));list();};
    $("#sort").innerHTML=sortOptions.map(([key,direction])=>`<option value="${key}|${direction}">${key}: ${direction==="desc"?"alto → basso":"basso → alto"}</option>`).join("");
    teams.forEach(team=>$("#buyer").insertAdjacentHTML("beforeend",`<option>${team}</option>`));
    teamsView();list();unavailable();
  }catch(error){$("#players").innerHTML=`<p class="load-error">${error.message}</p>`;}
}

$("#search").oninput=()=>{search();list();};
$("#sort").onchange=list;
$("#favorites-only").onchange=list;
$("#assign-form").onsubmit=async event=>{
  event.preventDefault();
  const confirmButton=$("#confirm");confirmButton.disabled=true;confirmButton.textContent="Salvataggio…";
  try{
    const response=await fetch("/api/purchases",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({playerId:selected.id,name:selected.Nome,role:selected.Ruolo,team:selected.Team,buyer:$("#buyer").value,credits:num($("#credits").value)})});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||"Impossibile registrare l'acquisto.");
    $("#assign-dialog").close();await refresh();
  }catch(error){$("#assign-error").textContent=error.message;}
  finally{confirmButton.disabled=false;confirmButton.textContent="Conferma acquisto";}
};
load();
