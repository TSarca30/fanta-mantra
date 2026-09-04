const roles=["Por","Dc","B","Ds","Dd","E","M","C","W","T","A","Pc"],teams=["IO","Zago","Mezza","Baso","Luca","Gian","Rav","Righetto"];
const sortOptions=[["Prezzo","desc"],["Prezzo","asc"],["PMA","desc"],["PMA","asc"],["Quo","desc"],["Quo","asc"],["MV","desc"],["FMV","desc"],["Presenze","desc"],["Presenze","asc"],["Gol","desc"],["Ass","desc"],["Amm","asc"],["Esp","asc"]];
const reactions=[{key:"choice",icon:"★",label:"Scelta"},{key:"like",icon:"👍",label:"Mi piace"},{key:"watch",icon:"👁",label:"Da osservare"}];
let players=[],purchases=[],selected,role="",activeSearchPlayerId="";
let reactionsByType=Object.fromEntries(reactions.map(({key})=>[key,new Set(JSON.parse(localStorage.getItem(`mantra-${key}`)||"[]"))]));
const $=selector=>document.querySelector(selector);
const num=value=>Number(String(value||0).replace("%","").replace(",", "."))||0;
const purchase=player=>purchases.find(item=>item.playerId===player.id||(item.name===player.Nome&&item.team===player.Team));
const goalkeeper=player=>String(player.Ruolo||"").split(",").map(value=>value.trim()).includes("Por");
const saveReaction=type=>localStorage.setItem(`mantra-${type}`,JSON.stringify([...reactionsByType[type]]));
const isMarked=(player,type)=>reactionsByType[type].has(player.id);

function teamsView(){
  $("#teams").innerHTML=teams.map(team=>{
    const roster=purchases.filter(item=>item.buyer===team),spent=roster.reduce((sum,item)=>sum+item.credits,0);
    return `<article class="team"><div class="team-top"><span>${team}</span><span class="budget">● ${500-spent}</span></div><small>${roster.length} giocatori · ${spent} spesi</small><span class="team-players">${roster.map(item=>item.name).join(" · ")||"Rosa da costruire"}</span></article>`;
  }).join("");
}

function toggleReaction(player,type){
  isMarked(player,type)?reactionsByType[type].delete(player.id):reactionsByType[type].add(player.id);
  saveReaction(type);list();unavailable();search();
}

function reactionButtons(player){
  return reactions.map(({key,icon,label})=>`<button class="reaction ${key} ${isMarked(player,key)?"active":""}" type="button" data-reaction="${key}" aria-label="${label}" aria-pressed="${isMarked(player,key)}" title="${label}">${icon}</button>`).join("");
}

function rating(value){
  const amount=Math.max(0,Math.min(5,Math.round(num(value))));
  return `<span class="rating-bars" aria-label="${amount} su 5">${[1,2,3,4,5].map(index=>`<i class="${index<=amount?"on":""}"></i>`).join("")}</span>`;
}

function statsFor(player){
  const finishing=goalkeeper(player)?[["Gol Subiti","Gol subiti"],["Rig. Parati","Rig. parati"]]:[["Gol","Gol"],["Ass","Assist"]];
  return [["MV","MV"],["FMV","FMV"],["Presenze","Presenze"],["Pt. Tit.","Pt. titolare"],...finishing,["Amm","Amm."],["Esp","Esp."],["Titolarità","Titolarità","rating"],["Affidabilità","Affidabilità","rating"],["Integrità","Integrità","rating"]];
}

function playerTags(player){
  return `<span class="tag fascia">${player.Fascia||"Senza fascia"}</span><span class="tag role-tag">${player.Ruolo||"—"}</span><span class="tag team-tag">${player.Team||"—"}</span>`;
}

function card(player,off=false){
  const fragment=$("#player-template").content.cloneNode(true),assignButton=fragment.querySelector(".assign");
  fragment.querySelector(".reactions").innerHTML=reactionButtons(player);
  fragment.querySelectorAll("[data-reaction]").forEach(button=>button.onclick=()=>toggleReaction(player,button.dataset.reaction));
  fragment.querySelector(".name").textContent=player.Nome;
  fragment.querySelector(".tags").innerHTML=playerTags(player);
  fragment.querySelector(".metrics").innerHTML=statsFor(player).map(([key,label,type])=>`<span class="metric ${type||""}"><small>${label}</small><b>${type==="rating"?rating(player[key]):player[key]||"–"}</b></span>`).join("");
  assignButton.textContent=off?"Rimetti disponibile":"Assegna";
  assignButton.classList.toggle("undo",off);
  assignButton.onclick=()=>off?undo(purchase(player)):assign(player);
  return fragment;
}

function matchesFor(query){
  return players.filter(player=>`${player.Nome} ${player.Team}`.toLowerCase().includes(query)).slice(0,12);
}

function list(){
  const query=$("#search").value.toLowerCase(),[key,direction]=$("#sort").value.split("|"),filter=$("#reaction-filter").value;
  let visible=players.filter(player=>!purchase(player)&&(!role||player.roles?.includes(role)||player.Ruolo.includes(role))&&(!filter||isMarked(player,filter))&&(`${player.Nome} ${player.Team}`.toLowerCase().includes(query)));
  visible.sort((a,b)=>direction==="asc"?num(a[key])-num(b[key]):num(b[key])-num(a[key]));
  const fragment=document.createDocumentFragment();visible.forEach(player=>fragment.append(card(player)));
  $("#players").replaceChildren(fragment);$("#available-count").textContent=`${visible.length} disponibili`;
}

function unavailable(){
  const sold=players.filter(player=>purchase(player)),fragment=document.createDocumentFragment();
  sold.forEach(player=>fragment.append(card(player,true)));
  $("#unavailable").replaceChildren(fragment);$("#unavailable-count").textContent=`${sold.length} acquistati`;
}

function renderSearchDetail(player){
  const box=$("#search-result"),note=player.Commento||player["Nota 1"]||"Nessuna nota";
  const details=statsFor(player);
  box.insertAdjacentHTML("beforeend",`<div class="search-detail"><div class="search-detail-top"><div><p class="eyebrow">SCHEDA GIOCATORE</p><h2>${player.Nome}</h2><div class="detail-tags">${playerTags(player)}</div></div><div class="detail-actions"><div class="detail-reactions">${reactionButtons(player)}</div><button id="detail-assign">Assegna giocatore</button></div></div><div class="detail-grid">${details.map(([key,label,type])=>`<span class="detail ${type||""}"><small>${label}</small><b>${type==="rating"?rating(player[key]):player[key]||"–"}</b></span>`).join("")}</div><p class="player-note"><strong>Note:</strong> ${note}</p></div>`);
  box.querySelectorAll("[data-reaction]").forEach(button=>button.onclick=()=>toggleReaction(player,button.dataset.reaction));
  const assignButton=$("#detail-assign");assignButton.disabled=!!purchase(player);assignButton.onclick=()=>assign(player);
}

function search(){
  const query=$("#search").value.trim().toLowerCase(),box=$("#search-result");
  if(!query){activeSearchPlayerId="";box.replaceChildren();return;}
  const matches=matchesFor(query);
  if(!matches.length){activeSearchPlayerId="";box.innerHTML='<p class="muted search-empty">Nessun giocatore trovato.</p>';return;}
  if(matches.length===1)activeSearchPlayerId=matches[0].id;
  if(!matches.some(player=>player.id===activeSearchPlayerId))activeSearchPlayerId="";
  box.innerHTML=`<div class="search-matches"><p class="eyebrow">RISULTATI (${matches.length})</p><div class="match-list">${matches.map(player=>`<button type="button" class="match ${player.id===activeSearchPlayerId?"selected":""}" data-player-id="${player.id}"><strong>${player.Nome}</strong><span>${player.Ruolo} · ${player.Team}</span></button>`).join("")}</div></div>`;
  box.querySelectorAll("[data-player-id]").forEach(button=>button.onclick=()=>{activeSearchPlayerId=button.dataset.playerId;search();});
  const selectedPlayer=matches.find(player=>player.id===activeSearchPlayerId);
  if(selectedPlayer)renderSearchDetail(selectedPlayer);
}

function assign(player){
  selected=player;$("#modal-name").textContent=player.Nome;$("#modal-info").textContent=`${player.Ruolo} · ${player.Team}`;
  $("#modal-note").textContent=player.Commento||player["Nota 1"]||"Nessuna nota disponibile";$("#credits").value=player.Prezzo||"";
  $("#assign-dialog").showModal();$("#buyer").focus();
}

async function refresh(){
  const response=await fetch("/api/purchases");purchases=(await response.json()).purchases||[];
  teamsView();list();unavailable();search();
}

async function undo(item){
  if(!item||!confirm(`Rimettere ${item.name} tra i disponibili?`))return;
  const response=await fetch("/api/purchases",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({playerId:item.playerId})});
  if(!response.ok)throw new Error("Impossibile rimuovere l'acquisto.");refresh();
}

async function load(){
  try{
    const [playersResponse,purchasesResponse]=await Promise.all([fetch("/api/players"),fetch("/api/purchases")]),data=await playersResponse.json();
    if(!playersResponse.ok)throw new Error(data.error||"Impossibile caricare i giocatori.");
    players=data.players||[];purchases=(await purchasesResponse.json()).purchases||[];
    $("#role-buttons").innerHTML=`<button class="active" data-role="">Tutti</button>${roles.map(item=>`<button data-role="${item}">${item}</button>`).join("")}`;
    $("#role-buttons").onclick=event=>{const button=event.target.closest("[data-role]");if(!button)return;role=button.dataset.role;document.querySelectorAll("[data-role]").forEach(item=>item.classList.toggle("active",item===button));list();};
    $("#sort").innerHTML=sortOptions.map(([key,direction])=>`<option value="${key}|${direction}">${key}: ${direction==="desc"?"alto → basso":"basso → alto"}</option>`).join("");
    $("#reaction-filter").innerHTML=`<option value="">Tutte le categorie</option>${reactions.map(({key,icon,label})=>`<option value="${key}">${icon} ${label}</option>`).join("")}`;
    teams.forEach(team=>$("#buyer").insertAdjacentHTML("beforeend",`<option>${team}</option>`));teamsView();list();unavailable();
  }catch(error){$("#players").innerHTML=`<p class="load-error">${error.message}</p>`;}
}

$("#search").oninput=()=>{search();list();};$("#sort").onchange=list;$("#reaction-filter").onchange=list;
$("#assign-form").onsubmit=async event=>{
  event.preventDefault();const confirmButton=$("#confirm");confirmButton.disabled=true;confirmButton.textContent="Salvataggio…";
  try{
    const response=await fetch("/api/purchases",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({playerId:selected.id,name:selected.Nome,role:selected.Ruolo,team:selected.Team,buyer:$("#buyer").value,credits:num($("#credits").value)})}),data=await response.json();
    if(!response.ok)throw new Error(data.error||"Impossibile registrare l'acquisto.");$("#assign-dialog").close();await refresh();
  }catch(error){$("#assign-error").textContent=error.message;}
  finally{confirmButton.disabled=false;confirmButton.textContent="Conferma acquisto";}
};
load();
