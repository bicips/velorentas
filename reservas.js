// DATA
var TIPOS_DEF={urbana:{label:'MTB',icon:'🚲',color:'#3b82f6',sizes:['XS','S','M','L','XL']},montana:{label:'Powerfly',icon:'🚵',color:'#22c55e',sizes:['S','M','L','XL']},electrica:{label:'Checkpoint',icon:'⚡',color:'#f59e0b',sizes:['S','M','L']},cargo:{label:'Cargo',icon:'📦',color:'#8b5cf6',sizes:['Único','L','XL']},infantil:{label:'Infantil',icon:'🛴',color:'#ec4899',sizes:['12"','16"','20"','24"']},gravel:{label:'Gravel',icon:'🏔️',color:'#06b6d4',sizes:['XS','S','M','L','XL']}};
var BIKES_DEF=[{id:1,numBici:'B-001',tipo:'urbana',talla:'M',modelo:'Trek Marlin 7',estado:'disponible'},{id:2,numBici:'B-002',tipo:'urbana',talla:'L',modelo:'Trek Marlin 7',estado:'disponible'},{id:3,numBici:'B-003',tipo:'montana',talla:'M',modelo:'Powerfly 5',estado:'disponible'},{id:4,numBici:'B-004',tipo:'electrica',talla:'M',modelo:'Checkpoint SL',estado:'disponible'},{id:5,numBici:'B-005',tipo:'infantil',talla:'20"',modelo:'Trek Precaliber',estado:'disponible'}];
var CFG_DEF={minDays:3,gapDays:6,currency:'€',bizName:'VeloRentas',cif:'',addr:'',phone:'',iva:21,fprefix:'F-2024-'};
// ── Compatibilidad localStorage (usado para prep/print prefs) ──
function ld(k,d){try{var s=localStorage.getItem(k);return s?JSON.parse(s):d;}catch(e){return d;}}
function svs(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
var BIKE_ESTADOS={
  stock:     {lbl:'En stock',   icon:'📦',color:'#6b7280',bg:'#f3f4f6',border:'#d1d5db',txt:'#374151'},
  disponible:{lbl:'Disponible', icon:'✅',color:'#16a34a',bg:'#dcfce7',border:'#86efac',txt:'#15803d'},
  averiada:  {lbl:'Averiada',   icon:'⚠️',color:'#dc2626',bg:'#fee2e2',border:'#fca5a5',txt:'#991b1b'},
  asignada:  {lbl:'Asignada',   icon:'🔗',color:'#2563eb',bg:'#dbeafe',border:'#93c5fd',txt:'#1d4ed8'},
  reparto:   {lbl:'En reparto', icon:'🚚',color:'#d97706',bg:'#fef3c7',border:'#fcd34d',txt:'#92400e'},
  entregada:  {lbl:'Entregada',  icon:'🏁',color:'#0d9488',bg:'#ccfbf1',border:'#5eead4',txt:'#0f766e'},
  finalizado: {lbl:'Finalizado',  icon:'✔️', color:'#4b5563',bg:'#f3f4f6',border:'#9ca3af',txt:'#1f2937'},
  retornar:   {lbl:'Retornar',    icon:'🔄',color:'#7c3aed',bg:'#ede9fe',border:'#c4b5fd',txt:'#5b21b6'}
};
// Variables globales — se cargan desde Supabase en initApp()
var tipos=TIPOS_DEF, bikes=[], reservas=[], bloqueos=[], facturas=[], tarifas={}, cfg=Object.assign({},CFG_DEF);
var impExcluidas=[]; // IDs de reservas excluidas de impresión

// ── Guardar en Supabase (async, silencioso) ────────────────────
function sR(){DB.saveReservas(reservas).catch(function(e){console.error('sR',e);});}
function sBQ(){DB.saveConfig('bloqueos',bloqueos).catch(function(e){console.error('sBQ',e);});}
function sF(){DB.saveConfig('facturas',facturas).catch(function(e){console.error('sF',e);});}
function sT(){DB.saveConfig('tarifas',tarifas).catch(function(e){console.error('sT',e);});}
function sC(){DB.saveConfig('cfg',cfg).catch(function(e){console.error('sC',e);});}
function sBikes(){DB.saveBicis(bikes).catch(function(e){console.error('sBikes',e);});}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function toD(s){return new Date(s+'T00:00:00');}
function isoD(d){return d.toISOString().slice(0,10);}
function addD(d,n){var r=toD(d);r.setDate(r.getDate()+n);return isoD(r);}
function diffD(a,b){return Math.round((toD(b)-toD(a))/86400000);}
function todayS(){return new Date().toISOString().slice(0,10);}
function fmtD(d){if(!d)return '-';return toD(d).toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric'});}
function fmtDs(d){if(!d)return '-';return toD(d).toLocaleDateString('es-ES',{day:'numeric',month:'short'});}
function inRange(d,a,b){return d>=a&&d<=b;}
function toast(m,ms){ms=ms||2600;var t=document.getElementById('toast');t.textContent=m;t.classList.add('on');setTimeout(function(){t.classList.remove('on');},ms);}
function openM(id){document.getElementById(id).classList.add('on');}
function closeM(id){document.getElementById(id).classList.remove('on');}
document.querySelectorAll('.mover').forEach(function(m){m.addEventListener('click',function(e){if(e.target===m){m.classList.remove('on');if(m.id==='mqrasign')stopQRa();}});});
var SCFG={
  anulada:          {lbl:'Anulada',           cls:'bn-red',    icon:'🚫'},
  pendiente:        {lbl:'Pendiente',          cls:'bn-amber',  icon:'⏳'},
  confirmada:       {lbl:'Confirmada',         cls:'bn-blue',   icon:'✅'},
  en_preparacion:   {lbl:'En preparación',     cls:'bn-orange', icon:'🔧'},
  preparada:        {lbl:'Preparada',          cls:'bn-teal',   icon:'📦'},
  transito_furgo:   {lbl:'Tránsito (Furgo)',   cls:'bn-blue',   icon:'🚐'},
  transito_carlos:  {lbl:'Tránsito (Carlos)',  cls:'bn-blue',   icon:'🚗'},
  transito_seur:    {lbl:'Tránsito (Seur)',    cls:'bn-blue',   icon:'📦'},
  entregada:        {lbl:'Entregada',          cls:'bn-green',  icon:'🏁'},
  alquiler:         {lbl:'Alquiler',           cls:'bn-green',  icon:'🚲'},
  pendiente_recoger:{lbl:'Pendiente recoger',  cls:'bn-amber',  icon:'🔔'},
  recogida:         {lbl:'Recogida',           cls:'bn-gray',   icon:'✔️'},
  cancelada:        {lbl:'Cancelada',          cls:'bn-red',    icon:'❌'}
};
var RCOLS=[['#dbeafe','#1d4ed8'],['#dcfce7','#15803d'],['#fef3c7','#b45309'],['#fae8ff','#7e22ce'],['#cffafe','#0e7490'],['#fee2e2','#991b1b'],['#f0fdf4','#166534'],['#eff6ff','#1e40af']];
function rcol(id){return RCOLS[Math.abs(id)%RCOLS.length];}

// VIEWS
var CV='dash';
var VTITLES={dash:'Panel',flota:'Gestión de flota',cal:'Calendario',timeline:'Timeline',res:'Reservas',fact:'Facturas',informes:'Informes',tarifas:'Tarifas',clientes:'Clientes'};
function goV(v){
  document.querySelectorAll('.view').forEach(function(e){e.classList.remove('on');});
  document.getElementById('v-'+v).classList.add('on');
  document.querySelectorAll('.ni').forEach(function(e){e.classList.remove('on');});
  var ni=document.getElementById('nav-'+v);if(ni)ni.classList.add('on');
  document.getElementById('pgtitle').textContent=VTITLES[v]||v;
  CV=v;closeSB();
  if(v==='dash')renderDash();
  else if(v==='flota'){initFlotaSelects();renderFlota();}
  else if(v==='cal')renderCal();
  else if(v==='timeline'){initTLSelects();renderTL();}
  else if(v==='res')renderRes();
  else if(v==='fact')renderFact();
  else if(v==='informes')renderInformes();
  else if(v==='tarifas')renderTarifas();
  else if(v==='clientes')renderClientes();
}
function toggleSB(){document.getElementById('sidebar').classList.toggle('open');document.getElementById('sbov').classList.toggle('on');}
function closeSB(){document.getElementById('sidebar').classList.remove('open');document.getElementById('sbov').classList.remove('on');}

// CONFIG
function loadCfg(){['biz','cif','addr','phone'].forEach(function(k){document.getElementById('c-'+k).value=cfg[k==='biz'?'bizName':k]||'';});document.getElementById('c-min').value=cfg.minDays||3;document.getElementById('c-gap').value=cfg.gapDays||6;document.getElementById('c-cur').value=cfg.currency||'€';document.getElementById('c-iva').value=cfg.iva||21;document.getElementById('c-fprefix').value=cfg.fprefix||'F-2024-';}
function saveCfg(){cfg.bizName=document.getElementById('c-biz').value.trim()||'VeloRentas';cfg.cif=document.getElementById('c-cif').value.trim();cfg.addr=document.getElementById('c-addr').value.trim();cfg.phone=document.getElementById('c-phone').value.trim();cfg.minDays=parseInt(document.getElementById('c-min').value)||3;cfg.gapDays=parseInt(document.getElementById('c-gap').value)||6;cfg.currency=document.getElementById('c-cur').value;cfg.iva=parseFloat(document.getElementById('c-iva').value)||21;cfg.fprefix=document.getElementById('c-fprefix').value||'F-2024-';sC();closeM('mcfg');toast('Configuración guardada');}

// AVAILABILITY ENGINE
// 'stock' y 'disponible' cuentan como disponibles para reservas
function bikeOperativa(b){return b.estado==='disponible'||b.estado==='stock';}

function bikeFreeForRange(bikeId,ini,fin,excludeId){var niG=addD(ini,-cfg.gapDays);var ok=true;reservas.forEach(function(r){if(r.bikeId!==bikeId||(r.estado==='cancelada'||r.estado==='anulada'||r.estado==='recogida')||(excludeId&&r.id===excludeId))return;if(!(fin<r.ini||niG>r.fin))ok=false;});return ok;}
function getAvailCount(tipo,talla,ini,fin,excludeId){var niG=addD(ini,-cfg.gapDays);var blqUds=0;bloqueos.forEach(function(b){if(b.tipo!==tipo||b.talla!==talla)return;if(!(fin<b.ini||niG>b.fin))blqUds+=(b.uds||1);});var free=bikes.filter(function(b){return b.tipo===tipo&&b.talla===talla&&bikeOperativa(b)&&bikeFreeForRange(b.id,ini,fin,excludeId);});return Math.max(0,free.length-blqUds);}
function getAvailBikes(tipo,talla,ini,fin,excludeId){var niG=addD(ini,-cfg.gapDays);var blqUds=0;bloqueos.forEach(function(b){if(b.tipo!==tipo||b.talla!==talla)return;if(!(fin<b.ini||niG>b.fin))blqUds+=(b.uds||1);});var free=bikes.filter(function(b){return b.tipo===tipo&&b.talla===talla&&bikeOperativa(b)&&bikeFreeForRange(b.id,ini,fin,excludeId);});return free.slice(blqUds);}

// DASHBOARD
function emptyHTML(icon,txt){return '<div class="empty"><div class="empty-i">'+icon+'</div><div class="empty-t">'+txt+'</div></div>';}
function renderDash(){
  var lbl=document.getElementById('tdlbl');if(lbl)lbl.textContent=new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  var today=todayS();
  var activas=reservas.filter(function(r){return r.estado==='alquiler'||r.estado==='entregada';}).length;
  var bikesReparto=bikes.filter(function(b){return b.estado==='reparto';}).length;
  var bikesEntregadas=bikes.filter(function(b){return b.estado==='entregada';}).length;
  var pend=reservas.filter(function(r){return r.estado==='pendiente';}).length;
  var prox=reservas.filter(function(r){return r.estado==='proxima_entrega';}).length;
  var mes=today.slice(0,7);
  var ingr=reservas.filter(function(r){return r.estado!=='cancelada'&&r.ini.slice(0,7)===mes;}).reduce(function(s,r){return s+(r.total||0);},0);
  var sg=document.getElementById('dstats');
  if(sg)sg.innerHTML=[{c:'c-teal',i:'🔄',v:activas,l:'Activas hoy'},{c:'c-amber',i:'⏳',v:pend,l:'Pendientes'},{c:'c-blue',i:'📅',v:prox,l:'Entradas 7 días'},{c:'c-green',i:'💶',v:ingr.toFixed(0)+cfg.currency,l:'Facturación mes'}].map(function(s){return '<div class="scard '+s.c+'"><div class="sico">'+s.i+'</div><div class="sval">'+s.v+'</div><div class="slbl">'+s.l+'</div></div>';}).join('');
  var arr=reservas.filter(function(r){return r.estado!=='cancelada'&&r.ini>=today&&diffD(today,r.ini)<=7;}).sort(function(a,b){return a.ini.localeCompare(b.ini);});
  var dep=reservas.filter(function(r){return r.estado!=='cancelada'&&r.fin>=today&&diffD(today,r.fin)<=7;}).sort(function(a,b){return a.fin.localeCompare(b.fin);});
  var da=document.getElementById('d-arrivals');if(da)da.innerHTML=arr.length?arr.map(function(r){return miniRow(r,'entrada');}).join(''):emptyHTML('📅','Sin entradas');
  var dd=document.getElementById('d-departs');if(dd)dd.innerHTML=dep.length?dep.map(function(r){return miniRow(r,'salida');}).join(''):emptyHTML('🏁','Sin salidas');
  var html='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px">';
  Object.keys(tipos).forEach(function(k){var t=tipos[k];t.sizes.forEach(function(talla){var total=bikes.filter(function(b){return b.tipo===k&&b.talla===talla&&bikeOperativa(b);}).length;if(!total)return;var libre=getAvailCount(k,talla,today,today);html+='<div style="background:#fff;border:1px solid var(--g200);border-radius:10px;padding:12px 14px;border-left:4px solid '+t.color+'"><div style="font-size:11px;font-weight:700;color:var(--g500);margin-bottom:6px;text-transform:uppercase">'+t.icon+' '+t.label+' - '+talla+'</div><div style="font-size:24px;font-weight:800;color:'+(libre>0?'var(--gr600)':'var(--r600)')+'">'+libre+'</div><div style="font-size:11px;color:var(--g400)">libre'+(libre!==1?'s':'')+' de '+total+'</div></div>';});});
  html+='</div>';
  var da2=document.getElementById('d-avail');if(da2)da2.innerHTML=html;
}
function miniRow(r,tipo){
  var t=tipos[r.tipo]||{icon:'🚲'};var sc=SCFG[r.estado]||{lbl:r.estado,cls:'bn-gray'};
  var dateStr=tipo==='entrada'?fmtDs(r.ini):fmtDs(r.fin);var icon=tipo==='entrada'?'📅':'🏁';
  var hasBike=r.bikesAsig&&r.bikesAsig.length>0;
  var bikesLine=r.lineas&&r.lineas.length>1?r.lineas.map(function(l){var tl=tipos[l.tipo]||{label:l.tipo};return tl.label+' '+esc(l.talla)+(l.uds>1?' x'+l.uds:'');}).join(' | '):(tipos[r.tipo]||{label:r.tipo}).label+' '+esc(r.talla)+(r.uds>1?' x'+r.uds:'');
  return '<div class="trow" onclick="showResDetail('+r.id+')" style="cursor:pointer"><span style="font-size:18px">'+t.icon+'</span><div class="trow-info"><div class="trow-main">'+esc(r.cliente)+'</div><div class="trow-sub"><span>'+icon+' '+dateStr+'</span><span>'+bikesLine+'</span>'+(hasBike?'<span style="color:var(--gr600)">'+r.bikesAsig.map(function(b){return esc(b.num);}).join(', ')+'</span>':'<span style="color:var(--am500)">⚠️ Sin asignar</span>')+'</div></div><span class="badge '+sc.cls+'"><span class="bdot"></span>'+sc.lbl+'</span></div>';
}

// FLOTA
var flotaFilter='all';
function setFF(v,btn){flotaFilter=v;document.querySelectorAll('#v-flota .ftab').forEach(function(b){b.classList.remove('on');});btn.classList.add('on');renderFlota();}
function initFlotaSelects(){var ts=document.getElementById('flota-tipo');if(!ts)return;var pv=ts.value;ts.innerHTML='<option value="">Todos los modelos</option>'+Object.keys(tipos).map(function(k){var t=tipos[k];return '<option value="'+k+'">'+t.icon+' '+t.label+'</option>';}).join('');if(pv)ts.value=pv;}
function renderFlota(){
  var today=todayS(),tipoF=document.getElementById('flota-tipo').value,tallaF=document.getElementById('flota-talla').value;
  if(tipoF){var t=tipos[tipoF]||{sizes:[]};var ts=document.getElementById('flota-talla');var pv=ts.value;ts.innerHTML='<option value="">Todas las tallas</option>'+t.sizes.map(function(s){return '<option value="'+s+'">'+s+'</option>';}).join('');if(pv)ts.value=pv;}
  var bList=bikes.filter(function(b){if(tipoF&&b.tipo!==tipoF)return false;if(tallaF&&b.talla!==tallaF)return false;return true;});
  var html='';
  bList.forEach(function(b){
    var t=tipos[b.tipo]||{icon:'🚲',color:'#999',label:b.tipo};
    var resActiva=reservas.find(function(r){return r.bikeId===b.id&&r.estado!=='cancelada'&&r.ini<=today&&r.fin>=today;});
    var blqActivo=bloqueos.find(function(bl){return bl.tipo===b.tipo&&bl.talla===b.talla&&bl.ini<=today&&bl.fin>=today;});
    var clsCls,badge;
    var be=BIKE_ESTADOS[b.estado]||BIKE_ESTADOS.disponible;
    if(b.estado==='averiada'){clsCls='bloqueada';badge='<span style="background:'+be.bg+';color:'+be.txt+';padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700">'+be.icon+' '+be.lbl+'</span>';}
    else if(blqActivo){clsCls='bloqueada';badge='<span class="badge bn-red"><span class="bdot"></span>Bloqueada</span>';}
    else if(resActiva){clsCls='asignada';badge='<span style="background:'+be.bg+';color:'+be.txt+';padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700">'+be.icon+' '+be.lbl+'</span>';}
    else{clsCls='sin-asignar';badge='<span style="background:'+be.bg+';color:'+be.txt+';padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700">'+be.icon+' '+be.lbl+'</span>';}
    if(flotaFilter==='libre'&&clsCls!=='sin-asignar')return;
    if(flotaFilter==='bloqueada'&&clsCls!=='bloqueada')return;
    var thumb=b.icono&&b.icono.indexOf('data:')===0?'<img src="'+b.icono+'" style="width:100%;height:100%;object-fit:cover;border-radius:6px"/>':'<span style="font-size:22px">'+t.icon+'</span>';
    html+='<div class="fleet-card '+clsCls+'"><div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><div style="width:44px;height:44px;background:'+t.color+'18;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">'+thumb+'</div><div style="flex:1"><div style="font-weight:700;font-size:14px">'+esc(b.numBici)+'</div><div style="font-size:12px;color:var(--g400)">'+t.label+' - '+esc(b.talla)+'</div></div>'+badge+'</div>';
    html+='<div style="font-size:12px;color:var(--g500);margin-bottom:8px">'+esc(b.modelo||'')+'</div>';
    if(resActiva)html+='<div style="font-size:12px;background:rgba(20,184,166,.08);padding:6px 8px;border-radius:6px;margin-bottom:8px">'+esc(resActiva.cliente)+' hasta '+fmtDs(resActiva.fin)+'</div>';
    if(blqActivo)html+='<div style="font-size:12px;background:var(--r50);padding:6px 8px;border-radius:6px;margin-bottom:8px">🔒 '+esc(blqActivo.motivo||'Bloqueada')+'</div>';
    html+='<div style="display:flex;gap:5px;flex-wrap:wrap">';
    var canReservar=['disponible','stock'].indexOf(b.estado)>=0&&!resActiva;
    if(canReservar)html+='<button class="btn bb bxs" onclick="openNewResForBike('+b.id+')">+ Reservar</button>';
    html+='<button class="btn bs bxs" onclick="openBikeEstadoModal('+b.id+')" title="Cambiar estado">'+be.icon+' Estado</button>';
    html+='</div></div>';
  });
  var el=document.getElementById('flota-grid');if(el)el.innerHTML=html||emptyHTML('🚲','Sin bicicletas con este filtro');
}
function openNewResForBike(bikeId){var b=bikes.find(function(x){return x.id===bikeId;});if(!b)return;openNewRes(b.tipo,b.talla);}

// BLOQUEO
function openBloqueo(){var ts=document.getElementById('blq-tipo');ts.innerHTML='<option value="">- Modelo -</option>'+Object.keys(tipos).map(function(k){var t=tipos[k];return '<option value="'+k+'">'+t.icon+' '+t.label+'</option>';}).join('');document.getElementById('blq-talla').innerHTML='<option value="">- Talla -</option>';['blq-ini','blq-fin','blq-motivo'].forEach(function(id){document.getElementById(id).value='';});document.getElementById('blq-uds').value=1;document.getElementById('blq-avail-info').innerHTML='';openM('mbloqueo');}
function blqTC(){var t=tipos[document.getElementById('blq-tipo').value]||{sizes:[]};document.getElementById('blq-talla').innerHTML='<option value="">- Talla -</option>'+t.sizes.map(function(s){return '<option value="'+s+'">'+s+'</option>';}).join('');}
function saveBloqueo(){var tipo=document.getElementById('blq-tipo').value,talla=document.getElementById('blq-talla').value,ini=document.getElementById('blq-ini').value,fin=document.getElementById('blq-fin').value,motivo=document.getElementById('blq-motivo').value.trim(),uds=parseInt(document.getElementById('blq-uds').value)||1;if(!tipo||!talla||!ini||!fin){toast('Completa modelo, talla y fechas');return;}if(ini>fin){toast('Fecha fin debe ser posterior');return;}bloqueos.push({id:Date.now(),tipo:tipo,talla:talla,ini:ini,fin:fin,motivo:motivo,uds:uds});sBQ();closeM('mbloqueo');toast('Bloqueo registrado');renderFlota();renderDash();if(CV==='cal')renderCal();if(CV==='timeline')renderTL();if(CV==='informes')renderInformes();}
function delBloqueo(id){if(!window.confirm('Eliminar este bloqueo?'))return;bloqueos=bloqueos.filter(function(x){return x.id!==id;});sBQ();renderBlqList();renderFlota();renderDash();if(CV==='cal')renderCal();if(CV==='timeline')renderTL();toast('Bloqueo eliminado');}

// RESERVAS - LINEAS MULTIPLES
var asignadas=[];
var lineas=[];
var currentResId=null; // ID of reservation being edited (for direct save)

function addLinea(tipo,talla,uds,ppd){
  lineas.push({tipo:tipo||'',talla:talla||'',uds:uds||1,ppd:ppd||0,extras:[]});
  renderLineas();
  renderExtrasBici();
}
function removeLinea(i){lineas.splice(i,1);renderLineas();}

function renderLineas(){
  var el=document.getElementById('r-lineas');if(!el)return;
  var ini=document.getElementById('r-ini').value,fin=document.getElementById('r-fin').value;
  var eid=document.getElementById('r-eid').value,eidN=eid?parseInt(eid):null;

  if(!lineas.length){
    el.innerHTML='<div style="padding:14px 16px;font-size:13px;color:var(--g400);text-align:center">'+
      '<div style="font-size:28px;margin-bottom:6px">🚲</div>'+
      'Pulsa el botón verde para añadir bicicletas</div>';
    return;
  }

  var html='';
  lineas.forEach(function(l,i){
    var t=tipos[l.tipo]||{icon:'🚲',color:'#eee',sizes:[]};
    // tipo options
    var tipoOpts='<option value="">- Modelo -</option>';
    Object.keys(tipos).forEach(function(k){
      var tt=tipos[k];
      tipoOpts+='<option value="'+k+'"'+(l.tipo===k?' selected':'')+'>'+tt.icon+' '+tt.label+'</option>';
    });
    // talla options
    var tallaOpts='<option value="">Talla</option>';
    (t.sizes||[]).forEach(function(s){
      tallaOpts+='<option value="'+s+'"'+(l.talla===s?' selected':'')+'>'+s+'</option>';
    });
    // availability
    var availTxt='';
    if(l.tipo&&l.talla&&ini&&fin&&diffD(ini,fin)+1>=cfg.minDays){
      var cnt=getAvailCount(l.tipo,l.talla,ini,fin,eidN);
      availTxt=cnt>=l.uds
        ?'<span style="font-size:11px;color:#16a34a;font-weight:700;white-space:nowrap">✅ '+cnt+' disp.</span>'
        :'<span style="font-size:11px;color:#dc2626;font-weight:700;white-space:nowrap">❌ '+cnt+' disp.</span>';
    }
    html+='<div style="display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid #f3f4f6;flex-wrap:wrap;background:'+(i%2===0?'#fff':'#f9fafb')+'">';
    html+='<div style="width:34px;height:34px;background:'+(t.color||'#eee')+'22;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">'+(t.icon||'🚲')+'</div>';
    html+='<select data-li="'+i+'" data-f="tipo" style="flex:1;min-width:100px;padding:7px 8px;font-size:13px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;color:#111">'+tipoOpts+'</select>';
    html+='<select data-li="'+i+'" data-f="talla" style="width:80px;padding:7px 8px;font-size:13px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;color:#111">'+tallaOpts+'</select>';
    html+='<div style="display:flex;align-items:center;gap:4px">';
    html+='<span style="font-size:11px;color:#6b7280">Ud.</span>';
    html+='<input type="number" data-li="'+i+'" data-f="uds" min="1" value="'+l.uds+'" style="width:54px;padding:6px 7px;font-size:13px;border:1px solid #e5e7eb;border-radius:8px;text-align:center"/>';
    html+='</div>';
    html+='<div style="display:flex;align-items:center;gap:4px">';
    html+='<span style="font-size:11px;color:#6b7280">€/d</span>';
    html+='<input type="number" data-li="'+i+'" data-f="ppd" min="0" step="0.01" value="'+(l.ppd||'')+'" placeholder="0" style="width:68px;padding:6px 7px;font-size:13px;border:1px solid #e5e7eb;border-radius:8px"/>';
    html+='</div>';
    html+=availTxt;
    html+='<button data-rm="'+i+'" style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626;border-radius:6px;padding:5px 10px;cursor:pointer;font-size:13px;font-weight:700;flex-shrink:0;line-height:1">✕</button>';
    html+='</div>';
  });
  el.innerHTML=html;

  // Attach events via delegation on the container
  el.querySelectorAll('select[data-li],input[data-li]').forEach(function(inp){
    inp.addEventListener('change',function(){
      var idx=parseInt(this.getAttribute('data-li'));
      var field=this.getAttribute('data-f');
      if(field==='tipo'){lineas[idx].tipo=this.value;lineas[idx].talla='';lineas[idx].ppd=0;renderLineas();return;}
      if(field==='talla'){lineas[idx].talla=this.value;var p=tarifas[lineas[idx].tipo+'_'+this.value];if(p)lineas[idx].ppd=p;renderLineas();recalcPPD();return;}
      if(field==='uds'){lineas[idx].uds=parseInt(this.value)||1;renderLineas();recalcPPD();return;}
      if(field==='ppd'){lineas[idx].ppd=parseFloat(this.value)||0;recalcPPD();return;}
    });
  });
  el.querySelectorAll('button[data-rm]').forEach(function(btn){
    btn.addEventListener('click',function(){
      var idx=parseInt(this.getAttribute('data-rm'));
      lineas.splice(idx,1);renderLineas();
    });
  });

  recalcPPD();
  checkAllLineas();
}

function recalcPPD(){
  var ini=document.getElementById('r-ini').value,fin=document.getElementById('r-fin').value;
  if(!ini||!fin)return;
  var dias=diffD(ini,fin)+1;
  var totalPPD=lineas.reduce(function(s,l){return s+(l.ppd||0)*(l.uds||1);},0);
  if(totalPPD){document.getElementById('r-ppd').value=totalPPD.toFixed(2);if(dias>=cfg.minDays)document.getElementById('r-total').value=(totalPPD*dias).toFixed(2);}
}

function checkAllLineas(){
  var el=document.getElementById('r-avail');if(!el)return;
  var ini=document.getElementById('r-ini').value,fin=document.getElementById('r-fin').value;
  var eid=document.getElementById('r-eid').value,eidN=eid?parseInt(eid):null;
  if(!ini||!fin||!lineas.length){el.style.display='none';return;}
  if(diffD(ini,fin)+1<cfg.minDays){el.style.display='none';return;}
  var msgs=[],hasError=false;
  lineas.forEach(function(l){if(!l.tipo||!l.talla)return;var cnt=getAvailCount(l.tipo,l.talla,ini,fin,eidN);var t=tipos[l.tipo]||{label:l.tipo};if(cnt<l.uds){hasError=true;msgs.push('❌ '+t.label+' '+l.talla+': solo '+cnt+' disp., necesitas '+l.uds);}else{msgs.push('✅ '+t.label+' '+l.talla+' ×'+l.uds+': disponible');}});
  if(!msgs.length){el.style.display='none';return;}
  el.style.display='block';el.style.background=hasError?'var(--r50)':'var(--gr50)';el.style.color=hasError?'var(--r600)':'var(--gr700)';el.style.border='none';el.innerHTML=msgs.join('<br>');
}

function openNewRes(preTipo,preTalla){
  document.getElementById('mres-tit').textContent='Nueva reserva';
  currentResId=null;
  document.getElementById('r-eid').value='';
  ['r-nom','r-tel','r-email','r-dni','r-notas','r-ppd','r-total','r-lugar-ini','r-lugar-fin','r-dir-entrega'].forEach(function(id){document.getElementById(id).value='';});
  document.getElementById('r-estado').value='pendiente';
  document.getElementById('r-ini').value=todayS();
  document.getElementById('r-fin').value=addD(todayS(),cfg.minDays-1);
  document.getElementById('r-lugar-fin').value='Santiago de Compostela';
  document.getElementById('r-dinfo').style.display='none';
  document.getElementById('r-fact-btn').style.display='none';
  asignadas=[];renderAsig();
  lineas=[];
  if(preTipo){lineas.push({tipo:preTipo,talla:preTalla||'',uds:1,ppd:tarifas[preTipo+'_'+(preTalla||'')]||0});}
  else{lineas.push({tipo:'',talla:'',uds:1,ppd:0});}
  openM('mres');
  setTimeout(function(){renderLineas();renderAsig();initExtrasModal();},30);
}

function openEditRes(id){
  var r=reservas.find(function(x){return x.id===id;});if(!r)return;
  document.getElementById('mres-tit').textContent='Editar reserva';
  currentResId=id;
  document.getElementById('r-eid').value=id;
  document.getElementById('r-nom').value=r.cliente||'';
  document.getElementById('r-tel').value=r.tel||'';
  document.getElementById('r-email').value=r.email||'';
  document.getElementById('r-dni').value=r.dni||'';
  document.getElementById('r-notas').value=r.notas||'';
  document.getElementById('r-ppd').value=r.ppd||'';
  document.getElementById('r-total').value=r.total||r.precio||'';
  document.getElementById('r-estado').value=r.estado||'pendiente';
  document.getElementById('r-ini').value=r.ini||'';
  document.getElementById('r-fin').value=r.fin||'';
  document.getElementById('r-lugar-ini').value=r.lugarIni||'';
  document.getElementById('r-lugar-fin').value=r.lugarFin||'Santiago de Compostela';
  document.getElementById('r-dir-entrega').value=r.dirEntrega||'';
  asignadas=r.bikesAsig?r.bikesAsig.slice():[];
  if(r.lineas&&r.lineas.length){lineas=r.lineas.map(function(l){return Object.assign({},l);});}else{lineas=[{tipo:r.tipo||'',talla:r.talla||'',uds:r.uds||1,ppd:r.ppd||0,extras:[]}];}
  document.getElementById('r-dinfo').style.display='none';
  document.getElementById('r-fact-btn').style.display=r.estado==='finalizada'?'inline-flex':'none';
  calcDays();
  openM('mres');
  setTimeout(function(){renderLineas();renderAsig();loadExtrasFromRes(r);},30);
}

function fillTipoSel(){}
function rTC(){}
function autoFillPrice(){}

function calcDays(){
  var ini=document.getElementById('r-ini').value,fin=document.getElementById('r-fin').value;
  var el=document.getElementById('r-dinfo');
  if(!ini||!fin){el.style.display='none';return;}
  var d=diffD(ini,fin)+1;el.style.display='block';
  if(d<cfg.minDays){el.style.cssText='display:block;background:var(--r50);color:var(--r600);font-size:13px;padding:8px 12px;border-radius:8px;margin:-6px 0 12px';el.innerHTML='Mínimo '+cfg.minDays+' días — seleccionados: '+d;}
  else{el.style.cssText='display:block;background:var(--gr50);color:var(--gr700);font-size:13px;padding:8px 12px;border-radius:8px;margin:-6px 0 12px';el.innerHTML=d+' días de alquiler';}
}
function calcPrice(){recalcPPD();}
function chkAvail(){checkAllLineas();}

function saveRes(){
  var nom=document.getElementById('r-nom').value.trim(),tel=document.getElementById('r-tel').value.trim();
  var ini=document.getElementById('r-ini').value,fin=document.getElementById('r-fin').value;
  if(!nom){toast('Nombre del cliente requerido');return;}
  if(!tel){toast('Teléfono requerido');return;}
  var validLineas=lineas.filter(function(l){return l.tipo&&l.talla;});
  if(!validLineas.length){toast('Añade al menos una bicicleta con modelo y talla');return;}
  if(!ini||!fin||ini>fin){toast('Fechas inválidas');return;}
  if(diffD(ini,fin)+1<cfg.minDays){toast('Mínimo '+cfg.minDays+' días');return;}
  var eid=document.getElementById('r-eid').value,eidN=eid?parseInt(eid):null;
  var err='';
  validLineas.forEach(function(l){if(err)return;var cnt=getAvailCount(l.tipo,l.talla,ini,fin,eidN);if(cnt<l.uds){var t=tipos[l.tipo]||{label:l.tipo};err='Sin disponibilidad para '+t.label+' talla '+l.talla+' (disponibles: '+cnt+')';}});
  if(err){toast(err);return;}
  var prim=validLineas[0];
  var freeBikes=getAvailBikes(prim.tipo,prim.talla,ini,fin,eidN);
  var bikeId=freeBikes.length?freeBikes[0].id:null;
  var bikeNum=bikeId?(bikes.find(function(b){return b.id===bikeId;})||{}).numBici||'':'';
  var totalUds=validLineas.reduce(function(s,l){return s+(l.uds||1);},0);
  var res={id:eidN||Date.now(),cliente:nom,tel:tel,email:document.getElementById('r-email').value.trim(),dni:document.getElementById('r-dni').value.trim(),tipo:prim.tipo,talla:prim.talla,uds:totalUds,bikeId:bikeId,bikeNum:bikeNum,lineas:lineas.slice(),bikesAsig:asignadas.slice(),ini:ini,fin:fin,dias:diffD(ini,fin)+1,ppd:parseFloat(document.getElementById('r-ppd').value)||0,total:parseFloat(document.getElementById('r-total').value)||0,precio:parseFloat(document.getElementById('r-total').value)||0,estado:document.getElementById('r-estado').value||'pendiente',notas:document.getElementById('r-notas').value.trim(),ts:new Date().toISOString(),origen:'interno',extras:lineas.reduce(function(s,l){return s.concat((l.extras||[]).map(function(e){return {id:e.id,nombre:e.nombre,icono:e.icono,precio:e.precio,qty:e.qty,lineaTipo:l.tipo,lineaTalla:l.talla};}));},[])}; 
  if(eidN){var ix=reservas.findIndex(function(r){return r.id===eidN;});if(ix>=0)reservas[ix]=res;else reservas.push(res);}else reservas.push(res);
  sR();closeM('mres');toast('Reserva guardada');updBadge();
  if(CV==='dash')renderDash();if(CV==='cal')renderCal();if(CV==='timeline')renderTL();if(CV==='res')renderRes();if(CV==='flota')renderFlota();
}

// ASIGNACION BICICLETA
function renderAsig(){
  var el=document.getElementById('r-bikes-asig');
  if(!asignadas.length){el.innerHTML='<div style="font-size:12px;color:var(--g400);font-style:italic">Sin bicicletas asignadas - se asignarán en la entrega</div>';return;}
  el.innerHTML=asignadas.map(function(b,i){return '<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:#fff;border-radius:8px;border:1px solid var(--g200);margin-bottom:5px"><span style="font-size:16px">'+(tipos[b.tipo]||{icon:'🚲'}).icon+'</span><div style="flex:1"><div style="font-weight:700;font-size:13px">'+esc(b.num)+'</div><div style="font-size:11px;color:var(--g400)">'+(tipos[b.tipo]||{label:b.tipo}).label+' - '+esc(b.talla)+'</div></div><button class="btn bd bxs" onclick="removeAsignada('+i+')">X</button></div>';}).join('');
}
function removeAsignada(i){
  asignadas.splice(i,1);
  renderAsig();
  // Save immediately if editing existing reservation
  if(currentResId){
    var r=reservas.find(function(x){return x.id===currentResId;});
    if(r){
      r.bikesAsig=asignadas.slice();
      if(asignadas.length>0){r.bikeId=asignadas[0].id;r.bikeNum=asignadas[0].num;}
      else{r.bikeId=null;r.bikeNum='';}
      sR();
      if(CV==='res')renderRes();
      toast('Bicicleta desasignada');
    }
  }
}
function assignBike(bike){
  if(asignadas.find(function(a){return a.id===bike.id;})){
    var el=document.getElementById('qra-result');
    if(el)el.innerHTML='<div class="avr ko" style="display:block">'+esc(bike.numBici)+' ya está en la lista</div>';
    return;
  }
  asignadas.push({id:bike.id,num:bike.numBici,tipo:bike.tipo,talla:bike.talla,modelo:bike.modelo||''});
  renderAsig();
  var el=document.getElementById('qra-result');
  if(el)el.innerHTML='<div class="avr ok" style="display:block">✅ '+esc(bike.numBici)+' asignada correctamente</div>';

  // If editing an existing reservation, save immediately without closing the form
  if(currentResId){
    var r=reservas.find(function(x){return x.id===currentResId;});
    if(r){
      r.bikesAsig=asignadas.slice();
      // Update bikeId with first assigned bike
      if(asignadas.length>0){r.bikeId=asignadas[0].id;r.bikeNum=asignadas[0].num;}
      // Auto-advance status when assigning bike
      if(r.estado==='pendiente'){
        r.estado='confirmada';
        toast('🚲 '+bike.numBici+' asignada · Reserva confirmada');
      } else {
        toast('🚲 '+bike.numBici+' asignada y guardada');
      }
      sR();updBadge();
      if(CV==='res')renderRes();
      if(CV==='dash')renderDash();
      if(CV==='cal')renderCal();
      if(CV==='flota')renderFlota();
    }
  } else {
    toast('🚲 '+bike.numBici+' asignada');
  }
}
function clearAsignadas(){asignadas=[];renderAsig();}
function openManualAsign(){renderManList();openM('mmanasign');}
function renderManList(){
  var q=(document.getElementById('man-srch')||{value:''}).value.toLowerCase();
  var ini=document.getElementById('r-ini').value,fin=document.getElementById('r-fin').value;
  var eid=document.getElementById('r-eid').value;
  var eidN=eid?parseInt(eid):null;

  // Modelos válidos de esta reserva
  var validLineas=lineas.filter(function(l){return l.tipo&&l.talla;});

  var list=bikes.filter(function(b){
    // Solo bicis en estado disponible (no averiadas)
    if(!bikeOperativa(b))return false;
    // Solo modelos que coincidan con la reserva
    if(validLineas.length){
      var matches=validLineas.some(function(l){return l.tipo===b.tipo&&l.talla===b.talla;});
      if(!matches)return false;
    }
    // Búsqueda por texto
    if(q)return[b.numBici,b.modelo||'',b.talla].some(function(s){return s.toLowerCase().indexOf(q)>=0;});
    return true;
  });

  var el=document.getElementById('man-list');if(!el)return;

  // Cabecera con modelos esperados
  var headerHtml='';
  if(validLineas.length){
    headerHtml='<div style="padding:8px 12px;background:var(--b50);border-bottom:1px solid var(--b100);font-size:12px;color:var(--b700)">'
      +'<strong>Modelos de esta reserva:</strong> '
      +validLineas.map(function(l){var t=tipos[l.tipo]||{icon:'🚲',label:l.tipo};return t.icon+' '+t.label+' '+l.talla+(l.uds>1?' ×'+l.uds:'');}).join(' · ')
      +'</div>';
  }

  el.innerHTML=headerHtml+(list.length?list.map(function(b){
    var t=tipos[b.tipo]||{icon:'🚲',color:'#999',label:b.tipo};
    var ya=!!asignadas.find(function(a){return a.id===b.id;});
    var thumb=b.icono&&b.icono.indexOf('data:')===0
      ?'<img src="'+b.icono+'" style="width:100%;height:100%;object-fit:cover;border-radius:6px"/>':t.icon;

    // Comprobar si la bici está ocupada en otro reserva que solape con estas fechas
    // (excluyendo la reserva actual que estamos editando)
    var ocupadaPor=null;
    if(ini&&fin){
      reservas.forEach(function(r){
        if(r.estado==='cancelada')return;
        if(eidN&&r.id===eidN)return; // excluir reserva actual
        if(!r.bikesAsig||!r.bikesAsig.length)return;
        var tieneEstaBici=r.bikesAsig.some(function(a){return a.id===b.id;});
        if(tieneEstaBici&&!(fin<r.ini||ini>r.fin)){
          ocupadaPor=r.cliente;
        }
      });
    }

    var estadoBtn='';
    if(ya){
      estadoBtn='<button class="btn bd bxs" onclick="asignadas.splice(asignadas.findIndex(function(a){return a.id==='+b.id+'}),1);renderManList();renderAsig()">Quitar</button>';
    } else if(ocupadaPor){
      estadoBtn='<span style="font-size:11px;color:var(--r500);text-align:right">Asignada a<br>'+esc(ocupadaPor)+'</span>';
    } else {
      estadoBtn='<button class="btn bb bxs" onclick="assignBike(bikes.find(function(x){return x.id==='+b.id+';}));renderManList()">Asignar</button>';
    }

    return '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px solid var(--g100)'+(ya?';background:var(--gr50)':'')+(ocupadaPor&&!ya?';opacity:.6':'')+'"><div style="width:36px;height:36px;background:'+t.color+'18;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;overflow:hidden">'+thumb+'</div>'
      +'<div style="flex:1"><div style="font-weight:700;font-size:13px">'+esc(b.numBici)+(ya?' <span style="font-size:10px;color:var(--gr600);font-weight:700">✓ Asignada</span>':'')+'</div>'
      +'<div style="font-size:11px;color:var(--g400)">'+t.label+' - '+esc(b.talla)+' - '+esc(b.modelo||'')
+'</div><div style="margin-top:2px"><span style="font-size:10px;font-weight:700;padding:1px 6px;border-radius:4px;background:'+(BIKE_ESTADOS[b.estado]||BIKE_ESTADOS.disponible).bg+';color:'+(BIKE_ESTADOS[b.estado]||BIKE_ESTADOS.disponible).txt+'">'+(BIKE_ESTADOS[b.estado]||BIKE_ESTADOS.disponible).icon+' '+(BIKE_ESTADOS[b.estado]||BIKE_ESTADOS.disponible).lbl+'</span></div></div>'
      +estadoBtn+'</div>';
  }).join(''): emptyHTML('🚲',validLineas.length?'No hay bicis disponibles de ese modelo y talla':'Sin bicicletas'));
}

// QR ASIGNACION
var qraStream=null, qraAnim=null, qraOn=false;

function qraStatus(msg, type){
  var el=document.getElementById('qra-status');
  if(!el)return;
  if(!msg){el.style.display='none';return;}
  var bg={'ok':'#f0fdf4','warn':'#fffbeb','err':'#fef2f2'}[type]||'#fffbeb';
  var cl={'ok':'#15803d','warn':'#b45309','err':'#dc2626'}[type]||'#b45309';
  el.style.cssText='display:block;padding:10px 14px;border-radius:10px;font-size:13px;margin-bottom:12px;background:'+bg+';color:'+cl;
  el.innerHTML=msg;
}

// Entrada principal: detecta protocolo y elige método
function iniciarEscanerQR(){
  qraStatus('','');
  // BarcodeDetector nativo — funciona sin internet en Chrome/Android
  if(window.BarcodeDetector){
    var bd=new BarcodeDetector({formats:['qr_code','aztec','data_matrix','code_128','ean_13']});
    // Try live camera first
    if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&window.location.protocol!=='file:'){
      startQRa();
    } else {
      // file:// or no getUserMedia — use photo with BarcodeDetector
      document.getElementById('qra-file').click();
    }
  } else if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&window.location.protocol!=='file:'){
    // No BarcodeDetector but have getUserMedia — try live + jsQR
    startQRa();
  } else {
    // Last resort: photo input (always works)
    document.getElementById('qra-file').click();
  }
}

function openQRAsign(){
  document.getElementById('qra-inp').value='';
  document.getElementById('qra-result').innerHTML='';
  qraStatus('','');
  openM('mqrasign');
}

function startQRa(){
  if(qraOn)return;
  var wrap=document.getElementById('qrwrap');
  var bstop=document.getElementById('bstpqr');
  qraStatus('Activando cámara...','ok');
  var constraints={video:{facingMode:{ideal:'environment'},width:{ideal:1280}}};
  navigator.mediaDevices.getUserMedia(constraints)
    .catch(function(){return navigator.mediaDevices.getUserMedia({video:true});})
    .then(function(stream){
      qraStream=stream;
      var v=document.getElementById('qrv');
      v.srcObject=stream; v.muted=true; v.setAttribute('playsinline','');
      var p=v.play(); if(p&&p.catch)p.catch(function(){v.muted=true;v.play();});
      if(wrap){wrap.style.display='block';wrap.classList.add('on');}
      if(bstop)bstop.style.display='block';
      qraOn=true;
      qraStatus('📷 Apunta al código QR','ok');
      tickQRa();
    })
    .catch(function(){
      // Camera failed silently — use photo
      qraOn=false;
      if(wrap)wrap.style.display='none';
      document.getElementById('qra-file').click();
    });
}

function stopQRa(){
  if(qraStream){qraStream.getTracks().forEach(function(t){t.stop();});qraStream=null;}
  if(qraAnim){cancelAnimationFrame(qraAnim);qraAnim=null;}
  var v=document.getElementById('qrv'); if(v)v.srcObject=null;
  var wrap=document.getElementById('qrwrap'); if(wrap){wrap.style.display='none';wrap.classList.remove('on');}
  var bstop=document.getElementById('bstpqr'); if(bstop)bstop.style.display='none';
  qraOn=false;
}

function tickQRa(){
  var v=document.getElementById('qrv'),c2=document.getElementById('qrc2');
  if(!v||!c2)return;
  var ctx=c2.getContext('2d');
  if(v.readyState===v.HAVE_ENOUGH_DATA){
    c2.width=v.videoWidth; c2.height=v.videoHeight;
    ctx.drawImage(v,0,0);
    // Try BarcodeDetector on canvas
    if(window.BarcodeDetector){
      var bd=new BarcodeDetector({formats:['qr_code','aztec','data_matrix','code_128']});
      bd.detect(c2).then(function(codes){
        if(codes&&codes.length){stopQRa();processQRAsign(codes[0].rawValue);}
      }).catch(function(){});
    } else if(typeof jsQR!=='undefined'){
      try{
        var img=ctx.getImageData(0,0,c2.width,c2.height);
        var code=jsQR(img.data,img.width,img.height,{inversionAttempts:'attemptBoth'});
        if(code&&code.data){stopQRa();processQRAsign(code.data);return;}
      }catch(e){}
    }
  }
  if(qraOn)qraAnim=requestAnimationFrame(tickQRa);
}

// Procesar imagen capturada con la cámara
function scanQRaFromFile(event){
  var file=event.target.files&&event.target.files[0];
  if(!file)return;
  qraStatus('Analizando imagen...','ok');
  var reader=new FileReader();
  reader.onload=function(ev){
    var img=new Image();
    img.onload=function(){
      // Method 1: BarcodeDetector (native, no internet needed)
      if(window.BarcodeDetector){
        var bd=new BarcodeDetector({formats:['qr_code','aztec','data_matrix','code_128','ean_13']});
        bd.detect(img).then(function(codes){
          event.target.value='';
          if(codes&&codes.length){qraStatus('','');processQRAsign(codes[0].rawValue);}
          else{tryJsQROnImage(img,event);}
        }).catch(function(){tryJsQROnImage(img,event);});
      } else {
        tryJsQROnImage(img,event);
      }
    };
    img.onerror=function(){qraStatus('No se pudo leer la imagen.','err');event.target.value='';};
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
}

function tryJsQROnImage(img,event){
  if(typeof jsQR==='undefined'){
    qraStatus('No se detectó QR. Prueba a introducir el número manualmente.','warn');
    if(event)event.target.value='';
    return;
  }
  var scales=[1,1.5,0.75,0.5];
  for(var si=0;si<scales.length;si++){
    var sc=scales[si];
    var canvas=document.createElement('canvas');
    canvas.width=Math.round(img.naturalWidth*sc)||Math.round(img.width*sc);
    canvas.height=Math.round(img.naturalHeight*sc)||Math.round(img.height*sc);
    if(canvas.width<10)continue;
    var ctx=canvas.getContext('2d');
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
    var id=ctx.getImageData(0,0,canvas.width,canvas.height);
    var modes=['attemptBoth','dontInvert','onlyInvert'];
    for(var mi=0;mi<modes.length;mi++){
      try{var r=jsQR(id.data,id.width,id.height,{inversionAttempts:modes[mi]});if(r&&r.data){if(event)event.target.value='';qraStatus('','');processQRAsign(r.data);return;}}catch(e){}
    }
  }
  if(event)event.target.value='';
  qraStatus('No se detectó QR. Intenta con más luz, acércate más y enfoca bien.','err');
}

function processQRAsign(data){
  var raw=data.trim();
  var q=raw.toUpperCase();
  var resEl=document.getElementById('qra-result');

  // Mostrar siempre el texto detectado
  if(resEl)resEl.innerHTML='<div style="padding:7px 10px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;font-size:12px;color:#0369a1;margin-bottom:8px">🔍 Detectado: <strong>'+esc(raw)+'</strong></div>';

  // Búsqueda exacta primero, luego parcial
  var bike=bikes.find(function(b){
    var fields=[b.numBici||'',b.qr||'',b.numSerie||''].map(function(s){return s.toUpperCase();});
    if(fields.indexOf(q)>=0)return true;
    return fields.some(function(f){return f.length>2&&(f.indexOf(q)>=0||q.indexOf(f)>=0);});
  });

  if(!bike){
    if(resEl)resEl.innerHTML+='<div class="avr ko" style="display:block">❌ No encontrada con texto: <strong>'+esc(raw)+'</strong><br><small>Copia este texto en el campo QR de la ficha de la bici, o introdúcelo manualmente abajo.</small></div>';
    var inp=document.getElementById('qra-inp');
    if(inp)inp.value=raw;
    return;
  }

  var validLineas=lineas.filter(function(l){return l.tipo&&l.talla;});
  if(validLineas.length){
    var matches=validLineas.some(function(l){return l.tipo===bike.tipo&&l.talla===bike.talla;});
    if(!matches){
      var t=tipos[bike.tipo]||{label:bike.tipo};
      var esperados=validLineas.map(function(l){var tl=tipos[l.tipo]||{label:l.tipo};return tl.label+' '+l.talla;}).join(', ');
      if(resEl)resEl.innerHTML+='<div class="avr ko" style="display:block">⚠️ '+esc(bike.numBici)+' es '+t.label+' '+esc(bike.talla)+' — no coincide.<br><small>Esperados: '+esc(esperados)+'</small></div>';
      return;
    }
  }
  assignBike(bike);
}
function doQRaManual(){var v=document.getElementById('qra-inp').value.trim();if(v)processQRAsign(v);}

// RESERVAS LIST
var resF='all';
var resSort='ini';
var resSortDir=1;
var resSel=[];
var resFiltroFechaOn=false;

function aplicarFiltroFechas(){
  renderRes();
  if(vistaTabla)renderTablaRes();
}

function toggleDateRow(){
  resFiltroFechaOn=!resFiltroFechaOn;
  var row=document.getElementById('res-date-row');
  var btn=document.getElementById('btn-cal-filter');
  if(row) row.style.display=resFiltroFechaOn?'flex':'none';
  if(btn){
    btn.style.background=resFiltroFechaOn?'var(--te600)':'#fff';
    btn.style.color=resFiltroFechaOn?'#fff':'inherit';
    btn.style.borderColor=resFiltroFechaOn?'var(--te600)':'var(--g200)';
  }
  if(!resFiltroFechaOn){
    var fi=document.getElementById('res-fini');
    var ff=document.getElementById('res-ffin');
    if(fi)fi.value='';if(ff)ff.value='';
    renderRes();
  }
}

function setFechaPreset(preset){
  var today=todayS();
  var fi=document.getElementById('res-fini');
  var ff=document.getElementById('res-ffin');
  if(!fi||!ff)return;
  if(preset==='clear'){fi.value='';ff.value='';renderRes();return;}
  if(preset==='today'){fi.value=today;ff.value=today;}
  else if(preset==='week'){
    var d=new Date();var dow=(d.getDay()+6)%7;
    fi.value=addD(today,-dow);ff.value=addD(fi.value,6);
  }
  else if(preset==='month'){
    var now=new Date();
    fi.value=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-01';
    var last=new Date(now.getFullYear(),now.getMonth()+1,0);
    ff.value=isoD(last);
  }
  else if(preset==='next30'){fi.value=today;ff.value=addD(today,30);}
  renderRes();
}

function getFechaFilter(){
  if(!resFiltroFechaOn)return null;
  var fi=(document.getElementById('res-fini')||{value:''}).value;
  var ff=(document.getElementById('res-ffin')||{value:''}).value;
  if(!fi&&!ff)return null;
  return{ini:fi||'0000-00-00',fin:ff||'9999-99-99'};
}

function setRF(v,btn){resF=v;document.querySelectorAll('#v-res .ftab').forEach(function(b){b.classList.remove('on');});btn.classList.add('on');resSel=[];renderRes();}

function setSort(field,btn){
  if(resSort===field){resSortDir*=-1;}else{resSort=field;resSortDir=1;}
  // Update button styles
  document.querySelectorAll('.sort-btn').forEach(function(b){
    b.style.background='#fff';b.style.color='var(--g700)';b.style.borderColor='var(--g300)';
  });
  btn.style.background='var(--g900)';btn.style.color='#fff';btn.style.borderColor='var(--g900)';
  // Update sort icon
  ['ini','fin','ts','cli','total'].forEach(function(f){
    var ico=document.getElementById('sort-'+f+'-ico');
    if(ico)ico.textContent=resSort===f?(resSortDir===1?'↑':'↓'):'';
  });
  renderRes();
}

function sortReservas(list){
  // Próximas entregas always sorted by start date ascending
  if(resF==='proxima_entrega') return list.slice().sort(function(a,b){return a.ini.localeCompare(b.ini);});
  return list.slice().sort(function(a,b){
    var va,vb;
    if(resSort==='ini'){va=a.ini||'';vb=b.ini||'';}
    else if(resSort==='fin'){va=a.fin||'';vb=b.fin||'';}
    else if(resSort==='ts'){va=a.ts||'';vb=b.ts||'';}
    else if(resSort==='cli'){va=(a.cliente||'').toLowerCase();vb=(b.cliente||'').toLowerCase();}
    else if(resSort==='total'){va=a.total||0;vb=b.total||0;}
    else{va=b.id;vb=a.id;}
    if(va<vb)return -resSortDir;
    if(va>vb)return resSortDir;
    return 0;
  });
}

function renderRes(){
  var q=(document.getElementById('rsrch')||{value:''}).value.toLowerCase();
  var fechaF=getFechaFilter();
  var list=reservas.filter(function(r){
    if(resF!=='all'){
      var _manana=new Date();_manana.setDate(_manana.getDate()+1);var _ms=_manana.toISOString().slice(0,10);
      if(resF==='proxima_entrega'){
        if(r.estado!=='confirmada'||r.ini<_ms)return false;
      } else if(resF==='transito'){
        if(['transito_furgo','transito_carlos','transito_seur'].indexOf(r.estado)<0)return false;
      } else {
        if(r.estado!==resF)return false;
      }
    }
    if(q&&![r.cliente,r.tel,r.email||'',r.bikeNum||'',r.tipo,r.lugarIni||'',r.lugarFin||''].some(function(s){return(s||'').toLowerCase().indexOf(q)>=0;}))return false;
    if(fechaF){
      // show reservations that START on/after 'desde' AND END on/before 'hasta'
      var rIni=r.ini||'',rFin=r.fin||'';
      if(fechaF.ini!=='0000-00-00'&&rIni<fechaF.ini)return false;
      if(fechaF.fin!=='9999-99-99'&&rFin>fechaF.fin)return false;
    }
    return true;
  });
  list=sortReservas(list);
  var cl=document.getElementById('rcount');
  var totalSel=resSel.length;
  var fechaF3=getFechaFilter();
  var fechaLbl=fechaF3?(' · 📅'+(fechaF3.ini!=='0000-00-00'?' ini≥'+fmtD(fechaF3.ini):'')+( fechaF3.fin!=='9999-99-99'?' fin≤'+fmtD(fechaF3.fin):'')):'';
  if(cl)cl.textContent=list.length+' reserva'+(list.length!==1?'s':'')+fechaLbl+(totalSel?' · '+totalSel+' seleccionada'+(totalSel!==1?'s':''):'');

  // Batch bar
  var bar=document.getElementById('res-batch-bar');
  if(bar){bar.style.display=totalSel>0?'flex':'none';}
  var sc2=document.getElementById('res-sel-count');
  if(sc2)sc2.textContent=totalSel+' seleccionada'+(totalSel!==1?'s':'');

  var el=document.getElementById('rlist');if(!el)return;
  if(!list.length){el.innerHTML=emptyHTML('📋','Sin reservas');return;}

  var today=todayS();
  el.innerHTML=list.map(function(r){
    var sc=SCFG[r.estado]||{lbl:r.estado,cls:'bn-gray'};
    var t=tipos[r.tipo]||{icon:'🚲',label:r.tipo};
    var hasBike=r.bikesAsig&&r.bikesAsig.length>0;
    var bikesLine=r.lineas&&r.lineas.length>1
      ?r.lineas.map(function(l){var tl=tipos[l.tipo]||{label:l.tipo};return tl.label+' '+esc(l.talla)+(l.uds>1?' x'+l.uds:'');}).join(' | ')
      :t.label+' '+esc(r.talla)+(r.uds>1?' x'+r.uds:'');
    var sel=resSel.indexOf(r.id)>=0;
    var isHoy=r.ini===today;
    var isEntrando=r.fin===today;
    var isPrep=prepararIds.some(function(x){return x==r.id;});
    var rowBg=sel?'background:rgba(37,99,235,.07);border-left:4px solid var(--b500)':
               isPrep?'background:#dbeafe;border-left:4px solid #2563eb':
               isHoy?'background:rgba(20,184,166,.06);border-left:4px solid var(--te500)':
               isEntrando?'background:rgba(239,68,68,.05);border-left:4px solid var(--r500)':'border-left:4px solid transparent';
    return '<div class="trow" style="cursor:pointer;'+rowBg+';align-items:flex-start" onclick="toggleSel('+r.id+',event)">'
      // Checkbox
      +'<div style="flex-shrink:0;padding-top:2px;margin-right:2px">'
        +'<div style="width:18px;height:18px;border-radius:4px;border:2px solid '+(sel?'var(--b600)':'var(--g300)')+';background:'+(sel?'var(--b600)':'#fff')+';display:flex;align-items:center;justify-content:center;pointer-events:none">'
          +(sel?'<span style="color:#fff;font-size:11px;font-weight:900;line-height:1">✓</span>':'')
        +'</div>'
      +'</div>'
      // Icon
      +'<span style="font-size:20px;flex-shrink:0;padding-top:1px">'+t.icon+'</span>'
      // Info
      +'<div class="trow-info">'
        +'<div class="trow-main">'
          +esc(r.cliente)
          +(r.origen==='publico'?' <span style="font-size:10px;background:rgba(20,184,166,.1);color:var(--te600);padding:1px 6px;border-radius:4px">Web</span>':'')
          +(isHoy?' <span style="font-size:10px;background:#dcfce7;color:#15803d;padding:1px 6px;border-radius:4px;font-weight:700">ENTRADA HOY</span>':'')
          +(isEntrando?' <span style="font-size:10px;background:#fee2e2;color:#991b1b;padding:1px 6px;border-radius:4px;font-weight:700">SALIDA HOY</span>':'')
        +'</div>'
        +'<div class="trow-sub">'
          +'<span>📅 '+fmtD(r.ini)+' → '+fmtD(r.fin)+'</span>'
          +'<span>⏱️ '+r.dias+' días</span>'
          +'<span>'+bikesLine+'</span>'
          +(r.lugarIni?'<span>📍 '+esc(r.lugarIni)+'</span>':'')
          +(r.dirEntrega?'<span>🚚 '+esc(r.dirEntrega)+'</span>':'')
          +'<span>🏁 '+esc(r.lugarFin||'Santiago de Compostela')+'</span>'
          +(r.total?'<span style="font-weight:700;color:var(--te600)">'+r.total+cfg.currency+'</span>':'')
          +(hasBike?'<span style="color:var(--gr600)">🚲 '+r.bikesAsig.map(function(b){return esc(b.num);}).join(', ')+'</span>':'<span style="color:var(--am500)">⚠️ Sin asignar</span>')
        +'</div>'
      +'</div>'
      // Actions
      +'<div class="trow-acts" onclick="event.stopPropagation()">'
        +'<span class="badge '+sc.cls+'"><span class="bdot"></span>'+sc.lbl+'</span>'
        +'<button class="btn bs bxs" onclick="showResDetail('+r.id+')">Ver</button>'
        +'<button class="btn bs bxs" onclick="openEditRes('+r.id+')">✏️</button>'
        +'<button class="btn bd bxs" onclick="delRes('+r.id+')">🗑️</button>'
        +'<button type="button" onclick="togglePreparar('+r.id+')" class="btn bxs" style="padding:3px 7px;border:1px solid '+(isPrep?'#7c3aed':'#c4b5fd')+';background:'+(isPrep?'#7c3aed':'#faf5ff')+';color:'+(isPrep?'#fff':'#6d28d9')+';font-size:11px;font-weight:700">🔧 '+(isPrep?'Prep.':'Preparar')+'</button>'
      +'</div>'
    +'</div>';
  }).join('');
}

// Selection
function toggleSel(id,event){
  // If clicking on action buttons, don't toggle
  if(event&&event.target.closest&&event.target.closest('.trow-acts'))return;
  var idx=resSel.indexOf(id);
  if(idx>=0)resSel.splice(idx,1);else resSel.push(id);
  renderRes();
}
function selAll(){
  var q=(document.getElementById('rsrch')||{value:''}).value.toLowerCase();
  var list=reservas.filter(function(r){
    if(resF!=='all'){
      var _manana=new Date();_manana.setDate(_manana.getDate()+1);var _ms=_manana.toISOString().slice(0,10);
      if(resF==='proxima_entrega'){
        if(r.estado!=='confirmada'||r.ini<_ms)return false;
      } else if(resF==='transito'){
        if(['transito_furgo','transito_carlos','transito_seur'].indexOf(r.estado)<0)return false;
      } else {
        if(r.estado!==resF)return false;
      }
    }
    if(q)return[r.cliente,r.tel,r.email||'',r.tipo,r.lugarIni||'',r.lugarFin||''].some(function(s){return(s||'').toLowerCase().indexOf(q)>=0;});
    return true;
  });
  resSel=list.map(function(r){return r.id;});
  renderRes();
}
function selNone(){resSel=[];renderRes();}

// Batch actions
function batchStatus(st){
  if(!resSel.length)return;
  var n=0;
  resSel.forEach(function(id){
    var r=reservas.find(function(x){return x.id===id;});
    if(r&&r.estado!==st){r.estado=st;n++;}
  });
  sR();resSel=[];renderRes();renderDash();updBadge();
  var L={confirmada:'Confirmadas',activa:'Activadas',finalizada:'Finalizadas',cancelada:'Canceladas'};
  toast(n+' reservas '+( L[st]||st));
}
function batchDelete(){
  if(!resSel.length)return;
  if(!window.confirm('Eliminar '+resSel.length+' reserva'+(resSel.length!==1?'s':'')+' seleccionada'+(resSel.length!==1?'s':'')+'?'))return;
  reservas=reservas.filter(function(r){return resSel.indexOf(r.id)<0;});
  sR();resSel=[];renderRes();renderDash();updBadge();
  toast('Reservas eliminadas');
}
function batchExport(){
  if(!resSel.length)return;
  var selRes=reservas.filter(function(r){return resSel.indexOf(r.id)>=0;});
  var rows=[CSV_HEADERS.join(',')].concat(selRes.map(reservaToCSVRow));
  downloadText(rows.join('\n'),'reservas_seleccion_'+todayS()+'.csv','text/csv;charset=utf-8');
  toast('Exportadas '+selRes.length+' reservas');
}
function delRes(id){var r=reservas.find(function(x){return x.id===id;});if(!r||!window.confirm('Eliminar reserva de '+r.cliente+'?'))return;reservas=reservas.filter(function(x){return x.id!==id;});sR();renderRes();updBadge();if(CV==='dash')renderDash();if(CV==='cal')renderCal();toast('Reserva eliminada');}
function updBadge(){var n=reservas.filter(function(r){return r.estado==='pendiente';}).length;var b=document.getElementById('pbadge');b.textContent=n;b.classList.toggle('hidden',!n);}
function abrirTransito(resId) {
  var html = '<div style="padding:16px">'
    + '<div style="font-size:14px;font-weight:700;margin-bottom:14px">¿Con quién va la bicicleta?</div>'
    + '<div style="display:flex;flex-direction:column;gap:8px">'
    + '<button onclick="changeStatus('+resId+',\'transito_furgo\');closeM(\'m-transito\')" style="padding:12px;background:#f0fdf4;border:2px solid #86efac;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;text-align:left">🚐 Furgo</button>'
    + '<button onclick="changeStatus('+resId+',\'transito_carlos\');closeM(\'m-transito\')" style="padding:12px;background:#eff6ff;border:2px solid #93c5fd;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;text-align:left">🚗 Carlos</button>'
    + '<button onclick="changeStatus('+resId+',\'transito_seur\');closeM(\'m-transito\')" style="padding:12px;background:#fef3c7;border:2px solid #fcd34d;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;text-align:left">📦 Seur</button>'
    + '</div></div>';
  document.getElementById('m-transito-body').innerHTML = html;
  openM('m-transito');
}


function changeStatus(id,st,extra){
  var r=reservas.find(function(x){return x.id===id;});
  if(!r)return;
  r.estado=st;
  if(extra) Object.assign(r,extra);
  // When recogida — mark bike as available
  if(st==='recogida'&&r.bikesAsig&&r.bikesAsig.length){
    r.bikesAsig.forEach(function(a){
      var b=bikes.find(function(x){return x.id===a.id;});
      if(b){b.estado='disponible';DB.saveBici(b).catch(function(e){console.error(e);});}
    });
  }
  sR();closeM('mdetail');updBadge();
  var sc=SCFG[st]||{lbl:st,icon:''};
  toast((sc.icon||'')+'  Estado: '+sc.lbl);
  renderRes();renderDash();if(CV==='flota')renderFlota();
}
function showResDetail(id){
  var r=reservas.find(function(x){return x.id===id;});if(!r)return;
  var sc=SCFG[r.estado]||{lbl:r.estado,cls:'bn-gray'};
  var t=tipos[r.tipo]||{icon:'🚲',label:r.tipo,color:'#999'};
  var hasBike=r.bikesAsig&&r.bikesAsig.length>0;
  var bikesLine=r.lineas&&r.lineas.length>1?r.lineas.map(function(l){var tl=tipos[l.tipo]||{label:l.tipo};return tl.label+' talla '+esc(l.talla)+(l.uds>1?' x'+l.uds:'');}).join(', '):t.label+' '+esc(r.talla)+(r.uds>1?' x'+r.uds:'');
  var fields=[['Entrada',fmtD(r.ini)],['Salida',fmtD(r.fin)],['Duración',r.dias+' días'],['📍 Inicio',esc(r.lugarIni||'-')],['🏁 Finalización',esc(r.lugarFin||'Santiago de Compostela')],['🚚 Dir. entrega',esc(r.dirEntrega||'-')],['Bicicleta(s)',bikesLine],['Asignada(s)',hasBike?r.bikesAsig.map(function(b){return b.num;}).join(', '):'Sin asignar'],['Total',r.total?(r.total+cfg.currency):'-'],['Origen',r.origen==='publico'?'Portal web':'Interno']];
  document.getElementById('mdetail-body').innerHTML='<div style="display:flex;align-items:center;gap:12px;margin-bottom:18px"><div style="width:50px;height:50px;background:'+t.color+'18;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0">'+t.icon+'</div><div style="flex:1"><div style="font-family:var(--fontd);font-size:18px;font-weight:700">'+esc(r.cliente)+'</div><div style="font-size:13px;color:var(--g400)">'+esc(r.tel)+(r.email?' - '+esc(r.email):'')+(r.dni?' - DNI: '+esc(r.dni):'')+'</div></div><span class="badge '+sc.cls+'"><span class="bdot"></span>'+sc.lbl+'</span></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:14px">'+fields.map(function(f){return '<div style="background:var(--g50);border-radius:8px;padding:9px 12px"><div style="font-size:10px;font-weight:700;color:var(--g400);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">'+f[0]+'</div><div style="font-size:14px;font-weight:600;color:'+(f[1]==='Sin asignar'?'var(--am500)':'var(--g900)')+'">'+f[1]+'</div></div>';}).join('')+'</div>'+(r.notas?'<div style="background:var(--am50);border:1px solid var(--am100);border-radius:8px;padding:11px 14px;margin-bottom:8px"><div style="font-size:10px;font-weight:700;color:var(--am600);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">Notas</div><div style="font-size:13px">'+esc(r.notas)+'</div></div>':'')+
  (r.extras&&r.extras.length?'<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:11px 14px"><div style="font-size:10px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">🎒 Extras</div>'+r.extras.map(function(e){return '<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:13px"><span>'+e.icono+'</span><span style="flex:1">'+esc(e.nombre)+(e.lineaTipo?'<span style="font-size:10px;color:var(--g400);margin-left:4px">('+esc((tipos[e.lineaTipo]||{label:e.lineaTipo}).label)+' '+esc(e.lineaTalla||'')+')</span>':'')+'</span><span style="color:var(--g500)">×'+(e.qty||1)+'</span><span style="font-weight:700;color:#0d9488">'+(( e.precio||0)*(e.qty||1)).toFixed(0)+cfg.currency+'</span></div>';}).join('')+'</div>':'');
  var _estadosBtns = '';
  var st = r.estado;
  // Sequential state transitions
  if(st==='pendiente')      _estadosBtns+='<button class="btn bb bsm" onclick="changeStatus('+r.id+',\'confirmada\')">✅ Confirmar</button>';
  if(st==='confirmada')     _estadosBtns+='<button class="btn bb bsm" onclick="changeStatus('+r.id+',\'proxima_entrega\')">📅 Próxima entrega</button>';
  if(st==='proxima_entrega')_estadosBtns+='<button class="btn bb bsm" onclick="changeStatus('+r.id+',\'en_preparacion\')">🔧 En preparación</button>';
  if(st==='en_preparacion') _estadosBtns+='<button class="btn bb bsm" onclick="changeStatus('+r.id+',\'preparada\')">📦 Preparada</button>';
  if(st==='preparada')      _estadosBtns+='<button class="btn bb bsm" onclick="abrirTransito('+r.id+')">🚐 Tránsito</button>';
  if(st==='transito_furgo'||st==='transito_carlos'||st==='transito_seur') _estadosBtns+='<button class="btn bb bsm" onclick="changeStatus('+r.id+',\'entregada\')">🏁 Entregada</button>';
  if(st==='entregada')      _estadosBtns+='<button class="btn bb bsm" onclick="changeStatus('+r.id+',\'alquiler\')">🚲 Alquiler</button>';
  if(st==='alquiler')       _estadosBtns+='<button class="btn bb bsm" onclick="changeStatus('+r.id+',\'pendiente_recoger\')">🔔 Pend. recoger</button>';
  if(st==='pendiente_recoger') _estadosBtns+='<button class="btn bb bsm" onclick="changeStatus('+r.id+',\'recogida\')">✔️ Recogida</button>';
  // Factura always available for relevant states
  if(['confirmada','proxima_entrega','en_preparacion','preparada','transito_furgo','transito_carlos','transito_seur','entregada','alquiler','pendiente_recoger','recogida'].indexOf(st)>=0)
    _estadosBtns+='<button class="btn bi bsm" onclick="closeM(\'mdetail\');genFactFromRes('+r.id+')">🧾 Factura</button>';
  if(st!=='cancelada'&&st!=='anulada') _estadosBtns+='<button class="btn bd bsm" onclick="changeStatus('+r.id+',\'cancelada\')">❌ Cancelar</button>';
  document.getElementById('mdetail-ftr').innerHTML='<div style="display:flex;gap:6px;flex-wrap:wrap;width:100%"><button class="btn bs bsm" onclick="closeM(\'mdetail\')">Cerrar</button><button class="btn bs bsm" onclick="closeM(\'mdetail\');openEditRes('+r.id+')">Editar</button><button class="btn ba bsm" onclick="closeM(\'mdetail\');openEditRes('+r.id+');setTimeout(openQRAsign,200)">Asignar bici</button>'+_estadosBtns+'</div>';
  openM('mdetail');
}

// CALENDARIO ANUAL GANTT (dias en horizontal, bicis en vertical)
var calY=new Date().getFullYear(), calTF='all';
function calYear(dir){calY+=dir;renderCal();}
function calNow(){calY=new Date().getFullYear();renderCal();}
function renderCalTF(){
  var el=document.getElementById('cal-tf');if(!el)return;
  el.innerHTML='<button class="btn bsm '+(calTF==='all'?'bp':'bs')+'" onclick="calTF=\'all\';renderCal()">Todos</button>'+
    Object.keys(tipos).map(function(k){var t=tipos[k];
      return '<button class="btn bsm" style="'+(calTF===k?'background:'+t.color+';color:#fff;border:none':'background:#fff;border:1px solid var(--g200);color:var(--g600)')+'" onclick="calTF=\''+k+'\';renderCal()">'+t.icon+' '+t.label+'</button>';
    }).join('');
}

function renderCal(){
  renderCalTF();
  var yl=document.getElementById('cal-year-lbl');if(yl)yl.textContent=calY;
  var today=todayS();
  var el=document.getElementById('cal-annual');if(!el)return;

  // All days of the year
  var days=[];
  var d=new Date(calY,0,1);
  while(d.getFullYear()===calY){days.push(isoD(d));d.setDate(d.getDate()+1);}
  var totalDays=days.length;

  // Month header spans
  var MSHORT=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  var monthStarts=[];
  for(var m=0;m<12;m++){
    var mD=isoD(new Date(calY,m,1));
    var idx=days.indexOf(mD);
    if(idx>=0)monthStarts.push({m:m,idx:idx,label:MSHORT[m]});
  }

  // Bike rows grouped by tipo+talla
  var bikeList=[];
  Object.keys(tipos).forEach(function(k){
    if(calTF!=='all'&&calTF!==k)return;
    var t=tipos[k];
    var tallasOrden=t.sizes||[];
    var bikesTipo=bikes.filter(function(b){return b.tipo===k;});
    bikesTipo.sort(function(a,b2){
      var ia=tallasOrden.indexOf(a.talla),ib=tallasOrden.indexOf(b2.talla);
      if(ia!==ib)return ia-ib;
      return a.numBici.localeCompare(b2.numBici);
    });
    if(bikesTipo.length){
      bikeList.push({sep:true,label:t.icon+' '+t.label,color:t.color});
      bikesTipo.forEach(function(b){bikeList.push({bike:b,t:t});});
    }
  });

  if(!bikeList.length){el.innerHTML=emptyHTML('🚲','Sin bicicletas en la flota');return;}

  // Pre-build dayBikeMap
  var dayBikeMap={};
  reservas.forEach(function(r){
    if(r.estado==='cancelada')return;
    if(calTF!=='all'&&r.tipo!==calTF)return;
    var col=rcol(r.id);
    for(var di=0;di<days.length;di++){
      var ds=days[di];
      if(ds<r.ini)continue;
      if(ds>r.fin)break;
      if(!dayBikeMap[ds])dayBikeMap[ds]={};
      var key=r.bikeId?r.bikeId:'t_'+r.tipo;
      dayBikeMap[ds][key]={col:col,resId:r.id,isIni:ds===r.ini,isFin:ds===r.fin,isBlq:false};
    }
  });
  bloqueos.forEach(function(b){
    if(calTF!=='all'&&b.tipo!==calTF)return;
    for(var di=0;di<days.length;di++){
      var ds=days[di];
      if(ds<b.ini)continue;
      if(ds>b.fin)break;
      if(!dayBikeMap[ds])dayBikeMap[ds]={};
      bikes.filter(function(bk){return bk.tipo===b.tipo&&bk.talla===b.talla;}).forEach(function(bk){
        dayBikeMap[ds][bk.id]={col:['#fecaca','#991b1b'],isBlq:true,motivo:b.motivo};
      });
    }
  });

  var CW=13;    // cell width px
  var RH=20;    // row height px — compact
  var LW=100;   // label column width px — shorter
  var HDR1=22;  // month header height
  var HDR2=18;  // day header height

  // ── BUILD LEFT COLUMN (labels) ────────────────────────────────────────
  var lhtml='';
  // Blank headers (to align with right column)
  lhtml+='<div style="height:'+HDR1+'px;background:var(--g900);border-right:2px solid rgba(255,255,255,.15)"></div>';
  lhtml+='<div style="height:'+HDR2+'px;background:var(--g800);border-right:2px solid rgba(255,255,255,.15)"></div>';
  // Bike labels
  bikeList.forEach(function(row,ri){
    if(row.sep){
      lhtml+='<div style="height:20px;background:'+row.color+'28;border-top:3px solid '+row.color+';border-right:3px solid '+row.color+';border-bottom:1px solid '+row.color+'88;padding:0 8px;display:flex;align-items:center;font-size:10px;font-weight:700;color:'+row.color+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+row.label+'</div>';
      return;
    }
    var b=row.bike;
    var isAver=b.estado==='averiada';
    var bg=ri%2===0?'#fff':'#f9fafb';
    lhtml+='<div style="height:'+RH+'px;background:'+bg+';border-bottom:2px solid #94a3b8;border-right:3px solid #94a3b8;padding:0 6px;display:flex;align-items:center;gap:4px;box-sizing:border-box">';
    lhtml+='<span style="font-size:11px;flex-shrink:0">'+row.t.icon+'</span>';
    lhtml+='<span style="font-size:11px;font-weight:700;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1">'+esc(b.numBici)+(isAver?' ⚠':'')+'</span>';
    lhtml+='<span style="font-size:10px;color:#6b7280;flex-shrink:0">'+esc(b.talla)+'</span>';
    lhtml+='</div>';
  });

  // ── BUILD RIGHT COLUMN (scrollable calendar grid) ─────────────────────
  var gridW=totalDays*CW;
  var rhtml='';

  // Month header
  rhtml+='<div style="display:flex;height:'+HDR1+'px;background:var(--g900);width:'+gridW+'px">';
  monthStarts.forEach(function(ms,i){
    var nextIdx=i+1<monthStarts.length?monthStarts[i+1].idx:totalDays;
    var span=nextIdx-ms.idx;
    rhtml+='<div style="width:'+(span*CW)+'px;flex-shrink:0;padding:5px 4px;font-size:11px;font-weight:700;color:#fff;border-right:3px solid rgba(255,255,255,.7);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-sizing:border-box">'+ms.label+'</div>';
  });
  rhtml+='</div>';

  // Day numbers header
  rhtml+='<div style="display:flex;height:'+HDR2+'px;background:var(--g800);width:'+gridW+'px">';
  days.forEach(function(ds){
    var dt=toD(ds);
    var day=dt.getDate();
    var dow=(dt.getDay()+6)%7;
    var isWE=dow>=5;
    var isT=ds===today;
    var bg2=isT?'var(--te600)':(isWE?'rgba(239,68,68,.22)':'transparent');
    var fc=isT?'#fff':(isWE?'#fca5a5':'rgba(255,255,255,.45)');
    var fw=isT?'800':(day===1?'700':'400');
    rhtml+='<div style="width:'+CW+'px;flex-shrink:0;text-align:center;font-size:9px;font-weight:'+fw+';color:'+fc+';background:'+bg2+';line-height:'+HDR2+'px;border-right:1px solid rgba(255,255,255,.35);box-sizing:border-box">'+day+'</div>';
  });
  rhtml+='</div>';

  // Bike day rows
  bikeList.forEach(function(row,ri){
    if(row.sep){
      rhtml+='<div style="height:20px;background:'+row.color+'28;border-top:3px solid '+row.color+';border-bottom:1px solid '+row.color+'88;width:'+gridW+'px"></div>';
      return;
    }
    var b=row.bike;
    var bg=ri%2===0?'#fff':'#f9fafb';
    rhtml+='<div style="display:flex;height:'+RH+'px;background:'+bg+';border-bottom:2px solid #94a3b8;width:'+gridW+'px">';
    days.forEach(function(ds){
      var dt2=toD(ds);
      var day2=dt2.getDate();
      var isT2=ds===today;
      var isM1=day2===1;
      var cellData=dayBikeMap[ds]?dayBikeMap[ds][b.id]:null;
      var cbg,lbdr='none',rbdr='none';
      var onclick2='';
      if(isT2){cbg='rgba(13,148,136,.2)';lbdr='1px solid #0d9488';}
      else if(cellData&&cellData.isBlq){cbg='#fecaca';}
      else if(cellData&&!cellData.isBlq){
        cbg=cellData.col[0];
        if(cellData.resId)onclick2=' onclick="showResDetail('+cellData.resId+')" style="cursor:pointer"';
      }
      else{cbg=bg;}
      var borderL=isM1?'border-left:2px solid #475569;':'';
      var dot='';
      if(cellData&&!cellData.isBlq){
        if(cellData.isIni)dot='<div style="position:absolute;top:4px;left:3px;width:5px;height:5px;border-radius:50%;background:#16a34a"></div>';
        else if(cellData.isFin)dot='<div style="position:absolute;top:4px;right:2px;width:5px;height:5px;border-radius:50%;background:#dc2626"></div>';
      }
      var cellBorder=isM1?'border-right:2px solid #475569;':'border-right:1px solid #cbd5e1;';rhtml+='<div'+onclick2+' style="width:'+CW+'px;flex-shrink:0;height:'+RH+'px;background:'+cbg+';position:relative;box-sizing:border-box;'+borderL+cellBorder+'">'+dot+'</div>';
    });
    rhtml+='</div>';
  });

  // ── ASSEMBLE: fixed left + scrolling right ────────────────────────────
  var out='<div style="display:flex;font-family:var(--font);overflow:hidden">';
  // Fixed left column
  out+='<div style="width:'+LW+'px;flex-shrink:0;z-index:3;box-shadow:3px 0 8px rgba(0,0,0,.12)">';
  out+=lhtml;
  out+='</div>';
  // Scrollable right column (synced scroll)
  out+='<div id="cal-scroll" style="overflow-x:auto;flex:1;scroll-behavior:smooth" onscroll="syncCalScroll(this)">';
  out+='<div style="min-width:'+gridW+'px">';
  out+=rhtml;
  out+='</div>';
  out+='</div>';
  out+='</div>';

  // Legend
  out+='<div style="display:flex;gap:16px;padding:10px 14px;background:var(--g50);border-top:1px solid var(--g200);font-size:11px;color:var(--g500);flex-wrap:wrap;align-items:center">';
  out+='<span style="font-weight:700;color:var(--g700)">Leyenda:</span>';
  out+='<span style="display:flex;align-items:center;gap:5px"><span style="width:20px;height:12px;background:#dbeafe;border:1px solid #1d4ed8;border-radius:2px;display:inline-block"></span>Reserva</span>';
  out+='<span style="display:flex;align-items:center;gap:5px"><span style="width:20px;height:12px;background:#fecaca;border-radius:2px;display:inline-block"></span>Bloqueado</span>';
  out+='<span style="display:flex;align-items:center;gap:5px"><span style="width:6px;height:6px;background:#16a34a;border-radius:50%;display:inline-block"></span>Inicio alquiler</span>';
  out+='<span style="display:flex;align-items:center;gap:5px"><span style="width:6px;height:6px;background:#dc2626;border-radius:50%;display:inline-block"></span>Fin alquiler</span>';
  out+='<span style="display:flex;align-items:center;gap:5px"><span style="width:20px;height:12px;background:rgba(13,148,136,.2);border:1px solid #0d9488;border-radius:2px;display:inline-block"></span>Hoy</span>';
  out+='<span style="display:flex;align-items:center;gap:5px"><span style="width:20px;height:12px;border-left:2px solid #cbd5e1;display:inline-block"></span>1º mes</span>';
  out+='</div>';

  el.innerHTML=out;

  // Scroll to show today
  var todayIdx=days.indexOf(today);
  if(todayIdx>=0){
    var sc=document.getElementById('cal-scroll');
    if(sc){
      var targetScroll=Math.max(0,todayIdx*CW-200);
      sc.scrollLeft=targetScroll;
    }
  }
}

function syncCalScroll(el){}  // placeholder for future sync if needed

function openDayM(ds){
  var dt=toD(ds);document.getElementById('mday-tit').textContent=dt.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'});
  var res=reservas.filter(function(r){return r.estado!=='cancelada'&&inRange(ds,r.ini,r.fin);});
  var blq=bloqueos.filter(function(b){return inRange(ds,b.ini,b.fin);});
  var html=blq.map(function(b){var t=tipos[b.tipo]||{label:b.tipo};return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--g100)"><span style="font-size:18px">🔒</span><div style="flex:1"><div style="font-weight:700;font-size:13px">'+esc(b.motivo||'Bloqueo')+'</div><div style="font-size:12px;color:var(--g400)">'+esc(t.label)+' - '+esc(b.talla)+' - x'+b.uds+' bicis - hasta '+fmtDs(b.fin)+'</div></div><span class="badge bn-red"><span class="bdot"></span>Bloqueado</span></div>';}).join('');
  html+=res.map(function(r){var t=tipos[r.tipo]||{icon:'🚲'};var sc=SCFG[r.estado]||{lbl:r.estado,cls:'bn-gray'};var isI=r.ini===ds,isF=r.fin===ds;return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--g100);cursor:pointer" onclick="closeM(\'mday\');showResDetail('+r.id+')"><span style="font-size:18px">'+t.icon+'</span><div style="flex:1"><div style="font-weight:700;font-size:13px">'+esc(r.cliente)+(isI?' <span style="font-size:10px;background:#dcfce7;color:#15803d;padding:1px 5px;border-radius:4px">ENTRADA</span>':'')+(isF?' <span style="font-size:10px;background:#fee2e2;color:#991b1b;padding:1px 5px;border-radius:4px">SALIDA</span>':'')+'</div><div style="font-size:12px;color:var(--g400)">'+(tipos[r.tipo]||{label:r.tipo}).label+' '+esc(r.talla)+' - '+r.dias+' días</div></div><span class="badge '+sc.cls+'"><span class="bdot"></span>'+sc.lbl+'</span></div>';}).join('');
  if(!html)html=emptyHTML('📅','Sin reservas ni bloqueos');
  document.getElementById('mday-body').innerHTML=html;openM('mday');
}


// TIMELINE
function initTLSelects(){var ts=document.getElementById('tl-tipo');if(!ts)return;var pv=ts.value;ts.innerHTML=Object.keys(tipos).map(function(k){var t=tipos[k];return '<option value="'+k+'">'+t.icon+' '+t.label+'</option>';}).join('');if(pv)ts.value=pv;tlTC();}
function tlTC(){var t=tipos[document.getElementById('tl-tipo').value]||{sizes:[]};var ts=document.getElementById('tl-talla');var pv=ts.value;ts.innerHTML='<option value="">Todas</option>'+t.sizes.map(function(s){return '<option value="'+s+'">'+s+'</option>';}).join('');if(pv)ts.value=pv;}
document.getElementById('tl-tipo').addEventListener('change',function(){tlTC();renderTL();});
function renderTL(){
  var tipo=document.getElementById('tl-tipo').value,talla=document.getElementById('tl-talla').value;
  var now=new Date(),DAYS=33,dates=[];
  for(var i=-3;i<DAYS;i++){var d=new Date(now);d.setDate(d.getDate()+i);dates.push(isoD(d));}
  var today2=isoD(now);
  var bList=bikes.filter(function(b){return b.tipo===tipo&&bikeOperativa(b);});
  if(talla)bList=bList.filter(function(b){return b.talla===talla;});
  var el=document.getElementById('tlcont');if(!el)return;
  if(!bList.length){el.innerHTML=emptyHTML('🚲','Sin bicicletas para este filtro');return;}
  var html='<div style="overflow-x:auto"><div class="tl-wrap"><div class="tl-hdr"><div class="tl-bcol">Bicicleta</div><div class="tl-dhdr">'+dates.map(function(d){var dt=toD(d);var isT=d===today2;return '<div class="tl-dh '+(isT?'tday':'')+'"><div>'+dt.getDate()+'</div><div style="font-size:9px">'+['L','M','X','J','V','S','D'][(dt.getDay()+6)%7]+'</div></div>';}).join('')+'</div></div>';
  bList.forEach(function(bike){
    var bRes=reservas.filter(function(r){return r.bikeId===bike.id&&r.estado!=='cancelada';});
    var bBlq=bloqueos.filter(function(b){return b.tipo===bike.tipo&&b.talla===bike.talla;});
    html+='<div class="tl-row"><div class="tl-bc"><div class="tl-bn">'+esc(bike.numBici)+'</div><div class="tl-bm">'+esc(bike.talla)+' - '+esc(bike.modelo||'')+'</div></div><div class="tl-cells">';
    dates.forEach(function(d){var isT=d===today2;html+='<div class="tl-cell '+(isT?'tday':'')+'"></div>';});
    bBlq.forEach(function(bl){var si=dates.indexOf(bl.ini),ei=dates.indexOf(bl.fin);if(si<0&&ei<0)return;var s=Math.max(0,si<0?0:si),e=Math.min(dates.length-1,ei<0?dates.length-1:ei);if(s>dates.length-1)return;var pct=(s/dates.length)*100,w=((e-s+1)/dates.length)*100;html+='<div class="tl-blk" style="left:'+pct+'%;width:'+w+'%;background:#fee2e2;color:#991b1b;border:1px dashed #f87171;cursor:default">🔒 '+esc(bl.motivo||'Bloqueo')+'</div>';});
    bRes.forEach(function(r){var si=dates.indexOf(r.ini),ei=dates.indexOf(r.fin);if(si<0&&ei<0)return;var s=Math.max(0,si<0?0:si),e=Math.min(dates.length-1,ei<0?dates.length-1:ei);if(s>dates.length-1)return;var gs=e+1,ge=Math.min(dates.length-1,e+cfg.gapDays);if(gs<=dates.length-1){var gp=(gs/dates.length)*100,gw=((ge-gs+1)/dates.length)*100;html+='<div class="tl-blk" style="left:'+gp+'%;width:'+gw+'%;background:repeating-linear-gradient(45deg,#f9fafb,#f9fafb 4px,#e5e7eb 4px,#e5e7eb 8px);color:var(--g400);font-size:9px;border:1px dashed var(--g300);cursor:default">prep.</div>';}var col=rcol(r.id);var pct=(s/dates.length)*100,w=((e-s+1)/dates.length)*100;html+='<div class="tl-blk" style="left:'+pct+'%;width:'+w+'%;background:'+col[0]+';color:'+col[1]+'" onclick="showResDetail('+r.id+')" title="'+esc(r.cliente)+'">'+esc(r.cliente.split(' ')[0])+'</div>';});
    html+='</div></div>';
  });
  html+='</div><div style="display:flex;gap:14px;padding:10px 14px;border-top:1px solid var(--g100);font-size:12px;color:var(--g400);flex-wrap:wrap"><span>Leyenda:</span><span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:12px;background:#dbeafe;border:1px solid #1d4ed8;border-radius:3px;display:inline-block"></span>Reserva</span><span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:12px;background:repeating-linear-gradient(45deg,#f9fafb,#f9fafb 3px,#e5e7eb 3px,#e5e7eb 6px);border-radius:3px;display:inline-block"></span>Preparacion ('+cfg.gapDays+' dias)</span><span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:12px;background:#fee2e2;border:1px dashed #f87171;border-radius:3px;display:inline-block"></span>Bloqueado</span></div></div>';
  el.innerHTML=html;
}

// FACTURACION
var factF2='all',currentRes=null,sendFactId=null;
function setFF2(v,btn){factF2=v;document.querySelectorAll('#v-fact .ftab').forEach(function(b){b.classList.remove('on');});btn.classList.add('on');renderFact();}
function renderFact(){
  var q=(document.getElementById('fsrch')||{value:''}).value.toLowerCase();
  var list=facturas.filter(function(f){if(factF2!=='all'&&f.estado!==factF2)return false;if(q)return[f.cliente,f.num,String(f.resId||'')].some(function(s){return(s||'').toLowerCase().indexOf(q)>=0;});return true;}).sort(function(a,b){return b.id-a.id;});
  var cl=document.getElementById('fcount');if(cl)cl.textContent=list.length+' factura'+(list.length!==1?'s':'');
  var pagadas=facturas.filter(function(f){return f.estado==='pagada';}).reduce(function(s,f){return s+(f.total||0);},0);
  var pend=facturas.filter(function(f){return f.estado==='pendiente';}).reduce(function(s,f){return s+(f.total||0);},0);
  var fs=document.getElementById('fact-stats');
  if(fs)fs.innerHTML=[{c:'c-blue',i:'🧾',v:facturas.length,l:'Total facturas'},{c:'c-green',i:'✅',v:pagadas.toFixed(0)+cfg.currency,l:'Cobrado'},{c:'c-amber',i:'⏳',v:pend.toFixed(0)+cfg.currency,l:'Pendiente'}].map(function(s){return '<div class="scard '+s.c+'"><div class="sico">'+s.i+'</div><div class="sval">'+s.v+'</div><div class="slbl">'+s.l+'</div></div>';}).join('');
  var el=document.getElementById('flist');if(!el)return;
  var EST={pendiente:{cls:'bn-amber',lbl:'Pendiente'},pagada:{cls:'bn-green',lbl:'Pagada'},cancelada:{cls:'bn-red',lbl:'Cancelada'}};
  el.innerHTML=list.length?list.map(function(f){var sc=EST[f.estado]||{cls:'bn-gray',lbl:f.estado};return '<div class="fact-row" onclick="viewFact('+f.id+')"><span style="font-size:24px">🧾</span><div class="trow-info"><div class="trow-main"><span style="font-family:var(--fontd);font-weight:700">'+esc(f.num)+'</span> <span style="font-size:12px;font-weight:400;color:var(--g400)">- '+esc(f.cliente)+'</span></div><div class="trow-sub"><span>'+fmtD(f.fecha)+'</span><span>'+f.dias+' dias</span><span>'+f.total+cfg.currency+'</span></div></div><div class="trow-acts"><span class="badge '+sc.cls+'"><span class="bdot"></span>'+sc.lbl+'</span><button class="btn bs bxs" onclick="event.stopPropagation();markFact('+f.id+',\'pagada\')"'+(f.estado==='pagada'?' disabled':'')+'>Cobrar</button><button class="btn bs bxs" onclick="event.stopPropagation();printFactById('+f.id+')">Imprimir</button><button class="btn bp bxs" onclick="event.stopPropagation();openSendFact('+f.id+')">Enviar</button><button class="btn bd bxs" onclick="event.stopPropagation();delFact('+f.id+')">Eliminar</button></div></div>';}).join(''):emptyHTML('🧾','Sin facturas. Genera desde Reservas.');
}
function markFact(id,st){var f=facturas.find(function(x){return x.id===id;});if(!f)return;f.estado=st;sF();renderFact();toast(st==='pagada'?'Factura cobrada':'Actualizado');}
function delFact(id){if(!window.confirm('Eliminar esta factura?'))return;facturas=facturas.filter(function(x){return x.id!==id;});sF();renderFact();toast('Factura eliminada');}
function genFactFromRes(resId){var rid=resId||parseInt(document.getElementById('r-eid').value);var r=reservas.find(function(x){return x.id===rid;});if(!r){toast('Selecciona una reserva');return;}currentRes=r;var num=cfg.fprefix+(facturas.length+1).toString().padStart(3,'0');document.getElementById('f-num').value=num;document.getElementById('f-date').value=todayS();document.getElementById('f-iva').value=cfg.iva||21;document.getElementById('f-epago').value='pendiente';document.getElementById('f-fnotes').value='';document.getElementById('f-send-btn').style.display='none';updateInvPreview();closeM('mdetail');closeM('mres');openM('mfact');}
function updateInvPreview(){
  var r=currentRes;if(!r){document.getElementById('inv-preview').innerHTML=emptyHTML('🧾','Selecciona una reserva');return;}
  var iva=parseFloat(document.getElementById('f-iva').value)||21,t=tipos[r.tipo]||{label:r.tipo,icon:'🚲'},base=r.total||r.precio||0,ivaAmt=base*iva/100,total=base+ivaAmt;
  var bikesLine=r.lineas&&r.lineas.length>1?r.lineas.map(function(l){var tl=tipos[l.tipo]||{label:l.tipo};return tl.label+' talla '+esc(l.talla)+(l.uds>1?' x'+l.uds:'');}).join(', '):t.label+' talla '+esc(r.talla)+(r.uds>1?' x'+r.uds:'');
  var bikesAsig=r.bikesAsig&&r.bikesAsig.length?r.bikesAsig.map(function(b){return b.num;}).join(', '):'Por asignar en recogida';
  var num=document.getElementById('f-num').value||'F-001',dateStr=document.getElementById('f-date').value,notes=document.getElementById('f-fnotes').value;
  var html='<div class="inv-header"><div><div class="inv-company">'+esc(cfg.bizName||'VeloRentas')+'</div>'+(cfg.cif?'<div style="font-size:12px;color:var(--g500)">CIF: '+esc(cfg.cif)+'</div>':'')+(cfg.addr?'<div style="font-size:12px;color:var(--g500)">'+esc(cfg.addr)+'</div>':'')+(cfg.phone?'<div style="font-size:12px;color:var(--g500)">Tel: '+esc(cfg.phone)+'</div>':'')+'</div><div style="text-align:right"><div class="inv-num">'+esc(num)+'</div><div style="font-size:13px;color:var(--g500)">Fecha: '+fmtD(dateStr)+'</div></div></div>';
  html+='<div style="background:var(--g50);border-radius:8px;padding:12px 14px;margin-bottom:16px"><div style="font-size:11px;font-weight:700;color:var(--g500);text-transform:uppercase;margin-bottom:6px">Cliente</div><div style="font-weight:700;font-size:15px">'+esc(r.cliente)+'</div>'+(r.dni?'<div style="font-size:13px;color:var(--g500)">DNI: '+esc(r.dni)+'</div>':'')+(r.tel?'<div style="font-size:13px;color:var(--g500)">Tel: '+esc(r.tel)+'</div>':'')+(r.email?'<div style="font-size:13px;color:var(--g500)">'+esc(r.email)+'</div>':'')+'</div>';
  var lugarIni=r.lugarIni||'';var lugarFin=r.lugarFin||'Santiago de Compostela';var dirEntrega=r.dirEntrega||'';
  var extrasRows=(r.extras||[]).map(function(e){return '<tr><td>'+e.icono+' '+esc(e.nombre)+(e.lineaTipo?'<span style="font-size:11px;color:#6b7280"> ('+esc((tipos[e.lineaTipo]||{label:e.lineaTipo}).label)+' '+esc(e.lineaTalla||'')+')</span>':'')+'</td><td></td><td></td><td style="text-align:center">'+(e.qty||1)+'</td><td style="text-align:right">'+( e.precio||0)+cfg.currency+'</td><td style="text-align:right;font-weight:700">'+(( e.precio||0)*(e.qty||1)).toFixed(0)+cfg.currency+'</td></tr>';}).join('');
  html+='<table class="inv-table"><thead><tr><th>Descripcion</th><th>Ruta</th><th>Fechas</th><th>Dias</th><th>P/dia</th><th>Total</th></tr></thead><tbody><tr><td><strong>Alquiler '+t.icon+' '+esc(bikesLine)+'</strong><div style="font-size:11px;color:#6b7280;margin-top:2px">Bicis: '+esc(bikesAsig)+'</div></td><td style="font-size:12px">'+(lugarIni?'📍 '+esc(lugarIni)+'<br>':'')+'🏁 '+esc(lugarFin)+'</td><td style="font-size:12px">'+fmtD(r.ini)+' - '+fmtD(r.fin)+'</td><td style="text-align:center">'+r.dias+'</td><td style="text-align:right">'+(r.ppd?r.ppd.toFixed(2)+'€':'-')+'</td><td style="text-align:right;font-weight:700">'+base.toFixed(2)+cfg.currency+'</td></tr>'+extrasRows+'</tbody></table>';
  html+='<div class="inv-totals"><div class="inv-total-row"><span>Base imponible:</span><span>'+base.toFixed(2)+cfg.currency+'</span></div><div class="inv-total-row"><span>IVA ('+iva+'%):</span><span>'+ivaAmt.toFixed(2)+cfg.currency+'</span></div><div class="inv-total-final">TOTAL: '+total.toFixed(2)+cfg.currency+'</div></div>';
  if(notes)html+='<div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--g200);font-size:12px;color:var(--g500)">'+esc(notes)+'</div>';
  document.getElementById('inv-preview').innerHTML=html;
}
function saveFactura(){if(!currentRes){toast('Sin reserva asociada');return;}var r=currentRes,iva=parseFloat(document.getElementById('f-iva').value)||21,base=r.total||r.precio||0,total=base+(base*iva/100);var bikesLine=r.lineas&&r.lineas.length>1?r.lineas.map(function(l){var tl=tipos[l.tipo]||{label:l.tipo};return tl.label+' '+l.talla+(l.uds>1?' x'+l.uds:'');}).join(', '):(tipos[r.tipo]||{label:r.tipo}).label+' '+r.talla;facturas.push({id:Date.now(),num:document.getElementById('f-num').value.trim()||cfg.fprefix+'001',fecha:document.getElementById('f-date').value,resId:r.id,cliente:r.cliente,tel:r.tel,email:r.email||'',dni:r.dni||'',tipo:r.tipo,talla:r.talla,modelo:bikesLine,ini:r.ini,fin:r.fin,dias:r.dias,uds:r.uds||1,ppd:r.ppd||0,base:base,iva:iva,ivaAmt:base*iva/100,total:total,bikesAsig:r.bikesAsig||[],lugarIni:r.lugarIni||'',lugarFin:r.lugarFin||'Santiago de Compostela',extras:r.extras||[],estado:document.getElementById('f-epago').value||'pendiente',notas:document.getElementById('f-fnotes').value.trim()});sF();closeM('mfact');currentRes=null;toast('Factura guardada');goV('fact');}
function viewFact(id){var f=facturas.find(function(x){return x.id===id;});if(!f)return;currentRes={id:f.resId||f.id,cliente:f.cliente,tel:f.tel,email:f.email||'',dni:f.dni||'',tipo:f.tipo,talla:f.talla,uds:f.uds||1,ini:f.ini,fin:f.fin,dias:f.dias,ppd:f.ppd||0,total:f.base,precio:f.base,bikesAsig:f.bikesAsig||[]};sendFactId=id;document.getElementById('f-num').value=f.num;document.getElementById('f-date').value=f.fecha;document.getElementById('f-iva').value=f.iva;document.getElementById('f-epago').value=f.estado;document.getElementById('f-fnotes').value=f.notas||'';document.getElementById('f-send-btn').style.display='inline-flex';updateInvPreview();openM('mfact');}
function printFactById(id){var f=facturas.find(function(x){return x.id===id;});if(!f)return;currentRes={id:f.resId||f.id,cliente:f.cliente,tel:f.tel,email:f.email||'',dni:f.dni||'',tipo:f.tipo,talla:f.talla,uds:f.uds||1,ini:f.ini,fin:f.fin,dias:f.dias,ppd:f.ppd||0,total:f.base,precio:f.base,bikesAsig:f.bikesAsig||[]};document.getElementById('f-num').value=f.num;document.getElementById('f-date').value=f.fecha;document.getElementById('f-iva').value=f.iva;document.getElementById('f-epago').value=f.estado;updateInvPreview();setTimeout(printInvoice,200);}
function printInvoice(){var el=document.getElementById('inv-preview');var w=window.open('','_blank','width=900,height=700');w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Factura</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet"><style>body{font-family:Inter,sans-serif;padding:32px;font-size:13px;color:#111}.inv-header{display:flex;justify-content:space-between;margin-bottom:24px;padding-bottom:14px;border-bottom:2px solid #111}.inv-company{font-size:20px;font-weight:800}.inv-num{font-size:22px;font-weight:800;color:#0d9488}.inv-table{width:100%;border-collapse:collapse;margin:16px 0}.inv-table th{background:#f9fafb;padding:8px 10px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;color:#6b7280;border-bottom:2px solid #e5e7eb}.inv-table td{padding:9px 10px;border-bottom:1px solid #f3f4f6}.inv-totals{display:flex;flex-direction:column;align-items:flex-end;gap:3px;margin-top:10px}.inv-total-row{display:flex;gap:40px;font-size:13px;color:#6b7280}.inv-total-final{font-size:20px;font-weight:800;margin-top:4px}</style></head><body>'+el.innerHTML+'<script>window.print();<\/script></body></html>');w.document.close();}

// ENVIO CONFIRMACION
function openSendFact(factId){sendFactId=factId;var f=facturas.find(function(x){return x.id===factId;});if(!f){toast('Factura no encontrada');return;}document.getElementById('send-client-info').innerHTML='<div style="font-weight:700;font-size:14px;margin-bottom:4px">'+esc(f.cliente)+'</div><div style="color:var(--g500)">Tel: '+esc(f.tel||'Sin telefono')+(f.email?' - '+esc(f.email):'')+'</div>';document.getElementById('send-msg').value=buildMsg(f);openM('msend');}
function sendFromModal(){if(!currentRes)return;var f=facturas.find(function(x){return x.resId===currentRes.id;});if(f){openSendFact(f.id);}else{sendFactId=null;document.getElementById('send-client-info').innerHTML='<div style="font-weight:700;font-size:14px;margin-bottom:4px">'+esc(currentRes.cliente)+'</div><div style="color:var(--g500)">Tel: '+esc(currentRes.tel||'')+(currentRes.email?' - '+esc(currentRes.email):'')+'</div>';document.getElementById('send-msg').value=buildMsgRes(currentRes);openM('msend');}}
function buildMsg(f){var t=tipos[f.tipo]||{label:f.tipo,icon:'🚲'};var bikes2=f.bikesAsig&&f.bikesAsig.length?f.bikesAsig.map(function(b){return b.num;}).join(', '):'por asignar en recogida';return ['Hola '+f.cliente+',','','Tu reserva en '+esc(cfg.bizName||'VeloRentas')+' esta CONFIRMADA','','Bicicleta: '+t.icon+' '+esc(f.modelo||t.label),'Entrada: '+fmtD(f.ini),'Devolucion: '+fmtD(f.fin),'Duracion: '+f.dias+' dias','Bicis: '+bikes2,'Total: '+f.total.toFixed(2)+cfg.currency+' (IVA incl.)','Factura: '+f.num,'',(cfg.addr?'Direccion: '+cfg.addr:''),(cfg.phone?'Tel: '+cfg.phone:''),'','Gracias por elegirnos!'].filter(function(l){return l!==undefined;}).join('\n');}
function buildMsgRes(r){var t=tipos[r.tipo]||{label:r.tipo,icon:'🚲'};var bikesLine=r.lineas&&r.lineas.length>1?r.lineas.map(function(l){var tl=tipos[l.tipo]||{label:l.tipo};return tl.label+' talla '+l.talla+(l.uds>1?' x'+l.uds:'');}).join(', '):t.label+' talla '+r.talla;return ['Hola '+r.cliente+',','','Tu reserva esta CONFIRMADA','','Bicicleta(s): '+bikesLine,'Entrada: '+fmtD(r.ini),'Devolucion: '+fmtD(r.fin),'Duracion: '+r.dias+' dias',(r.total?'Total: '+r.total.toFixed(2)+cfg.currency:''),'',(cfg.addr?'Direccion: '+cfg.addr:''),(cfg.phone?'Tel: '+cfg.phone:''),'','Gracias!'].filter(function(l){return l!==undefined;}).join('\n');}
function getSendPhone(){var f=sendFactId?facturas.find(function(x){return x.id===sendFactId;}):null;return(f?f.tel:currentRes?currentRes.tel:'')||'';}
function getSendEmail(){var f=sendFactId?facturas.find(function(x){return x.id===sendFactId;}):null;return(f?f.email:currentRes?currentRes.email:'')||'';}
function getSendMsg(){return document.getElementById('send-msg').value.trim();}
function doSendWhatsApp(){var phone=(getSendPhone()||'').replace(/\s+/g,'').replace(/^\+/,'');var msg=encodeURIComponent(getSendMsg());window.open(phone?'https://wa.me/'+phone+'?text='+msg:'https://wa.me/?text='+msg,'_blank');closeM('msend');toast('Abriendo WhatsApp...');}
function doSendEmail(){var email=getSendEmail();if(!email){toast('El cliente no tiene email');return;}window.open('mailto:'+email+'?subject='+encodeURIComponent('Confirmacion - '+(cfg.bizName||'VeloRentas'))+'&body='+encodeURIComponent(getSendMsg()),'_blank');closeM('msend');toast('Abriendo email...');}
function doSendSMS(){var phone=getSendPhone();if(!phone){toast('Sin telefono registrado');return;}window.open('sms:'+phone.replace(/\s+/g,'')+'?body='+encodeURIComponent(getSendMsg()),'_blank');closeM('msend');toast('Abriendo SMS...');}
function copyMsgClipboard(){var msg=getSendMsg();if(navigator.clipboard){navigator.clipboard.writeText(msg).then(function(){toast('Mensaje copiado');});}else{var ta=document.createElement('textarea');ta.value=msg;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);toast('Mensaje copiado');}closeM('msend');}

// TARIFAS
function renderTarifas(){var html='';Object.keys(tipos).forEach(function(k){var t=tipos[k];html+='<div style="margin-bottom:20px"><div style="font-weight:700;font-size:14px;margin-bottom:10px;display:flex;align-items:center;gap:8px;padding-bottom:8px;border-bottom:1px solid var(--g100)"><span>'+t.icon+'</span> '+esc(t.label)+'</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px">';t.sizes.forEach(function(talla){var key=k+'_'+talla,val=tarifas[key]||'';html+='<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--g50);border:1px solid var(--g200);border-radius:8px"><div style="flex:1;font-size:13px;font-weight:600">'+esc(talla)+'</div><input type="number" class="fi" data-key="'+key+'" min="0" step="0.01" value="'+val+'" placeholder="0.00" style="width:90px;padding:6px 8px;font-size:13px" oninput="tarifas[\''+key+'\']=parseFloat(this.value)||0"/><span style="font-size:13px;color:var(--g500)">'+cfg.currency+'/dia</span></div>';});html+='</div></div>';});var el=document.getElementById('tarifas-body');if(el)el.innerHTML=html;}
function saveTarifas(){document.querySelectorAll('[data-key]').forEach(function(inp){tarifas[inp.dataset.key]=parseFloat(inp.value)||0;});sT();toast('Tarifas guardadas');}
function getPriceForRes(tipo,talla){return tarifas[tipo+'_'+talla]||0;}

// INFORMES
function renderInformes(){
  var today=todayS(),mes=today.slice(0,7);
  var resActivas=reservas.filter(function(r){return r.estado!=='cancelada'&&r.ini<=today&&r.fin>=today;}).length;
  var resTotales=reservas.filter(function(r){return r.estado!=='cancelada';}).length;
  var ingMes=reservas.filter(function(r){return r.estado!=='cancelada'&&r.ini.slice(0,7)===mes;}).reduce(function(s,r){return s+(r.total||0);},0);
  var ingTotal=reservas.reduce(function(s,r){return s+(r.total||0);},0);
  var sg=document.getElementById('inf-stats');if(sg)sg.innerHTML=[{c:'c-teal',i:'📊',v:resTotales,l:'Reservas totales'},{c:'c-green',i:'🔄',v:resActivas,l:'Activas hoy'},{c:'c-blue',i:'💶',v:ingMes.toFixed(0)+cfg.currency,l:'Ingresos mes'},{c:'c-purple',i:'💰',v:ingTotal.toFixed(0)+cfg.currency,l:'Ingresos totales'}].map(function(s){return '<div class="scard '+s.c+'"><div class="sico">'+s.i+'</div><div class="sval">'+s.v+'</div><div class="slbl">'+s.l+'</div></div>';}).join('');
  var ocuHtml='';Object.keys(tipos).forEach(function(k){var t=tipos[k],total=bikes.filter(function(b){return b.tipo===k&&b.estado==='disponible';}).length;if(!total)return;var dias=reservas.filter(function(r){return r.tipo===k&&r.estado!=='cancelada';}).reduce(function(s,r){return s+r.dias;},0),pct=Math.min(100,Math.round(dias/(total*30)*100));ocuHtml+='<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:13px"><span style="font-weight:600">'+t.icon+' '+t.label+'</span><span style="color:var(--g500)">'+pct+'% - '+total+' bicis</span></div><div style="background:var(--g100);border-radius:999px;height:8px;overflow:hidden"><div style="width:'+pct+'%;height:8px;background:'+t.color+';border-radius:999px;transition:width .4s"></div></div></div>';});
  var oi=document.getElementById('inf-ocu');if(oi)oi.innerHTML=ocuHtml||emptyHTML('📊','Sin datos');
  var months=[],now=new Date();for(var i=5;i>=0;i--){var d=new Date(now);d.setMonth(d.getMonth()-i);months.push(d.toISOString().slice(0,7));}
  var maxIng=1;months.forEach(function(m){var ing=reservas.filter(function(r){return r.ini.slice(0,7)===m&&r.estado!=='cancelada';}).reduce(function(s,r){return s+(r.total||0);},0);if(ing>maxIng)maxIng=ing;});
  var ingHtml='<div style="display:flex;gap:8px;align-items:flex-end;height:120px;padding-bottom:4px">';months.forEach(function(m){var ing=reservas.filter(function(r){return r.ini.slice(0,7)===m&&r.estado!=='cancelada';}).reduce(function(s,r){return s+(r.total||0);},0),pct=Math.round((ing/maxIng)*100),label=new Date(m+'-15').toLocaleDateString('es-ES',{month:'short'});ingHtml+='<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px"><div style="font-size:10px;color:var(--g500);font-weight:600">'+ing.toFixed(0)+cfg.currency+'</div><div style="width:100%;background:'+(m===mes?'var(--te600)':'var(--b500)')+';border-radius:4px 4px 0 0;height:'+Math.max(4,pct)+'%;min-height:4px;transition:height .4s"></div><div style="font-size:10px;color:var(--g400)">'+label+'</div></div>';});ingHtml+='</div>';
  var ii=document.getElementById('inf-ing');if(ii)ii.innerHTML=ingHtml;
  renderBlqList();
}
function renderBlqList(){var el=document.getElementById('blq-list-wrap');if(!el)return;if(!bloqueos.length){el.innerHTML=emptyHTML('🔓','Sin bloqueos activos');return;}var today=todayS();el.innerHTML='<div>'+bloqueos.sort(function(a,b){return a.ini.localeCompare(b.ini);}).map(function(b){var t=tipos[b.tipo]||{icon:'📦',label:b.tipo};var activo=b.ini<=today&&b.fin>=today,pasado=b.fin<today,cls=activo?'bn-red':(pasado?'bn-gray':'bn-amber'),lbl=activo?'Activo':(pasado?'Pasado':'Próximo');return '<div class="trow"><span style="font-size:20px">🔒</span><div class="trow-info"><div class="trow-main">'+esc(b.motivo||'Bloqueo')+' <span class="badge '+cls+'"><span class="bdot"></span>'+lbl+'</span></div><div class="trow-sub"><span>'+t.icon+' '+t.label+' - '+esc(b.talla)+'</span><span>'+fmtD(b.ini)+' - '+fmtD(b.fin)+'</span><span>'+b.uds+' bici'+(b.uds!==1?'s':'')+'</span></div></div><div class="trow-acts"><button class="btn bd bxs" onclick="delBloqueo('+b.id+')">Eliminar</button></div></div>';}).join('')+'</div>';}

// CLIENTES
function getClientes(){var map={};reservas.forEach(function(r){if(!r.cliente)return;var key=(r.cliente+r.tel).toLowerCase();if(!map[key])map[key]={nombre:r.cliente,tel:r.tel,email:r.email||'',reservas:[],total:0};map[key].reservas.push(r);map[key].total+=(r.total||0);});return Object.values(map).sort(function(a,b){return b.reservas.length-a.reservas.length;});}
function renderClientes(){var q=(document.getElementById('cli-srch')||{value:''}).value.toLowerCase();var list=getClientes().filter(function(cli){if(!q)return true;return[cli.nombre,cli.tel,cli.email].some(function(s){return(s||'').toLowerCase().indexOf(q)>=0;});});var cl=document.getElementById('cli-count');if(cl)cl.textContent=list.length+' cliente'+(list.length!==1?'s':'');var el=document.getElementById('cli-list');if(!el)return;el.innerHTML=list.length?list.map(function(cli){var last=cli.reservas.slice().sort(function(a,b){return b.ini.localeCompare(a.ini);})[0];var activa=cli.reservas.find(function(r){return r.estado!=='cancelada'&&r.ini<=todayS()&&r.fin>=todayS();});var key=encodeURIComponent(cli.nombre+'|'+cli.tel);return '<div class="trow" onclick="showClienteDetail(\''+key+'\')" style="cursor:pointer"><div style="width:40px;height:40px;background:var(--b50);border-radius:999px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;color:var(--b600);flex-shrink:0">'+(cli.nombre[0]||'?').toUpperCase()+'</div><div class="trow-info"><div class="trow-main">'+esc(cli.nombre)+(activa?' <span class="badge bn-teal"><span class="bdot"></span>Activa</span>':'')+'</div><div class="trow-sub"><span>'+esc(cli.tel)+'</span>'+(cli.email?'<span>'+esc(cli.email)+'</span>':'')+'<span>'+cli.reservas.length+' reserva'+(cli.reservas.length!==1?'s':'')+'</span><span>'+cli.total.toFixed(0)+cfg.currency+'</span><span>Ultima: '+fmtDs(last?last.ini:'')+'</span></div></div><div class="trow-acts"><button class="btn bs bxs" onclick="event.stopPropagation();openNewRes()">+ Reservar</button></div></div>';}).join(''):emptyHTML('👤','Sin clientes registrados');}
function showClienteDetail(encoded){var parts=decodeURIComponent(encoded).split('|'),nombre=parts[0],tel=parts[1];var cli=getClientes().find(function(c){return c.nombre===nombre&&c.tel===tel;});if(!cli)return;document.getElementById('mcli-tit').textContent='Cliente: '+cli.nombre;var sorted=cli.reservas.slice().sort(function(a,b){return b.ini.localeCompare(a.ini);});var html='<div style="background:var(--g50);border-radius:10px;padding:14px 16px;margin-bottom:16px;display:flex;gap:16px;flex-wrap:wrap"><div><div style="font-size:10px;font-weight:700;color:var(--g400);text-transform:uppercase;margin-bottom:2px">Teléfono</div><div style="font-weight:700">'+esc(cli.tel)+'</div></div>'+(cli.email?'<div><div style="font-size:10px;font-weight:700;color:var(--g400);text-transform:uppercase;margin-bottom:2px">Email</div><div style="font-weight:700">'+esc(cli.email)+'</div></div>':'')+'<div><div style="font-size:10px;font-weight:700;color:var(--g400);text-transform:uppercase;margin-bottom:2px">Reservas</div><div style="font-weight:700">'+cli.reservas.length+'</div></div><div><div style="font-size:10px;font-weight:700;color:var(--g400);text-transform:uppercase;margin-bottom:2px">Total</div><div style="font-weight:700;color:var(--te600)">'+cli.total.toFixed(2)+cfg.currency+'</div></div></div>'+sorted.map(function(r){var t=tipos[r.tipo]||{icon:'🚲',label:r.tipo};var sc=SCFG[r.estado]||{lbl:r.estado,cls:'bn-gray'};return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--g100);cursor:pointer" onclick="closeM(\'mcli\');showResDetail('+r.id+')"><span style="font-size:18px">'+t.icon+'</span><div style="flex:1"><div style="font-weight:600;font-size:13px">'+fmtD(r.ini)+' - '+fmtD(r.fin)+' - '+r.dias+' días</div><div style="font-size:12px;color:var(--g400)">'+t.label+' '+esc(r.talla)+(r.total?' - '+r.total+cfg.currency:'')+'</div></div><span class="badge '+sc.cls+'"><span class="bdot"></span>'+sc.lbl+'</span></div>';}).join('');document.getElementById('mcli-body').innerHTML=html;openM('mcli');}

// EXPORT CSV
function imprimirHojasBici() {
  var candidatas = reservas.filter(function(r){
    return (["confirmada","proxima_entrega","en_preparacion","preparada","transito_furgo","transito_carlos","transito_seur","pendiente"].indexOf(r.estado)>=0)
      && impExcluidas.indexOf(r.id) === -1;
  });
  if (!candidatas.length) { toast("No hay reservas para imprimir"); return; }

  // Build modal content
  _abrirModalImpresion(candidatas);
}

function _eliminarDeImpresion(resId) {
  // Add to permanent exclusion list
  if(impExcluidas.indexOf(resId) === -1) impExcluidas.push(resId);
  DB.saveConfig('imp_excluidas', impExcluidas).catch(function(e){console.error('imp_excluidas',e);});
  // Remove from current modal list
  window._impCandidatas = (window._impCandidatas||[]).filter(function(r){return r.id!==resId;});
  // Close and reopen modal with updated list
  var modal = document.getElementById("m-imp-sel");
  if(modal) modal.remove();
  if(!(window._impCandidatas||[]).length){ toast("No quedan reservas en la lista"); return; }
  _abrirModalImpresion(window._impCandidatas);
}

function _abrirModalImpresion(candidatas) {
  window._impCandidatas = candidatas;
  var rows = candidatas.map(function(r,i){
    var fechaIni = r.ini ? new Date(r.ini+"T00:00:00").toLocaleDateString("es-ES",{day:"numeric",month:"short",year:"numeric"}) : "-";
    var nBicis = r.lineas ? r.lineas.reduce(function(s,l){return s+(l.uds||1);},0) : 1;
    return "<div style=\"display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #e5e7eb\">"
      +"<input type=\"checkbox\" id=\"imp-cb-"+i+"\" checked style=\"width:16px;height:16px;cursor:pointer\">"
      +"<label for=\"imp-cb-"+i+"\" style=\"flex:1;cursor:pointer\">"
      +"<div style=\"font-weight:700;font-size:14px\">"+esc(r.cliente||"-")+"</div>"
      +"<div style=\"font-size:12px;color:#6b7280\">"+fechaIni+" &nbsp;&middot;&nbsp; "+nBicis+" bici"+(nBicis>1?"s":"")+" &nbsp;&middot;&nbsp; "+esc(r.estado)+"</div>"
      +"</label>"
      +"<button onclick=\"_eliminarDeImpresion("+r.id+")\" title=\"Quitar de la lista\" style=\"background:#fee2e2;border:1px solid #fca5a5;color:#dc2626;border-radius:6px;padding:4px 8px;font-size:12px;font-weight:700;cursor:pointer;flex-shrink:0\">🗑 Quitar</button>"
      +"</div>";
  }).join("");

  var modal = document.createElement("div");
  modal.id = "m-imp-sel";
  modal.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9998;display:flex;align-items:center;justify-content:center";
  modal.innerHTML = "<div style=\"background:#fff;border-radius:12px;width:500px;max-width:95vw;max-height:85vh;display:flex;flex-direction:column;overflow:hidden\">"
    +"<div style=\"padding:16px 20px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center\">"
    +"<div style=\"font-size:16px;font-weight:800\">🖨️ Seleccionar reservas a imprimir</div>"
    +"<button onclick=\"document.getElementById(\'m-imp-sel\').remove()\" style=\"background:none;border:none;font-size:20px;cursor:pointer;color:#6b7280\">✕</button>"
    +"</div>"
    +"<div style=\"padding:8px 20px;border-bottom:1px solid #e5e7eb;display:flex;gap:8px\">"
    +"<button onclick=\"document.querySelectorAll(\'[id^=imp-cb-]\').forEach(function(c){c.checked=true})\" style=\"padding:4px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;cursor:pointer;background:#f9fafb\">Seleccionar todas</button>"
    +"<button onclick=\"document.querySelectorAll(\'[id^=imp-cb-]\').forEach(function(c){c.checked=false})\" style=\"padding:4px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:12px;cursor:pointer;background:#f9fafb\">Deseleccionar todas</button>"
    +"</div>"
    +"<div style=\"flex:1;overflow-y:auto;padding:4px 20px\">"+rows+"</div>"
    +"<div style=\"padding:16px 20px;border-top:1px solid #e5e7eb;display:flex;gap:8px;justify-content:flex-end\">"
    +"<button onclick=\"document.getElementById(\'m-imp-sel\').remove()\" style=\"padding:9px 18px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;cursor:pointer;background:#f9fafb\">Cancelar</button>"
    +"<button onclick=\"_confirmarImpresion()\" style=\"padding:9px 18px;background:#0d9488;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer\">🖨️ Imprimir seleccionadas</button>"
    +"</div>"
    +"</div>";
  document.body.appendChild(modal);
}


function _confirmarImpresion() {
  var candidatas = window._impCandidatas || [];
  var seleccionadas = candidatas.filter(function(r, i){
    var cb = document.getElementById("imp-cb-"+i);
    return cb && cb.checked;
  });
  document.getElementById("m-imp-sel").remove();
  if (!seleccionadas.length) { toast("No has seleccionado ninguna reserva"); return; }
  _generarHojasBici(seleccionadas);
}


function _generarHojasBici(listaFiltrada) {
  var lista = reservas.filter(function(r){ return ["confirmada","proxima_entrega","en_preparacion","preparada","transito_furgo","transito_carlos","transito_seur","pendiente"].indexOf(r.estado)>=0; });
  if (!lista.length) { toast("No hay reservas para imprimir"); return; }
  var LOGO = "data:image/jpeg;base64,/9j/7gAOQWRvYmUAZAAAAAAA/9sAQwAKBwcIBwYKCAgICwoKCw4YEA4NDQ4dFRYRGCMfJSQiHyIhJis3LyYpNCkhIjBBMTQ5Oz4+PiUuRElDPEg3PT47/8AAFAgAnQGQBEMRAE0RAFkRAEsRAP/EABwAAQABBQEBAAAAAAAAAAAAAAAGAQMEBQcCCP/EAFEQAAEDAwIDBAUHCAULAwQDAAEAAgMEBREGIQcSMRNBUWEicYGRoRQVFjI3sbIjMzZCUmJzwTVDdILwCBckU3WDkrPC0eE0cqIlOEVjRNLi/9oADgRDAE0AWQBLAAA/ANZwyqah/EenLp5HGYT9plxPP6JO/juAVreGdTO/iNTl08jjMJ+0y4nn9Enfx3AKxuHFTO7iDAXTSO7UTdplxPP6JO/juMqJ8I6md3E+hc6Z5M4m7UlxJf8Ak3Hfx3AK7yu8Lt6+kkRERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERFwHhh9o1F6p/wADlwLhj9otH6p/wOXC+G/2gUfqm/A5fNHCL7TbZ/vv+U9d+XfV3RfS6IiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIi4Dww+0ai9U/4HLgXDH7RaP1T/gcuF8N/tAo/VN+By+aOEX2m2z/AH3/ACnrvy76u6L6XRERERERERERERERERERERFbc94dgRFw8QQsOeqqo5XNjoHysHR7ZGjPsKj9yvl9o6+SGl0pU11OzHLUR1cTefbfDXHPluiNlaXBrgWuPQOHVIrlE+VsMrJKeV31Wytxzeo9CqUGsqCor47dX01Zaa2U4ihr4uQSnwY8Etd6gcorizFIURERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERcB4YfaNReqf8DlwLhj9otH6p/wADlwvhv9oFH6pvwOXzRwi+022f77/lPXfl31d0X0uiIiIiIiIiIiIiIiIiIiIiIioitVGDEW4y531R5rX3kxvoHwFvPLKMRMHUu7iPV1yorxEkpJtMVFrfF8pr61vJQ0zBmR036r2juDTuXdAAiuNyGgE5ON1mwte2FjZHczw0Bx8TjdSK3RVENtpYquTtahkLGyvH6zwBk+05RVXtZKIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiLgPDD7RqL1T/gcuBcMftFo/VP+By4Xw3+0Cj9U34HL5o4RfabbP99/ynrvy76u6L6XREREREREREREREREREREVEVCcdV5c9rBlzg0eZwvE1RDTs55pWRt8XuDR8UVNiHFmC5WcxOZLLS9k+XBHMCDvjYFaztKGaC4V9jNFU1/ZuaZI3NeS8N9FriDnGcbIqRP7SJru8jdebdVGtoIp3ABzh6QHcRsVb0ffXak0tQ3SQNbNNHiZrRgNkaS1wx3bgovaylu0REREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREXAeGH2jUXqn/A5cC4Y/aLR+qf8AA5cL4b/aBR+qb8Dl80cIvtNtn++/5T135d9XdF9LoiKioqKiZRERVVVVVVC4NGSQB5rxLNHCznlkaxvi44Cx624UdtgM9dVw0sQ6vmkDB7yi8dqD9RrneobLFNya/wD9NTzVHgWt5W+84C0btZRVO1ltNyuxP1ZIYOzhP+8k5Rj1ZRU/LO7mM+JXkm6zdG01MD4kyOH3BWXP13cM9nDZ7PG7/WPfVSt9g5W/eidi5315nn1bLybZPL/6i5VD/KPEY+C8O0Xc67e76xu8+erKMspGe5oz8VRPk0Xe3m9ZJRtit3V8JlPjI9zv5qkXC/SQf2lRbn1sv7dXUySk+92FVe2sawYa0NHkFmQUsFKwsghZG0nJDRjKkFrstsslO6C10FPRxvdzObDGG8x8T4orcXoSyR92eYe1YNu/0W4VlEdml3bR+p3X4qM6QHzJqzUGm3ejE6UXGkH/AOuTZ4HkHDHtRXls1NFRERMoiIiIqoiIiIiIiplERVRERERERFRERMoiIiIqoiIiIiIiIiIiIqZREVURERERERERERERERERERERERERERERERERERERERERERERcB4YfaNReqf8DlwLhj9otH6p/wADlwvhv9oFH6pvwOXzRwi+022f77/lPXWNWa6tWk4+ScmorXDLKWM+ljxcf1R/gLrGrNdWrSkfJOTUVjhllLGfSx4uP6o/wF1HVOtrZpePkmJqKxwyymjPpY8XH9ULtOtOI1n0bH2UxNVcHNyykicM47i4/qj4+S5XXcQdY6mqzTW500Ad9Wnt8ZLsebvrfcuV13EDWGpqs01udLAHfVp7fGS7Hm7633LmVbrzVuo6o09A6WEO+rBQsJdjzd1+5ccuXErW+q6s01vlnga/6tNbmEOx/wC4ZcferbdDa+rx20lJWEnfM9YA74uVtuh9e147aSkrCTvmesAd8XK23ReuK38q+lqyTvmarAPxcrTeH3ES4DtpLdWuJ3zPUta4+xzsrw+38QdMAzBt1p42bl0chlYPWASPeF5fb+IGmAZg2608bNy6OQys9oBI94Xl9BrvTYMwbdIGN3Lo5DKz2gEj3rxJbeI2kh8o7O70kbNy+KRz4x6+Uke9SHTfGOpikZT6hgbNEdvlUDcPb5ub0Psx6lINN8YqmKRlPqGBs0ROPlUDcPb5ub0Psx6lvtPcW6iJ7YL9C2aM7fKYG4c31t6H2Y9SlGleOVbTyMptSwNqYTt8qgaGyN8y0bO9mD611eiq6O5UsdbRzR1EMreZkjDkELqVE+3XKJlypHQ1LJgHMmb6QI8vBdBpLbYLnO2+U9NS1cs4DmVJHaHAGPRJzy9Ogwuz265Ud2oYq631MdRTSjLJIzkH/wA+SyVmrbLKRFVQvizXVdv4f1s9FUyU8vPE3tInFrgC8AjIREWh4GXS4XG0XRldWz1IinZydtIXluWnOCfUERF1JEReJZo6eF800jY42NLnvecBoHUk9wXksBeH94GFZdSxvq46o5EkbS0EHYg+K109ko577S3pweKulhfC0tdgOY7GQ4d+CMhch1fxwZBK+j0vCyYtODWztPL/AHG9/rPuXpXlsFEYqLidrbFRm5zQv3DnydhEfUCWj3BERXjwo4gQjtY2AvG+GVwDvvCIqqy3UvEfQkzG1765sWcBlc0yxO8g45+BREXUND8WLXqmSOgrWC33J2zY3OzHKf3XePkfZlERT9ERaDXU0sGhr1LDI6ORtHIWuacEbdxREXLeAtVUSX66QvnkdGaVr+RziRkPAz8SiIu4oiKhIAyURFy7WnGiitEslBp+OOvqmEtdUOP5Fh8sfXPqwPMoiLnBvfELW8zvk89zq2E7spQY4m+R5cD3oiK5/m24hcvbfNlTzdf/AFTOb8SIittv3ELREzRUz3OlZnZlW0vid5DmyPcURF0rRfGehvMsdBfo2W+reQ1kzT+RkPnndh9eR5oiLpyIiqiIiIijeuNY0ejbG+sm5ZKqTLaWDO8j/wD+o6k/zKIi+eLZre/WvUp1AysklqZZC6YSOJZKCd2keH3bYREX0hpTVVu1dZmXCgfg/VmhcfShf3tP8j3hERbtERERERERERERERERERERERERERERERERERERERERERF8wWy71livDbjb5Gx1EReGuc0OG4IOx8ivmG2XessV4bcaCRsdREXhrnNDhuCDsfIr5ttt1q7Jdm3Che1lREXBpc0OG4IOx8ivkKzXqu0/d4rpbpRFVQ83I4tDgMgg7HboSpHo/R9drm5zXK5VEraMSZqKlx9OV3e1pPxPcpFpLSVbrW4VF0ulTIyhY8uqap59KV3UtaT8T3Leac03Pqmpqrzeax0FuhcX1dZI7BeepAJ8up7lK9D6GuXEO7z3G41EraJsmamqccvled+Vue/xPd7gu0Wm0UVooxS2ijipIB+sG+k/zJ6k+ZXWrRQMpKQUun6KG30Q/r3My+Tzx1PrKmVplu92pRT6IoKexWXoLnVRc0tR+8xh6j953VfQFk09atO0TaS1UUVNGBuWj0nnxc7qT61nfJyfrTSE+Rws/wCZ3v3muVY93i1/KPcFsDw8qKj06/WWoZ5e8xVQhb7GgbLYqnZSs3jlJ8n7rybfcab0qS4vkx/V1A5gfarUmk9XWYdtYNXT1fLv8luzRK1/lzjcIodq3h9bNSxyTU0TKC6gZEjRhkp8HAdfX19aiWo9GWzVPahtOy1XxoLg4DDJ/Xjr6+o81Hqmjtus6ua119uGndWRNLuzP5qqHiCNnDz6jzwVAddcKrVqaCSrt0cdBdAOYSMHKyY+DwPxDf1rnmj9T1+g9QyW25teykMvJVwO37J3+sb/AOOo9ig+kNTV+hNQyW65teykMvJVwO37J37bf/HUexajSepK7RF/kt9xa9lKZOSqhd/Vu/bH+Nx7FyzRGrblw71PJbrmyVlG6Xs62md1jPTnb5jy6j2LvLHtkY17HBzXDLXA5BHiu8Me2RjXscHNcMhwOQR4rt7HtkY17HBzXDIIOQQvo+KVk8TJYnh8b2hzXNOQ4HoQvS9L0oPxl+zit/iw/jCIijvAD+i7z/Hi/CURF11ERcF4qa5qtR3k6XsrnvpIpRE8RbmqlzjG3VoOwHed/BW5ZAz0QC5zugHVYVwrmU7RA1r5aiUEMjjPpevPcPNRzVepoLTCLbBFUVt1rmObTUdI7EpyMc/N+oB+0fBTTQPCe36fgiuF5ijrLoRzcrhzR058AOhd+97vE242yyAh8pby7ENG/vWBRwXCtjdHUXB8JgPZuZEAHdOpd35Ci2nLbq3UdJLSXjVVTbpLa8Us1NRRtbKSGgh7pTknmBByNiuir18nPdNID/7lkmzOG8dyrWu8TJn4LbHhzLH6dLrHUcU37T6znHuIVVQumh3d+UZ4gbhW3TXO2elPitph1exuJGjxx3rGnuOtNFfl7oGaktDPzlRBH2dTC39otGzh/jIVqppoKynfT1MMc0Mgw+ORoc1w8wVda5r2hzTkFbKnqIqqBs0Lw9juhCmVou9DfLbDcbdUNnpphlr2/EEdxHguL8QOD81JL866TgkkYXZkomHLoz+0zvI8uo7vL0rqzV0Th5UaiqNLRN1NSvgrInmNrpdnysAGHOHceo88ZREV/iB+gN8/sUn3IiLlXAP9JLn/AGMfjCIi7uiIuN8Y+IEsMj9LWmYsPL/p0zDvv/Vg+rr68eKIiscNuEcVXTRXvUsRdHIA+nojtkdzn+vub7/BERdngp4aWBkFPCyGJgw2ONoa1o8AAiIvaIit1FNBVwPp6mGOaF4w6ORoc1w8wURFxfiTwkjoKaW96bicIYwX1FGMnkHe5nkO8e7wREWZwc4gy1TmaXu0xe9rf9CmedyAN4ye/A3HqI8ERF2FERR/V+srXo62Gqr388zwRBTMPpyu8vAeJ7vgiIuEU1NqLi3rB0kjsN27STB7KkizsAPuHUn2lERduqeHdgqNHs018mDKeNuY5gB2jZP9Zn9rx7u7oiIuIMfqHhHrIhw5h+sNxFVxZ/x5g/EiL6D03qO36os8Vzt0vNG/ZzD9aN3e1w7iP/KIi2qIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIi+WqSimuV2hoacZlqZxEz1l2F8uUlFNcrrFQ04zLUziNnrLsL5opaOW43SKigGZaiYRs9ZOF8eW+hmudzp6CmbzTVMzYmDzccBfSVqtVNarfT2qkZy09KwNP7x8T5k5J9a+g6C0U1NFTWKlby0Nvjb2o/1j+oz8XH1rq77PT3i90+j4G4sViijlr2j/wDkzO3ZG7xH67vHIX1lYbLS6eslLaqNobFTsDc43ce9x8ycn2rZrfgADAGAFPmMaxgYxoa1owABgALYoqr0iIiK3NF2jdtnDdp8CsK50ArafLDyVEXpRPHUFRrW2lW6ktQfTO7C60Z7ahqW7OjkG4GfA4x8UXL+L9hjqLdT6ihjDZonCCpwOrT9Un1Hb+8uY8ULUy42Wl1NFGG1ELhT1gA6joCfUdvU7yXPNUObqnR1Bq0QiKugd8kuLAMYeDjJHr+Dh4Lj3HXS8bqSm1LTxgSxuEFTgfWafqOPqO3tHgt5wnvTrppJtLM/mmt7+xyepZjLPht7FI+E96ddNJNpZn80tvf2OT1LMZZ8NvYprwuvDrnpUU0ruaWgf2OT1LMZb8NvYt9wWv77toz5FM8umtsnYgnr2ZGWfzHsU4U4UzWRxl+zit/iw/jCIijvAD+i7z/Hi/CURFOOIV+dpzRVwr4nctQWdlAR1D37Aj1ZJ9i8vcGMLj0AVmqqGUtNJO/6sbST5rAvd2gsdlq7pU/mqWIyEDq7HQDzJwPauZcDNMsrLhVaiqmc4pD2NPzD+sIy53rAIH95eImEAvd9d258vJY9tpHRsdVVG9VP6Tz+yO5o8gtPoyxTUlNJersBJerpiWpeR+aad2xN8GtGBjxXclV3oSB/cdnfyVZx8lrmVQ2jlxFL5fsu9+3tXq6s+Y9T0t9Z6NLWhtFX+DTn8jIfU4lhPg8eCK4s1SRERCMosfHYTjH1JDgjwK05Z80XZhj2pax3K5vcyTuI9a56+nGgNd08lKOzsWoZeylhGzKep/VcB3B3/fwCLIW4XQ0REUd4gfoDfP7FJ9yIi5VwD/SS5/2MfjCIi7Nf7qyx2CuukgBFLA6QA/rEDYe04CIi+feGthdrPXhqblmeGAuq6ou/rHc2wPrcfcCiIvpLoiIqoiIiIiIioQCMFERfNfESyP0Rr/t7b+Qie5tZSFvSM53aPU4H2YREX0PZLnHerJRXOLZlVAyUDwyMkew7IiKM694cUuuJqOodWvo56bLC9rOcPYTnGMjBz0PmiIpBp/Tts0xa2W61wCKJu7nHd0ju9zj3lERbRERaHV+krfrCzPoK1vLI3LoJwMuhf4jxHiO/3IiLg9out94T6xkpqqMmMECogB9Coj7nNPj4H1g94REX0ZbLjS3e209wopRLT1DA+Nw7wf5oiLKRERERERERERERERERERERERERERERERERERERF8/8M4GT8RKLnGRGZZB6w04+9cA4aQMn4h0XOMiMyyD1hpx964Vw6gZPr+j5xkRmV49YacfevmbhLTMqeJVsD9xGZJAPMRuI+K73B0e7xeV2+0+lHUyn60lS8n2HA+5dK0C3tKW8Vzt5au71LnHvw13I0ewNX0wrq2ClaqiIiIiIip3IozraBs+jL9E7o2ndIPWBzD4hQvU9O2TTGqqZ31GxGYDwOOb7wFysU7GM4kWsDEMcjapgHQOcznPxAUY4kU7Knh7emPGQ2mMg9bSHD4hQbglM4XG7QZ9F0Ub8eYLh/NRXgnM4XC7QZ9F0Ub8eYLh/NeeDczhX3WDPouijfjzBI/mua8AZ3Nu94p8+i+CN5HmHEf8AUuvrry6uptxl+zit/iw/jCIijvAD+i7z/Hi/CURFl8e53s0tb4Gkhslbl3nhjv8AurU+7Wt7i8ArX3cc8VPEfqy1MbXeYzn+SinEBvb0FooXfmq28UsMo8W8xcR/8Qtzwcp2wcOKF7QMzySyO8zzkfc0K6tgpUpyqEBwIPQrxLEyaJ0Ugy14wQrFdRU9xoZ6KqjEkE7DHI094IwiozOMO6jbPirVI6TszFNkyRHlLiPrDuPu+OVhWCarFG+huHO6qondi6ZzcCduMtkB824z4OyEXpZC2qKzVD/R3HwwQtZqBubPK/vjLXtPgQQobxYgEnD+uqAcSUj4p43fsua8fyJRXRuMrYxu5o2u8QCpZSSmekhmPWSNrj7RlFVeleUd4gfoDfP7FJ9yIi5VwD/SS5/2MfjCIin/ABimfFw3uAYcdo+Jh9XaD/siIozwApmC3XiqwOd80cefINJ/miIuvIiIiIiIiIiIiIuO/wCUBTs+TWWqx6YfLHnxBDT/ACREUt4Qzvn4b23nOTGZWD1CR2ERFNURERERERERFzvjNpuG7aRfdGRj5XbD2jXAbujJAc31d/s80RFquA16kqLPcLNK8kUcjZYge5r85A9rc/3kRF1lERF5e9kbC+Rwa1oyXOOAAvL3sjYXyODWtGS5xwAF5e9sbC97g1rRkknAC8SyxwROllkbGxoy5zjgAeZWlk1rpiKfsX36gD84x24Px6LSya00xFP2L77QB+cY7cH49Fp5NYabim7F97oQ/OMdsD8VoJOIGkYpjC/UNBzA4OJgR7xstvTVVPWQialnjnid0fG8OafaFt6aqp6yETUs8c8Tuj43hzT7QtrT1MFXCJqaaOaN3R8bg4H2hbujrqS4U4qKKphqYXdJIXh7T7Qrquq6r6tT1EFLC6aomjhjb9Z8jg1o9pVqeogpYXTVE0cMber5HBrR7Src9RDTRGWomZFG3q+RwaB7SrNVWU1DA6oq6iKnhb9aSV4a0e0rUN1rph8/Ytv1Bz5xjtxj39FqG610w+fsW32g584x24x7+i1LdY6bfN2IvdDz5x+eGPf0WibxB0g+bshqKg5s43mAHv6LcxyxzRtkie17HDLXNOQR5FbmOWOaNskT2vY4Za5pyCPIrbxyMmjbJG9r2OGQ5pyD7Vv4Z4qiJs0ErJY3jLXscHNcPIhVe9sbC97g1rRkk9AFV72sYXvcGtaMknoAquc1jC9xDWtGST3BepJGRRukkcGsYC5zidgB1KwYr9aZrWLoy40xojkCoMoDMjbqfUsGK+2ma1i6MuNMaI5AqDKAzI26n1LCjvdrltouTLhTmjOQJzIAzbzK1seprHLaBdm3WlFASQKh0oazI6jJ7/JYtFrDTlwqBT0l6o5ZScBglAJPlnqsai1fpy4VAp6W9UcspOAwSgEnyz1WNR6s0/XziClvFJJKTgMEoBJ8s9ViUOutLXKpFNSX2ikmccNYZOUuPgM4ytzkAZK3GQBkrb5wMrfEhoJJwB1JWkqNaaZpan5PNfKJsoOC3tgcHzI2WlqNZ6apan5PNfKJsoOC3tgcHzI2Wnn1hpymqPk8t6o2yA4I7UHB9YUeqNf6Spak082oKESA4IEvMAfMjZbenqIKqFs1PNHNE8Za+Nwc0+ohbaCogqoWzU80c0Txlr43BzT6iFtYKiGqhbNTysljcMtfG4OafUQt5S1lNXU7KikqIqiF4y2SJ4c13qIXBNNP+jXFKKGchjYa2SmcT0AdloPxC4Lpt/0a4pRQzkNbFWyUziegDstB+IXDtOv+jvEyKKY8rYqx9O4noA7LQfiF82aUk+ifFmmiqD2baeufTPJ6AOyzPq3BXfwu/AADYAepdzYxkbcMa1oJJIaMbnqvphVVV6VURERERFQkAZK8ucGtLnEAAZJPcih3ES4ModC3SQuw6rxTxjx5jj7slQLWNwbS6HvdaTg3CQQQ/vAnl+7mPsXJBXtdo7V2ozs2+1xgpc/rxt9AH3c3uUL4tXNlt4e3AOdh9Xy08Y8S47//ABDlGuCVE4Mu1eQeVzo4Wnxxlx+8LUcE6JwZdq8ghrnRwtPjjLj94Wdwbo3Bl0riCGuMcLT44y4/eFDeAFA7/wCsXFw9A9nAw+J3c7/pXVl1VdPUr4y/ZxW/xYfxhERR3gB/Rd5/jxfhKIi2vHK3uqtER1TAT8jq2PcfBrgW/eQqKhAOMgHG68vjZJy87Gu5TzDIzg+K9cELmyr0OaLm/KUNQ9hb+670gfifcqqq9LoyIiIiIiIis1O7BGOryAtXfXdpSx0bfr1UjWAeWckqE8UJTVWOk09Cc1N6rIqdrR15A4Oe71AAe9FdWzAAAA6BTSNjY42saMNaAB6giqqr0o7xA/QG+f2KT7kRFyrgH+klz/sY/GERFPOM32cVn8aH8YREUP4A3RjKq7Wp7gHyMZPGM9eXLXfiaiIu1oiIiIiIiIiIiIuIcfbmyW42q1scC6CN88gHdzEAfhKIi6JwxoHW7h5aIXtLXPiMxB/fcXD4EIiKVoiIiIiIiIiKPa+mjg0Fe3ynDTRSN38SMD4kIiLl/AGF5u93mAPIyCNhPmXEj7iiIu4q1U1EVJTS1M7xHFCwve49GtAySrVTURUlNLUzvEcUTC97j0a0DJKtVFRFS00lRO8MiiYXvcegAGSVYrKuCgopqypkEcEEbpJHno1oGSVzugt1fxNnddLtNPS6ea8ikoo3cpnAOOd5/wAeWOp53Q26v4mzuul2mnpdPteRSUUbuUzgHHM8/wCPLHUwGioK7iPO65XSaamsLXkUtHG7lM4BxzOP+PLHU8tt1qufFurfd71PPR6bjkLaOhidymfBxzOP8/HIGMZUpj0JpWKDsG2Gi5MY9KPmPvO6lUehNKxQdg2w0XJjHpR8x953Umj0TpiKDsW2Sj5MY9KPJ953Uyi4caOig7FunqMtxjL2Fzv+InK0VboSs09Vi66HmNPKHDtrdLIewnb3jfof8DC0NboWs0/Vi66ImNPKHDtrfLIexnb3jfof8DC0lZomrsNULnoyY08ocO1oJZD2MzfDfp/jGFHLjw5uGmq5t54f1DqeYOHbW6aXMMzfDJPwJ9RCld2vMNjsM11uDezbBEHPY12cu/ZB78k4Uru15hsdhmutwb2bYIg57Guzl37IPfk7KT3S7xWWyS3OvbyNhjDnsac5d+yD377KZ3q/xad01LebmwR9hEHPiY7OXnGGA9/pHGfaoPaNK12u3Mv+rppfksvp0ltjcWsYw9CfWPaeue5Qi0aVrtduZf8AV00vyaX06S2xuLWMZ3E+se09c9yhlp0xW62cy+6qmk+TS+lS2+NxaxrO4n1+8+Pcue2LRtx4jPZqXWdTMKSb0qO3ROLGNZ3E+APluepKkzuHuknw9ibFShviAQ735ypM7h9pJ8PYmxUob4gEO9+cqRu0HpZ0PZGyUwb4gEH35ypc/hjot8HYmwUwbjGWlwd/xZyotcbTceGM4vFjmmqrEXgVlBK7m7IE45mn+fqzkdItcbTceGU4u9kmmqrGXgVdBK7m7ME45mn+fvyOkZr7XX8OJhdrNNNU2UuAq6GR3N2YJ+s0/wA/fkdIbdbJdeEtU292ConrLA54FZQSuz2YJxkH7ndQcZyFPJayC46ekrKV4khnpXSMcO8FpIU7lrILhp6SsppBJDPSukY4d4LSQpxLVwV9hfV0zw+Gemc9jh3gtJC6NUXCmuuk5rhRydpT1NE+SN3iCw/Fco4b6Mbqi3MrL1LLLbKN5jpqTnIa53V5OO7J9vsXKeHGjG6ot7Ky9Syy2ykeY6ak5yGud1eTjuyfb7Fy7h7pBupaBlXeJZZbdSPLKal5yGud1cTjuyfb7FxzhdoNur6MV18mmltNFIY6akDyGved3nboNx03J79lPblw00rX0boGWyOlfj0Jqf0XNPj4H2qeXHhrpavo3QMtkdK/HoTU/ouafHwPtU4uHDrTNdSOhbbY6V+PQlg9FzT4+ftXRrrwn0hcaF1PFa2UUmPQnpyQ5p8dzg+1QOE6pud0HDqpuDmxU8rjPVgnnfTgAgZ7xgjHrAOwUEhOqblcxw6qa9zYqeVxnqxnnfTgAgZ7xgjHrAOwUJiOprjchw/qK5zY6eVxmqhnndAACBnvGCMesA7Bc3gOr7tdW8MKq4lsNNO7t6oZL3QAAgE97cbgfvAHYKf0vDfSVLSCm+Z4ZRjBkly57vPP/bCn1Lw40nS0gp/meGUYwZJcue7zz/2wpzTcPdLU1KKf5phlGMF8uXPd55/7LplHwq0ZSUQpjZo59sOlme5z3eec7ezCjM9G/hlqqhloJ5DYLrL2M1PI4uELz0I+/PXAIPcozPRv4ZapoZaGeQ2C6S9jNTvcXCF56EffnrgEHuUcmpH8ONTUUlFNIbHc5eylge7IheehH3+oEHuUQqaGXhJrGgnt9RK/Tt2l7Kenkdzdi7bf2ZyD1wCD4rT8YNOSUd3jv9O0iGrwyZzf1JQNj7QPe1aji/pySju8d/p2kQ1eGTFv6koGx9oHvatTxY0++kusd8gaexqsMlLf1JANj7QPeFpeN2lpLffY9RUzD8nrsMmLR9SVo294A9oKnfD/AFfFqiyMbNIBcaZoZUs73eDx5H4HKnWgNXRaosjGzSAXGmaGVDO93g8eR+ByptoXVcWpbM1ssgFfTNDahne7wePI/fldE4Za3i1bYGRTyj5zo2BlQwnd46CQeR7/AAPsUrUrUnU1RFVEVFQkDqisSSdpmOM7fru7gFqqyqdcHuoKJ/o9J5x9Vje8A95UF1De5tXVMultNTZid6NzuTN46eP9ZjT0c8jbbp78Uc4NaXOIAG5JXEeJOqRqW8w2q15mo6N3JH2e/bynbI8R3D2+K4/xE1JHf7rT2a0AyUNCeziEe/bSnbI8fAeOSe9QbWd3pq+ootPWJmbbbQIYGx79rJ0yPHwB7ySe9fO3FXWQ1dqCK2WtxmoaNxZEWb9vKdi4eI7h7T3rrGjLB9GtMUtvdjtwO0nI75Hbn3dPYus6MsH0b0zS292O3A7Scjvkdufd09i6zpCxfR3TlNQOx2wHPOR3vdufd09i7NoHTX0V0jSW54Hykgy1JHfI7qPZsPYt6t6t2tRxl+zit/iw/jCIijvAD+i7z/Hi/CURF06+WmC+WSstdT+aqonRk/s56H2HB9iIi+f9EX2p4ba6qKC7NdHTvf8AJ6wdzcH0ZB4gZz6nFERfRkUsc0TJYntfG9oc1zTkOB6EHwRFRe0RVReXvbG3mccBWaqrgo4TLPIGNHTxPkB3rXXu/W3T1vdXXOqbBEPqg7uef2WjqT5BFbja57+1eMdzW+AWFQwTVVWblVMLDjlgiPVjfE+ZUc0xbLhe767WF9pnUzzGYrbRP+tTRHq5377vgPhhXW8W6x0RrLnWRUsAcG88hwCT0A8Sry2amipaL1bb9R/LLXWRVcAcWF8Z6OHcfBERaviB+gN8/sUn3IiLlXAP9JLn/Yx+MIiKecZvs4rP40P4wiIuB6Yv9RpjUNJdqb0nQP8ATZnAew7Ob7QiIvqiy3mhv9qguVumEtPO3LT3g94I7iOhCIiz0RERERERa++Xuh09aZ7ncZhHBC3J8XHuaB3k9yIi+c6CC4cUOIpfM0gVUvaTFu4ggbjbPkMAeJKIi+mYomQQsiiaGMY0Na0dABsAiIvaIiIiIiIiIi49xw1dE2lj0vSSB0r3NlrMH6rRu1h8yfS9g8URFIuDmnH2PRraqoYWVFyf25B6hmMMHuyf7yIin6h/FOokp+H9w7MkGQsjcR3AvGVEOKdRJT6AuHZkgyFkbiO4F4yonxNqJINC13ZnBkLIyfAFwyoPxhqZabhzXCIkdq+ONxH7JeM/dj2qSWiliorPR0sAAjhgYxoHgGhSO0UsVFZ6OlgAEcMDGNx4BoUhtVNFR2mkpoQBHFCxrQPAAKT6fo4aDT1vpKcARQ00bW47/RG6zFmLLWxRERQHiuTPQ2W3vOIKu5Rsl8x4fFQHiuTPQ2W3uOIKu5Rsl8x4fFQbigTNRWegccQ1VxjbL5jw+K5pxoc6ehsVtc4tgq7k1suPDGP+o+5TxjWsYGMaGtaMADoAp4xrWMDGANa0YAHQBTdjWsYGtAa1owAOgC6RFGyKJscbQ1jAGtaOgA6Bel6Xpe1i3OmirbXVUs7Q6KaF7Hg+BBCxbnTRVlrqqWcAxTQvY8HwIKxrlTRVltqaaYAxyxOY4HwIKwb3SQ19jrqSoaHRTU72PB8C0qFcNqiSbhi9kji4QfKI2E/sjJ/mVCuG9RJNwyeyRxcIPlEbCf2Rk/zKh3DyeSbhu9khJEPbxsJ/ZGT/ADUA4X1EtRwiqY5HEiD5TGzP7PLzfe4rJ4SfoBSfxZfxFZXCT9AaT+LL+IrJ4V/oLS/xJPxFZ3Bb7O6f+PL+JTZTVTFT9QC3gf577p/s1n/QoDbwP8910OP/AMaz/oUFoAP881y/2cz/AKFzO3AD/KEu2B/+Mb+GJT9T5TpdMUB4wAfRmgPeLlFg/wB1ygXF8D6NUB7xcosH+65QbiwB9HKE94uEe/8AdcuZ8dAPorbjjcXFmD/cepnc7bSXi3TW+uiEtPO3le0/ePAjqCplc7bSXe3TUFbEJYJ28r2n7x4EdQVL7lbqW7W+ahrIhLBM3lc0/ePAhT68WiivtqntlwhEtPUN5XN7x4EHuIO4K4XfdOX7h3emV9FNJ2DXfkK1g2IP6rx0B8Qdj3Lhl905feHd6ZX0c0nYNd+QrWDYg/qvHQHxB2PcuKXvT970BeG11HLJ2DXfkKxg2I/ZeOmfI7FfO2otL6i4ZX9lfRTSiBr/APRq6IbEfsvHQHHUHY+amdh4v22siZDfon0M427eEF0Z88Ddvx9al1o4rWu6QxQ39k1vqWdKmnJMefHA3HqIIW9brqzamp6eHUD6201tOSYq6glc0NJ6nbpnwIIU/wBMcc7bUwsg1FTvo5wMGohaXxO8yOrfipdBq2wVMfPDqOgc39+VoPuJCk8GpbZPGHU2r6B7P/2lgcPiFtIa2vdGPkHE63yxd3yykiLwPMhzc+0KcU+vdJVMYfHqK34O+Hzhh9xwVg3LX+lrewme9x1Lh/VUvpk/8O3vKwblrDTVKwmv1L8tx/UUYzzeXo/zKwLnUWeSMjU2vqq7x99Fb2iGN/kRHuR63BYF04p6OtcZc68R1Tx0jpAZSfaNveVzfVfEq4ajYbXaad9FRSnk5GbzT57jjoD4Dr4qA6m4i1t9h+aLLSuoKGQ8nZx7yzZ7jjpnwHXxUfvGs31lC2w6ct4tdsJ5BDCPyk2e448fAZJ7yuS604r3XVrXWu1wPoqGU8pjYeaafPcSO4/sj3lSrhxw5faZGXq9RAVmM09Od+x/ed+95d3r6Szhzw6fapGXq9RAVmM09Od+x/ed+95d3r6S/h9w/fa3svF4jAq8Zgpzv2P7zv3vLu9fSYcLeF0lpmjv9/hDasDNNSu/qf3nfveA7vX06Uukroi6yiIoJxl+zit/iw/jCIijvAD+i7z/AB4vwlERddREUA4mcOGauphcLcGRXaBuBnYTt/ZJ7j4H2HyIi5rpLiPfdA1LrLd6SWejhcWuppfRlgP7pPd34O3hhWjEQSWSObnu6hYD7c9kjn0tZNAXEktPptz6j0UXn0dU09TLU2LUVwtbpnmR8LiKiDmJySGP6ZPgQuvWfiZpG9RtMV3hppD1iqz2Th5b7H2EpyTH+uHsaqfJLm7Z1za0eLYBn4lWTYNay+hLrSKNh6ugtbA8+0uIHuW5fqOxxR9pJeaBrOvMalgH3qrYWtdzEl7vF269U9qgilE8rn1Ew6STO5iPUOgWTatC2ugr23OtlqbvcW/Vqq+TtHM/9rfqt9gUT1Bxi0vZ4nNopzdKkD0Y6f6mfN52x6sq4s5SVcpln1Zxd1G1jW5ijOzW5EFK095Pj8SiIu86T0vQ6RscdsosuweeaVw9KV56uPh0AA7gAiIrHED9Ab5/YpPuREXKuAf6SXP+xj8YREU84zfZxWfxofxhERcs0Bw+pta6fu8gqHwV9O9jaZxP5PJBJDh4HHXuREWFaL9qjhdfZqSSF0Y5vy9HPkxyj9oEfBw/8IiLrli4y6VusTRWzPtc5G7J2ktz5PG3vwiIpD9ONKdn2n0itnL/AGpn/dERRy+8ZtLWqJzaGWS6VAGzIGlrM+byMe7KIi5JdL3qnilfoqWOJ0uD+RpYdo4R+0T97j/4REXcdA6GpNFWkxAtmr58GpqAOp7mt/dHx6oiKUvLgwloy7Gw8URFwiy8ZdQ2a9VFPqaB1XCZSJIhGI5ac56NG2R5H3oiLqNp4kaRvEbXQ3qnheesdS7sXDy9LY+wlERZtXrPTFFEZKi/29rfKpa4n2AklERc71fxvpmQSUel43SzOGPlkzMNZ5tadyfM4HkURFHuHXDuu1Zc23+/tkNvL+1JmJ5qx2c9/wCrnqe/oPIiLv7WhrQ1oAA2ACx5a6jgqY6aaqhjnl/NxPkAc/1DqVjy11JBUx001VDHPL+bifIA5/qHUqxLW0kNRHTS1MMc0v5uN0gDn+odSsWe6W+lrIqOorqeKpn/ADUL5Wte/wBQJyVg6osw1BpuutZIa6oiIY49A4btPvAWDqezDUGm661khrqiIhjj0Dhu0+8BYWpLQL9p6tthIaZ4yGE9zhu0+8Ba/WFhGpdK19pBAkni/JE9A8Hmb8QFp9AakFytTbTXfkbvbR2FRA/Zx5dg4DvHTPn6wtPoDUguVqbaa78jd7aOwqIH7OPLsHAd4xjPn6wtRoXUIuNsFqrfyN1tw7Gogfs48uwcPHz8/WFoeGeq2XSzssdwJp7zam/J56eTZzg3YOA79sA+frClqlqlSnC1t81Da9OUQq7pUiGMnlaAC5zz4Bo3K1t81DbNOUQq7nUiGMnlaAC5zz4Bo3K196v1t0/RiquVSIWE8rQAXOefAAblanUWqLRpahFXdqoQsc7lY0Dme8+TRuVp9fWWXUukS6gDjVQObVUw5cOJAzjB6EgnbxwtPr2yy6k0iXUAcaqBzaqmHLhxIGcYPQkE7eOFqNc2eXUWlSaEONVAW1VOMYcSN8YPQkE+3C0PEmxS6s0QJrc17qqnLaymbylr3YG7cHcHlJ28QFl6O1VS6ps8c7HtbWRgNqoDs6N/ft4HuWXo/VVLqizxzse1tZG0NqoDs6N/ft4HuWVpLU9NqW0smY8Nq4wG1MB2cx/ft4HuWboTWdJq+yRytka2vhaG1cBOHMeNicfsnqD7O5b9b9b1SfKiXEDVEdntD7dSHtrtcG9jTQM3eObbmx3ddvE+1RLX+qI7PaH26kPbXa4N7GmgZu8c23Nju67eJ9qi2utSstNqfb6U9rdK5vY08DN3Dm25se3bxPtUH4m6wisllktFE7trxcm9hBBHu9odsXEd3XA8T6isqw2L6OaEZbHYMsdM8ykd7yCXfE49iyrDY/o5oRlsdgyx0zzKR3vIJd8Tj2LJsll+j+iWW52DLHTPMpHe8gk/E49iy9P6edpfhr81yY7dlJK+cj/WOaS4ezOPYtdwk/QCk/iy/iK13CX9AKT+LL+IrX8K/wBBaX+JJ+IrX8Fvs7pv48v4lNVNVMVPlALf9t10/wBmM/6FAaD7bbp/sxn/AEKDUP2y3L/ZzP8AoXNLd/8AcHdf9mN+6JT9T5TldLUC4wfoxQ/7Si/C5QLi/wDozQ/7Si/C5Qfix+jdF/tGL8LlzTjn+idv/wBpM/A9T1T1ThdLVuaCKphfDPEyWJ4w5j2gtcPAgq3NBFUwvhniZLG8Ycx7QQ4eBBVuaGKoidDNGySN4w5j25Dh5hWqmmgrKd9PUwxzQyDlfHI0Oa4eBBUEvPB+xXB7pbfLNbZDvyx+nH/wnp7CoJeeEFir3ult8s1tkO/LH6cf/CensKhN34T2Sue6Wglltzzvys9OP/hPT2Fc5v3A/T9xkdNa6ia1yO35GjtIv+E7j3qMzcE7qH/kbvRPb3F8b2n+ajU3BS6h/wCRu9G9vi+N7T/NRyXg5dA/8ldaN7fF8bmn+aic3AK9h5EN4oHt7i9r2n3YKyqHglKXA3C9NDe9tPDufa4/yWVQ8E5S4G4Xpob3tp4dz7XH+SyqLg3IXA194aG97aeHc+1x/ksy38AagvBuV9jawdW00JcT7XEY9ynentE2LTWH0FIHVGMGomPPIfb3ezCnentE2LTWH0NIHVGMGomPPIfb3ezCm1h0bZNO4fRUodPjBqJTzye/u9mF0TTHD3TulMS0FH2lUBg1U555PYejfYApAt+t6pOiIiIijuutNzar0pU2mnnZBNK5jmPkBLctcDg437kRFq+Geh6zRNurIq6qhnmqpWuxDnlaAMDcgb7oiKbIiIiItJqLR9i1VAI7tQsle0YZM30ZGepw39nRERc1unAFpeXWm+Fre6Oqizj+83/siItY3gHfS/07tbg3xAeT7uVERSKy8B7TSvbLeLlPXkb9lE3smHyJySfYQiIul2210Fno2UdupIqWnZ0jibgevzPmURFloiLW6itTr5p24WtkoidV074mvIyGkjYlERQvhnw3uGi7hW1lwrKaZ08QiYyDmIxnJJJA8AiIsvjN9nFZ/Gh/GERFHf8AJ/8A6LvP8eL8JREXSr5p20ajo/kt2oYqqMfVLhhzD4tcNx7ERFzS78A6SSR0lnvElOD0iqY+0A/vDB+BREWk/wAwd+5v6Wt3L4/lM+7lREW8tHAOjikbJeLxLUAdYqaPswf7xyfgERF0uyaftOnaP5JaaGKli/W5B6Tz4ucdyfWiItkiIiIijmp9B6f1a3muVHioAw2phPJKPb3jyOURFze48AagSE2y+ROYejamEtI9rc59yIixYOAV5dIBUXmhjZ3mNj3n3ED70RFNNOcGtN2SVlRW9pdahpyDUACMH/2Dr7SURF0BrWsaGtADQMADoERFVQDVHDao1BrCG9R3NsMP5PtGFpL2cn7B6b/AqAan4b1F/wBYQ3qO5thh/J9owtJezk/YPTf4FQXUvDye+6shvEdxbDF+T7RhaS9vJ+wfP4Fcz1fwpq9S62jvkV2ZBTv7PtWOB7SPlwPQxtvjO+MEqfqfqdLpajWpND2/UFSyvjmmt9zi+pW0x5X+XN4/f5qNak0Rb9QVLK9k01vucX1K2mPK/bpnx+/zUd1Doygv1QyuZLLQXGP6lZTHD/LPj96ieq+Hls1NVMuUU01susX1K2lOHHHTmHf69j5rUjT/ABFhb2EWr6SSIbCSWkHaY9x+9aoWDiJC3sItXUkkQ2EktIO0x7j961YsWv4h2MWq6V8Q2EklKO0x7v5rSjTHFCBnyeHWlJJCNhJLB+Ux/wAB+9Zdn4fQU9ybdr7cJ73cWbskqNmRn91v+PUsqz8P4Ke5Nu19uE97uLN2SVGzIz+63/HqWVadBwwXBt1vdfNebgzdj59mRn91v+PUsyxcMKemujbzqO5T365MILH1H5uMjphpJzjuzt5KYKYKWKdKIX7h7SXK4m72qtns1zO7p6bo8+Lm7b+rr35UQv3D2kuVxN2tVbPZ7md3T03R58XN239XXvyonfNBUtwuButrrJrRcju6an6PPi5u3w9uVBtScL6K6XM3my109jupPMZqbZrz4kAjBPeQd+8Fa/6M8RHt7B+soGw9O0ZT/lMe7+a1/wBGuIjx2D9YwNh6doyn/KY9381g/RzX7x2L9XQti6c7YPTx7v5rWnSPE+RvyeTXEDYenOyP8pj/AIQfittprQVusFU64zzTXK5v+tWVJy4ePKO717nzW203oO32CqdcZ5prlc3/AFqupOXDx5R3evcraad0PQWKqdXzTS3C5P8ArVdQcuHjyju9e5W60nw1tmm6w3Opnlut2fuayp3LSevKN8HzJJUjqoTUUk0IIaZI3NBPdkYUjqoTUUk0IIBkY5oJ7sjCkNTEZ6WWEEAyMc0E92RhSqvp3VdvqKZrg100TmAnoMgj+a02idPT6Y0zBa6maOaWNz3OfGDy7uztlabRWn59MaZgtdTNHNLG57nPjB5d3Z2ytPo6wz6b05BbamaOaWNz3OdGDy7nPetFoDTNTpLSsNqrJoppmSPe50WeX0jkdcLfrfreqSqNU2mamDiDWakdURGnqKNsDYgDzhwxue7GyjVNpmpg4g1mo3VERp6ikbA2IA84cMbnuxso7TacqIdeVeoTPEYJ6RsLYwDzhwxue7GyiVLpGrg4nVuqnVEJpaijEDYhnnDsMG/dj0fipKpKpEpao3rjTNRqm001FTVEUDoqtk7nSAkFoBBAx37qN6301UaptNNR01RFA6KrZO50gJBaAQRt37qPaz05UamtVPR088cLoqpkxdICQQAQRt37qJcRNI1esbLS0NHUQwPhq2zOdNnBaA4HGO/dSRSRSFS1ERERERERERERERERERERERERERERERERERERERERERERERERERERFBOM32cVn8aH8YREUd/yf/6LvP8AHi/CURF11ERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERYs1ypILjT2+WZramqa90Ufe4NxzfesWa5UkFxp7fJM1tTVNe6KPvcG45vvWLLcaWC4U9BJM1tRUte6KPvcG4z96w57rRU9z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";
  var hoyStr = new Date().toLocaleDateString("es-ES",{day:"2-digit",month:"2-digit",year:"numeric"});
  var paginas = [];
  lista.forEach(function(r){
    var lineas = r.lineas&&r.lineas.length ? r.lineas : [{tipo:r.tipo,talla:r.talla,uds:r.uds||1,extras:r.extras||[]}];
    lineas.forEach(function(l){
      var uds = l.uds||1;
      for(var u=0;u<uds;u++){
        var t = tipos[l.tipo]||{label:l.tipo||"",icon:""};
        var asig = r.bikesAsig&&r.bikesAsig.filter(function(a){return a.tipo===l.tipo&&a.talla===l.talla;});
        var bikeNum = asig&&asig[u] ? asig[u].num : "-";
        var extrasLinea = l.extras&&l.extras.length ? l.extras.slice() : [];
        var fechaIni = r.ini ? new Date(r.ini+"T00:00:00") : null;
        var fechaEntrega = fechaIni ? new Date(fechaIni.getTime()-86400000) : null;
        paginas.push({resId:r.id,cliente:r.cliente||"",tel:r.tel||"",
          fechaEntrega:fechaEntrega?fechaEntrega.toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long",year:"numeric"}):"-",
          lugarIni:r.lugarIni||"",lugarFin:r.lugarFin||"Santiago de Compostela",dirEntrega:r.dirEntrega||"",
          fechaIni:fechaIni?fechaIni.toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"}):"-",
          fechaFin:r.fin?new Date(r.fin+"T00:00:00").toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"}):"-",
          dias:r.dias||"",modelo:t.label,icon:t.icon||"",talla:l.talla||r.talla||"",
          bikeNum:bikeNum,extras:extrasLinea,notas:r.notas||""});
      }
    });
  });
  var css="*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;background:#fff;color:#111}.hoja{width:190mm;margin:10mm auto;border:2px solid #111;border-radius:4px;overflow:hidden;page-break-after:always}.hoja:last-child{page-break-after:auto}.cab{display:flex;justify-content:space-between;align-items:center;padding:6mm 8mm;border-bottom:2px solid #111}.cab img{height:20mm;width:auto;max-width:80mm;object-fit:contain}.cab-qr{display:flex;flex-direction:column;align-items:center;gap:2px}.qr-lbl{font-size:9px;font-weight:700;color:#374151;text-align:center}.body{padding:4mm 8mm 2mm}.campo{border:1.5px solid #374151;border-radius:4px;margin-bottom:4px;overflow:hidden}.lbl{background:#1f2937;color:#fff;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;padding:3px 8px}.val{padding:5px 10px;font-size:14px;font-weight:800;min-height:22px}.val.grande{font-size:18px;font-weight:900}.val.alerta{font-size:15px;font-weight:900;color:#b45309;background:#fffbeb}.g2{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:4px}.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-bottom:4px}.g2 .campo,.g3 .campo{margin-bottom:0}.ext-val{padding:5px 10px;display:flex;flex-wrap:wrap;gap:4px;min-height:22px}.tag{background:#fef3c7;border:1px solid #fcd34d;border-radius:3px;padding:2px 7px;font-size:11px;font-weight:700;color:#92400e}.obs-val{padding:5px 10px;min-height:18mm;font-size:13px}.pie{border-top:2px solid #111;padding:4mm 8mm;display:flex;justify-content:space-between;align-items:flex-end;background:#f9fafb}.pie-txt{font-size:10px;color:#6b7280}.firma{border-top:1px solid #374151;width:65mm;text-align:center;padding-top:3px;font-size:10px;color:#6b7280;font-weight:700}@media print{@page{margin:8mm;size:A4 portrait}body{margin:0}.hoja{margin:0 auto;border-radius:0}}";
  function xe(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
  var hojas="";
  paginas.forEach(function(p,i){
    var sitio=p.dirEntrega||p.lugarFin||"Santiago de Compostela";
    var extHtml="";
    if(p.extras&&p.extras.length){p.extras.forEach(function(e){extHtml+="<span class=\"tag\">"+(e.icono||"")+" "+xe(e.nombre||"Extra")+(e.qty>1?" x"+e.qty:"")+"</span>";});}
    else{extHtml="<span style=\"color:#9ca3af;font-size:12px\">Sin extras</span>";}
    hojas+="<div class=\"hoja\">"
      // Cabecera: logo izq, QR der
      +"<div class=\"cab\"><img src=\""+LOGO+"\" alt=\"Bicips\"/>"
      +"<div class=\"cab-qr\"><div id=\"qr"+i+"\"></div><div class=\"qr-lbl\">Reserva #"+p.resId+"</div></div></div>"
      +"<div class=\"body\">"
      // Fila 1: Lugar inicio (izq) + Entregar antes de (der, doble alto)
      +"<table style=\"width:100%;border-collapse:separate;border-spacing:4px;margin-bottom:4px;\">"
      +"<tr>"
      +"<td style=\"width:50%;border:2px solid #374151;border-radius:4px;overflow:hidden;padding:0;vertical-align:top\">"
      +"<div class=\"lbl\">Lugar de inicio</div><div style=\"padding:10px 12px;font-size:22px;font-weight:900;min-height:50px;display:flex;align-items:center\">"+xe(p.lugarIni||"-")+"</div></td>"
      +"<td style=\"width:50%;border:2px solid #b45309;border-radius:4px;overflow:hidden;padding:0;vertical-align:top;background:#fffbeb\">"
      +"<div class=\"lbl\" style=\"background:#b45309\">Fecha max. de entrega</div><div style=\"padding:10px 12px;font-size:20px;font-weight:900;min-height:50px;display:flex;align-items:center;color:#b45309\">"+xe(p.fechaEntrega)+"</div></td>"
      +"</tr></table>"
      // Fila 2: Dirección de entrega
      +"<div class=\"campo\"><div class=\"lbl\">Direccion de entrega</div><div class=\"val grande\">"+xe(sitio)+"</div></div>"
      // Fila 3: Nombre cliente + telefono
      +"<div class=\"campo\"><div class=\"lbl\">Cliente</div><div class=\"val grande\">"+xe(p.cliente)+(p.tel?" &nbsp;|&nbsp; "+xe(p.tel):"")+"</div></div>"
      // Fila 4: Inicio - Fin alquiler
      +"<div class=\"g2\"><div class=\"campo\"><div class=\"lbl\">Inicio alquiler</div><div class=\"val\">"+xe(p.fechaIni)+"</div></div>"
      +"<div class=\"campo\"><div class=\"lbl\">Fin alquiler</div><div class=\"val\">"+xe(p.fechaFin)+" ("+p.dias+" dias)</div></div></div>"
      // Fila 5: Modelo + Talla + N.bici
      +"<div class=\"g3\"><div class=\"campo\"><div class=\"lbl\">Modelo</div><div class=\"val\">"+p.icon+" "+xe(p.modelo)+"</div></div>"
      +"<div class=\"campo\"><div class=\"lbl\">Talla</div><div class=\"val\">"+xe(p.talla)+"</div></div>"
      +"<div class=\"campo\"><div class=\"lbl\">N. bici</div><div class=\"val\">"+xe(p.bikeNum)+"</div></div></div>"
      // Fila 6: Extras
      +"<div class=\"campo\"><div class=\"lbl\">Extras y accesorios</div><div class=\"ext-val\">"+extHtml+"</div></div>"
      // Fila 7: Observaciones
      +"<div class=\"campo\"><div class=\"lbl\">Observaciones</div><div class=\"obs-val\">"+xe(p.notas)+"</div></div>"
      +"</div><div class=\"pie\"><div class=\"pie-txt\">Impreso: "+hoyStr+"</div><div class=\"firma\">Firma transportista</div></div>"
      +"</div>";
  });
  var qrData=JSON.stringify(paginas.map(function(p,i){return {id:i,resId:p.resId,cliente:p.cliente};}));
  var qrScript="var ids="+qrData+";window.onload=function(){ids.forEach(function(x){try{new QRCode(document.getElementById(\"qr\"+x.id),{text:\"Res#\"+x.resId+\" \"+x.cliente,width:70,height:70,colorDark:\"#1f2937\",colorLight:\"#fff\",correctLevel:QRCode.CorrectLevel.M});}catch(e){}});setTimeout(function(){window.print();},800);};";
  var qrLib="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
  var html="<!DOCTYPE html><html lang=\"es\"><head><meta charset=\"UTF-8\"/><title>Hojas Bici</title><script src=\""+qrLib+"\"><\/script><style>"+css+"</style></head><body>"+hojas+"<script>"+qrScript+"<\/script></body></html>";
  try{
    var w=window.open("","_blank");
    if(!w||w.closed) throw new Error("popup");
    w.document.open();w.document.write(html);w.document.close();
  }catch(e){
    var ov=document.createElement("div");
    ov.style.cssText="position:fixed;inset:0;background:#fff;z-index:99999;overflow:auto";
    ov.innerHTML="<button onclick=\"this.parentNode.remove()\" style=\"position:fixed;top:10px;right:10px;padding:7px 14px;background:#ef4444;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer;z-index:100000\">Cerrar</button><iframe id=\"hbf\" style=\"width:100%;height:100%;border:none\"></iframe>";
    document.body.appendChild(ov);
    var fr=document.getElementById("hbf");
    fr.contentDocument.open();fr.contentDocument.write(html);fr.contentDocument.close();
  }
}

// ══════════════════════════════════════════════════════════════
//  RECOGIDA DE BICICLETA — Botón lateral
// ══════════════════════════════════════════════════════════════
var _recCamStream = null;
var _recCamInterval = null;
var _recCamActiva = false;

function abrirRecogidaQR() {
  closeSB();
  document.getElementById('rec-resultado').innerHTML = '';
  document.getElementById('rec-qr-inp').value = '';
  openM('m-recogida');
}

function cerrarRecogidaQR() {
  _pararCamaraRecogida();
  closeM('m-recogida');
}

function toggleCamaraRecogida() {
  var v = document.getElementById('rec-cam-video');
  var ph = document.getElementById('rec-cam-placeholder');
  var btn = document.getElementById('rec-cam-btn');
  if(_recCamActiva) {
    _recCamActiva = false;
    if(_recCamInterval){ clearInterval(_recCamInterval); _recCamInterval=null; }
    if(_recCamStream){ _recCamStream.getTracks().forEach(function(t){t.stop();}); _recCamStream=null; }
    if(v){ v.srcObject=null; v.style.display='none'; }
    if(ph) ph.style.display='block';
    if(btn){ btn.textContent='📷 Activar cámara'; btn.style.background='#7c3aed'; }
    return;
  }
  navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}})
  .then(function(s){
    _recCamStream=s; _recCamActiva=true;
    v.srcObject=s; v.style.cssText='display:block;width:100%;min-height:200px;border-radius:8px;object-fit:cover';
    if(ph) ph.style.display='none';
    if(btn){ btn.textContent='⏹ Parar cámara'; btn.style.background='#6b7280'; }
    v.play();
    _recCamInterval=setInterval(function(){
      if(!v.videoWidth) return;
      var c=document.createElement('canvas'); c.width=v.videoWidth; c.height=v.videoHeight;
      c.getContext('2d').drawImage(v,0,0);
      try{ var q=jsQR(c.getContext('2d').getImageData(0,0,c.width,c.height).data,c.width,c.height);
        if(q&&q.data){ toggleCamaraRecogida(); _procesarRecogida(q.data); }
      }catch(e){}
    },300);
  }).catch(function(e){ toast('⚠️ Cámara: '+e.message); });
}

function _pararCamaraRecogida() {
  if(_recCamInterval){ clearInterval(_recCamInterval); _recCamInterval = null; }
  if(_recCamStream){ _recCamStream.getTracks().forEach(function(t){t.stop();}); _recCamStream = null; }
  _recCamActiva = false;
  var video = document.getElementById('rec-cam-video');
  var placeholder = document.getElementById('rec-cam-placeholder');
  var btn = document.getElementById('rec-cam-btn');
  if(video){ video.style.display = 'none'; video.srcObject = null; }
  if(placeholder) placeholder.style.display = 'block';
  if(btn){ btn.textContent = '📷 Activar cámara'; btn.style.background = '#7c3aed'; }
}

function buscarRecogidaManual() {
  var val = (document.getElementById('rec-qr-inp').value || '').trim();
  if(!val) { toast('Escribe el número o código de la bici'); return; }
  _procesarRecogida(val);
}

function _procesarRecogida(codigo) {
  var q = codigo.trim().toUpperCase();
  // Find bike by num, QR or serial
  var bici = bikes.find(function(b){
    return (b.numBici||'').toUpperCase()===q
      || (b.qr||'').toUpperCase()===q
      || (b.numSerie||'').toUpperCase()===q;
  });
  var el = document.getElementById('rec-resultado');
  if(!el) return;

  if(!bici) {
    el.innerHTML = '<div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:12px;color:#991b1b;font-weight:700">❌ No se encontró ninguna bici con ese código</div>';
    return;
  }

  // Find active reservation for this bike
  var res = reservas.find(function(r){
    return (['alquiler','entregada','pendiente_recoger','transito_furgo','transito_carlos','transito_seur'].indexOf(r.estado)>=0)
      && r.bikesAsig && r.bikesAsig.some(function(a){return a.id===bici.id;});
  });

  var t = tipos[bici.tipo]||{label:bici.tipo||'',icon:'🚲'};
  var estBici = BIKE_ESTADOS ? (BIKE_ESTADOS[bici.estado]||{icon:'',lbl:bici.estado}) : {icon:'',lbl:bici.estado};

  var resHtml = res
    ? '<div style="margin-top:8px;background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:10px">'
      + '<div style="font-size:12px;font-weight:700;color:#15803d;margin-bottom:4px">📋 Reserva encontrada</div>'
      + '<div style="font-weight:700">'+esc(res.cliente)+'</div>'
      + '<div style="font-size:12px;color:#374151">'+fmtD(res.ini)+' → '+fmtD(res.fin)+'</div>'
      + '</div>'
    : '<div style="margin-top:8px;background:#fef3c7;border:1px solid #fcd34d;border-radius:6px;padding:10px;font-size:13px;color:#92400e">⚠️ No se encontró reserva activa para esta bici</div>';

  el.innerHTML = '<div style="background:#f0fdf4;border:2px solid #22c55e;border-radius:8px;padding:14px">'
    + '<div style="font-size:18px;font-weight:900;margin-bottom:4px">'+t.icon+' '+esc(bici.numBici)+'</div>'
    + '<div style="font-size:13px;color:#374151;margin-bottom:2px">'+esc(t.label)+' '+esc(bici.talla)+'</div>'
    + '<div style="font-size:12px;color:#6b7280">Estado actual: '+estBici.icon+' '+estBici.lbl+'</div>'
    + resHtml
    + '</div>'
    + '<div style="margin-top:12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px">'
    + '<div style="font-weight:700;font-size:13px;margin-bottom:8px">✅ Confirmar recogida</div>'
    + '<label style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:13px;cursor:pointer">'
    + '<input type="checkbox" id="rec-chk-bici" checked> Marcar bici como <strong>Disponible</strong></label>'
    + '<label style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:13px;cursor:pointer">'
    + '<input type="checkbox" id="rec-chk-res" '+(res?'checked':'disabled')+'> '+(res?'Marcar reserva como <strong>Finalizada</strong>':'Sin reserva activa')+'</label>'
    + '<label style="display:flex;align-items:center;gap:8px;margin-bottom:10px;font-size:13px;cursor:pointer">'
    + '<input type="checkbox" id="rec-chk-taller"> Enviar a <strong>Taller</strong> para revisión</label>'
    + '<button onclick="_confirmarRecogida('+bici.id+','+(res?res.id:'null')+')" style="width:100%;padding:11px;background:#0d9488;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:800;cursor:pointer">🏁 Confirmar recogida</button>'
    + '</div>';
}

function _confirmarRecogida(bikeId, resId) {
  var chkBici = document.getElementById('rec-chk-bici');
  var chkRes = document.getElementById('rec-chk-res');
  var chkTaller = document.getElementById('rec-chk-taller');

  var bici = bikes.find(function(b){return b.id===bikeId;});
  if(!bici) { toast('❌ Bici no encontrada'); return; }

  // Update bike status
  if(chkBici && chkBici.checked) {
    bici.estado = chkTaller && chkTaller.checked ? 'averiada' : 'disponible';
    if(!bici.estadosHist) bici.estadosHist=[];
    bici.estadosHist.push({estado:bici.estado,fecha:new Date().toLocaleString('es-ES'),ts:new Date().toISOString(),nota:'Recogida'});
    DB.saveBici(bici).catch(function(e){console.error('recogida saveBici',e);});
  }

  // Update reservation
  if(resId && chkRes && chkRes.checked) {
    var res = reservas.find(function(r){return r.id===resId;});
    if(res) {
      res.estado = 'finalizada';
      sR();
    }
  }

  var msgs = [];
  if(chkBici && chkBici.checked) msgs.push('bici '+bici.numBici+' → '+(chkTaller&&chkTaller.checked?'taller':'disponible'));
  if(resId && chkRes && chkRes.checked) msgs.push('reserva finalizada');

  cerrarRecogidaQR();
  toast('✅ Recogida confirmada: '+msgs.join(', '));
  renderDash();
  if(CV==='flota') renderFlota();
  if(CV==='res') renderRes();
}


function exportCSV(){var headers=['ID','Cliente','Telefono','Email','Modelos','Fechas','Dias','Total','Estado','Origen','Bicis asignadas','Notas'];var rows=reservas.map(function(r){var bLine=r.lineas&&r.lineas.length>1?r.lineas.map(function(l){var tl=tipos[l.tipo]||{label:l.tipo};return tl.label+' '+l.talla+(l.uds>1?' x'+l.uds:'');}).join(' | '):(tipos[r.tipo]||{label:r.tipo}).label+' '+r.talla+(r.uds>1?' x'+r.uds:'');return[r.id,'"'+(r.cliente||'').replace(/"/g,'""')+'"',r.tel||'',r.email||'','"'+bLine.replace(/"/g,'""')+'"',r.ini+' - '+r.fin,r.dias,r.total||0,r.estado||'',r.origen||'interno','"'+(r.bikesAsig?r.bikesAsig.map(function(b){return b.num;}).join(', '):'').replace(/"/g,'""')+'"','"'+(r.notas||'').replace(/"/g,'""')+'"'].join(',');});var csv=[headers.join(',')].concat(rows).join('\n');var blob=new Blob([csv],{type:'text/csv;charset=utf-8'});var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download='reservas_'+todayS()+'.csv';document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);toast('CSV descargado');}

// PORTAL PUBLICO
function openPublicPortal(){renderPublic();openM('mpublic');}
function renderPublic(){var biz=cfg.bizName||'VeloRentas';var tipoOpts=Object.keys(tipos).map(function(k){var t=tipos[k];return '<option value="'+k+'">'+t.icon+' '+t.label+'</option>';}).join('');document.getElementById('mpublic-body').innerHTML='<div style="max-width:680px;margin:0 auto"><div style="text-align:center;margin-bottom:22px"><div style="font-family:var(--fontd);font-size:22px;font-weight:800;margin-bottom:4px">🚲 '+esc(biz)+'</div><div style="font-size:14px;color:var(--g400)">Reserva tu bicicleta online</div></div><div style="background:var(--g50);border:1px solid var(--g200);border-radius:14px;padding:20px;margin-bottom:16px"><div style="font-family:var(--fontd);font-size:15px;font-weight:700;margin-bottom:14px">1 - Elige fechas y modelo</div><div class="fr2" style="margin-bottom:10px"><div><label class="fl">Fecha de recogida</label><input class="fi" id="pub-ini" type="date" min="'+todayS()+'" onchange="pubCalc();pubChk()"/></div><div><label class="fl">Fecha de devolución</label><input class="fi" id="pub-fin" type="date" min="'+todayS()+'" onchange="pubCalc();pubChk()"/></div></div><div id="pub-dinfo" style="display:none;font-size:13px;padding:7px 11px;border-radius:8px;margin-bottom:10px"></div><div class="fr3"><div><label class="fl">Modelo</label><select class="fi" id="pub-tipo" onchange="pubTC();pubChk()"><option value="">- Modelo -</option>'+tipoOpts+'</select></div><div><label class="fl">Talla</label><select class="fi" id="pub-talla" onchange="pubChk()"><option value="">- Talla -</option></select></div><div><label class="fl">Unidades</label><input class="fi" id="pub-uds" type="number" min="1" value="1" onchange="pubChk()"/></div></div></div><div id="pub-avail"></div><div id="pub-form" style="display:none"><div style="background:#fff;border:1px solid var(--g200);border-radius:14px;padding:20px;margin-bottom:14px"><div style="font-family:var(--fontd);font-size:15px;font-weight:700;margin-bottom:14px">2 - Tus datos</div><div class="fr2"><div class="fg"><label class="fl">Nombre</label><input class="fi" id="pub-nom" placeholder="Nombre completo"/></div><div class="fg"><label class="fl">Teléfono</label><input class="fi" id="pub-tel" type="tel" placeholder="+34 600 000 000"/></div></div><div class="fr2"><div class="fg"><label class="fl">Email</label><input class="fi" id="pub-email" type="email" placeholder="tu@email.com"/></div><div class="fg"><label class="fl">DNI / Pasaporte</label><input class="fi" id="pub-dni" placeholder="12345678A"/></div></div><div class="fr2"><div class="fg"><label class="fl">📍 Lugar de inicio</label><input class="fi" id="pub-lugar-ini" placeholder="Ej: Saint-Jean-Pied-de-Port"/></div><div class="fg"><label class="fl">🏁 Lugar final</label><input class="fi" id="pub-lugar-fin" value="Santiago de Compostela" placeholder="Santiago de Compostela"/></div></div><div class="fg"><label class="fl">Notas</label><textarea class="fi" id="pub-notas" placeholder="Peticiones especiales..."></textarea></div></div><div style="background:var(--am50);border:1px solid var(--am100);border-radius:10px;padding:11px 14px;margin-bottom:14px;font-size:13px;color:var(--am700)">Tu reserva quedará pendiente de confirmación. La bicicleta se asigna en recogida.</div><button class="btn bp bfull" onclick="pubSubmit()">Solicitar reserva</button></div><div id="pub-ok" style="display:none;text-align:center;padding:32px;background:var(--gr50);border:1px solid var(--gr500);border-radius:14px"><div style="font-size:44px;margin-bottom:10px">✅</div><div style="font-family:var(--fontd);font-size:18px;font-weight:700;color:var(--gr700);margin-bottom:6px">Solicitud enviada</div><div style="font-size:13px;color:var(--gr600);margin-bottom:18px">Nos pondremos en contacto para confirmar tu reserva.</div><button class="btn bs" onclick="pubReset()">Hacer otra reserva</button></div><div style="border-top:1px solid var(--g200);margin-top:20px;padding-top:14px;font-size:12px;color:var(--g500)"><div style="font-weight:700;margin-bottom:6px">Condiciones:</div><div>- Minimo '+cfg.minDays+' dias de alquiler</div><div>- '+cfg.gapDays+' dias de preparación entre alquileres</div><div>- Recogida y devolución en tienda</div></div></div>';}
function pubTC(){var t=tipos[document.getElementById('pub-tipo').value]||{sizes:[]};document.getElementById('pub-talla').innerHTML='<option value="">- Talla -</option>'+t.sizes.map(function(s){return '<option value="'+s+'">'+s+'</option>';}).join('');document.getElementById('pub-avail').innerHTML='';document.getElementById('pub-form').style.display='none';}
function pubCalc(){var ini=document.getElementById('pub-ini').value,fin=document.getElementById('pub-fin').value;var el=document.getElementById('pub-dinfo');if(!ini||!fin){el.style.display='none';return;}var d=diffD(ini,fin)+1;el.style.display='block';if(d<cfg.minDays){el.style.cssText='display:block;background:var(--r50);color:var(--r600);font-size:13px;padding:7px 11px;border-radius:8px;margin-bottom:10px';el.innerHTML='Minimo '+cfg.minDays+' dias - seleccionados: '+d;}else{el.style.cssText='display:block;background:var(--gr50);color:var(--gr700);font-size:13px;padding:7px 11px;border-radius:8px;margin-bottom:10px';el.innerHTML=d+' dias';}}
function pubChk(){var ini=document.getElementById('pub-ini').value,fin=document.getElementById('pub-fin').value,tipo=document.getElementById('pub-tipo').value,talla=document.getElementById('pub-talla').value,uds=parseInt(document.getElementById('pub-uds').value)||1;var el=document.getElementById('pub-avail');var form=document.getElementById('pub-form');el.innerHTML='';form.style.display='none';if(!ini||!fin||!tipo||!talla)return;if(ini>fin||diffD(ini,fin)+1<cfg.minDays)return;var cnt=getAvailCount(tipo,talla,ini,fin);var t=tipos[tipo]||{label:tipo};if(cnt>=uds){el.innerHTML='<div class="avr ok" style="display:block;margin-bottom:14px">'+cnt+' bicicleta'+(cnt>1?'s':'')+' disponibles de '+t.label+' talla '+talla+'.</div>';form.style.display='block';}else{el.innerHTML='<div class="avr ko" style="display:block;margin-bottom:14px">Sin disponibilidad para '+t.label+' talla '+talla+' (disponibles: '+cnt+', solicitadas: '+uds+').</div>';}}
function pubSubmit(){var nom=document.getElementById('pub-nom').value.trim(),tel=document.getElementById('pub-tel').value.trim(),email=document.getElementById('pub-email').value.trim(),tipo=document.getElementById('pub-tipo').value,talla=document.getElementById('pub-talla').value,ini=document.getElementById('pub-ini').value,fin=document.getElementById('pub-fin').value,uds=parseInt(document.getElementById('pub-uds').value)||1;if(!nom){toast('Nombre requerido');return;}if(!tel){toast('Teléfono requerido');return;}if(!email){toast('Email requerido');return;}var cnt=getAvailCount(tipo,talla,ini,fin);if(cnt<uds){toast('Sin disponibilidad');return;}reservas.push({id:Date.now(),cliente:nom,tel:tel,email:email,dni:document.getElementById('pub-dni').value.trim(),tipo:tipo,talla:talla,uds:uds,bikeId:null,bikeNum:'',lineas:[{tipo:tipo,talla:talla,uds:uds,ppd:0}],bikesAsig:[],ini:ini,fin:fin,dias:diffD(ini,fin)+1,ppd:0,total:0,precio:0,estado:'pendiente',lugarIni:(document.getElementById('pub-lugar-ini')||{value:''}).value.trim(),lugarFin:(document.getElementById('pub-lugar-fin')||{value:'Santiago de Compostela'}).value.trim()||'Santiago de Compostela',notas:document.getElementById('pub-notas').value.trim(),extras:[],ts:new Date().toISOString(),origen:'publico'});sR();updBadge();document.getElementById('pub-form').style.display='none';document.getElementById('pub-avail').innerHTML='';document.getElementById('pub-ok').style.display='block';if(CV==='dash')renderDash();if(CV==='res')renderRes();}
function pubReset(){document.getElementById('pub-ok').style.display='none';document.getElementById('pub-avail').innerHTML='';document.getElementById('pub-form').style.display='none';['pub-nom','pub-tel','pub-email','pub-dni','pub-notas','pub-ini','pub-fin','pub-lugar-ini'].forEach(function(id){document.getElementById(id).value='';});var plfin=document.getElementById('pub-lugar-fin');if(plfin)plfin.value='Santiago de Compostela';document.getElementById('pub-tipo').value='';document.getElementById('pub-talla').innerHTML='<option value="">- Talla -</option>';document.getElementById('pub-dinfo').style.display='none';}

// EXTRAS SYSTEM
var EXTRAS_DEF = [
  {id:1, nombre:'Casco',                   icono:'⛑️', precio:2},
  {id:2, nombre:'Credencial peregrino',     icono:'📜', precio:3},
  {id:3, nombre:'Bolsa de manillar',        icono:'👜', precio:4},
  {id:4, nombre:'Alforja trasera',          icono:'🎒', precio:5},
  {id:5, nombre:'Chubasquero',              icono:'🧥', precio:3},
  {id:6, nombre:'Candado',                  icono:'🔒', precio:2},
  {id:7, nombre:'Linterna delantera',       icono:'🔦', precio:2},
  {id:8, nombre:'Mapa / Guia',              icono:'🗺️', precio:2},
  {id:9, nombre:'Portabidon + bidon',       icono:'🚰', precio:3},
  {id:10,nombre:'Kit reparacion pinchazos', icono:'🔧', precio:4}
];
var catalogoExtras = EXTRAS_DEF; // se carga desde DB en initApp()

function saveExtrasCat(){DB.saveConfig('extras_cat', catalogoExtras).catch(function(e){console.error('saveExtrasCat',e);});}

// extras stored per linea: lineas[i].extras = [{id,nombre,icono,precio,qty}]

function openGestionExtras(){
  renderExtrasCatModal();
  openM('m-extras-cat');
}

function renderExtrasCatModal(){
  var el = document.getElementById('extras-cat-list');
  if(!el) return;
  if(!catalogoExtras.length){
    el.innerHTML = '<div style="font-size:13px;color:var(--g400);text-align:center;padding:16px">Sin extras en el catálogo</div>';
    return;
  }
  el.innerHTML = catalogoExtras.map(function(e,i){
    return '<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--g100)">' +
      '<span style="font-size:20px;width:28px;text-align:center">' + e.icono + '</span>' +
      '<div style="flex:1"><div style="font-weight:600;font-size:13px">' + esc(e.nombre) + '</div></div>' +
      '<span style="font-size:13px;font-weight:700;color:var(--te600)">' + (e.precio||0) + cfg.currency + '</span>' +
      '<button onclick="delExtraCat(' + i + ')" style="background:var(--r50);border:1px solid var(--r100);color:var(--r600);border-radius:6px;padding:3px 8px;cursor:pointer;font-size:12px;font-weight:700">✕</button>' +
    '</div>';
  }).join('');
}

function addExtraCat(){
  var nom = document.getElementById('ext-nombre').value.trim();
  var precio = parseFloat(document.getElementById('ext-precio').value)||0;
  var icono = document.getElementById('ext-icono').value.trim()||'📦';
  if(!nom){toast('Escribe el nombre del extra');return;}
  catalogoExtras.push({id:Date.now(), nombre:nom, icono:icono, precio:precio});
  saveExtrasCat();
  document.getElementById('ext-nombre').value='';
  document.getElementById('ext-precio').value='';
  document.getElementById('ext-icono').value='';
  renderExtrasCatModal();
  renderExtrasBici();
  toast('Extra añadido al catálogo');
}

function delExtraCat(i){
  catalogoExtras.splice(i,1);
  saveExtrasCat();
  renderExtrasCatModal();
  renderExtrasBici();
}

// Render extras section: one accordion per linea
function renderExtrasBici(){
  var el = document.getElementById('r-extras-bici');
  if(!el) return;
  var validLineas = lineas.filter(function(l){return l.tipo && l.talla;});
  if(!validLineas.length){
    el.innerHTML = '<div style="padding:12px 14px;font-size:12px;color:var(--g400);font-style:italic">Añade bicicletas arriba para asignarles extras</div>';
    return;
  }
  var html = '';
  lineas.forEach(function(l, li){
    if(!l.tipo || !l.talla) return;
    var t = tipos[l.tipo]||{icon:'🚲',label:l.tipo};
    var extras = l.extras || [];
    var totalExtra = extras.reduce(function(s,e){return s+(e.precio||0)*(e.qty||1);},0);
    var udsLabel = l.uds > 1 ? ' ×'+l.uds : '';
    html += '<div style="border-bottom:1px solid var(--g100)">';
    // Header row
    html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#f9fafb;cursor:pointer" onclick="toggleExtrasPanel('+li+')">';
    html += '<span style="font-size:18px">' + t.icon + '</span>';
    html += '<div style="flex:1;font-size:13px;font-weight:700">' + esc(t.label) + ' ' + esc(l.talla) + udsLabel + '</div>';
    if(totalExtra > 0){
      html += '<span style="font-size:12px;font-weight:700;color:var(--te600)">+' + totalExtra.toFixed(0) + cfg.currency + '</span>';
    }
    html += '<span style="font-size:11px;color:var(--g400);background:var(--g100);border-radius:4px;padding:2px 7px">';
    html += extras.length ? extras.length + ' extra' + (extras.length>1?'s':'') : 'Sin extras';
    html += '</span>';
    html += '<span style="color:var(--g400);font-size:14px">▾</span>';
    html += '</div>';
    // Panel (extras for this linea)
    html += '<div id="extras-panel-'+li+'" style="display:none;padding:10px 14px;background:#fff">';
    // Selected extras for this linea
    if(extras.length){
      html += '<div style="margin-bottom:8px">';
      extras.forEach(function(e, ei){
        html += '<div style="display:flex;align-items:center;gap:7px;padding:6px 0;border-bottom:1px solid #f3f4f6">';
        html += '<span style="font-size:18px">' + e.icono + '</span>';
        html += '<div style="flex:1;font-size:13px;font-weight:600">' + esc(e.nombre) + '</div>';
        html += '<div style="display:flex;align-items:center;gap:3px">';
        html += '<span style="font-size:11px;color:var(--g400)">Ud.</span>';
        html += '<input type="number" min="1" value="' + (e.qty||1) + '" data-li="'+li+'" data-ei="'+ei+'" ';
        html += 'style="width:48px;padding:4px 5px;font-size:13px;border:1px solid #e5e7eb;border-radius:6px;text-align:center"/>';
        html += '</div>';
        html += '<span style="font-size:13px;font-weight:700;color:var(--te600);min-width:34px;text-align:right">' + ((e.precio||0)*(e.qty||1)).toFixed(0) + cfg.currency + '</span>';
        html += '<button data-li="'+li+'" data-rm-ei="'+ei+'" style="background:var(--r50);border:1px solid var(--r100);color:var(--r600);border-radius:6px;padding:3px 8px;cursor:pointer;font-size:12px;font-weight:700">✕</button>';
        html += '</div>';
      });
      html += '</div>';
    }
    // Quick add buttons from catalogue
    html += '<div style="display:flex;flex-wrap:wrap;gap:5px">';
    catalogoExtras.forEach(function(ce){
      var ya = extras.find(function(x){return x.id===ce.id;});
      html += '<button data-li="'+li+'" data-add-eid="'+ce.id+'" style="display:inline-flex;align-items:center;gap:4px;padding:5px 10px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid '+(ya?'#0d9488;background:rgba(13,148,136,.1);color:#0f766e':'#e5e7eb;background:#fff;color:#374151')+'">';
      html += '<span>' + ce.icono + '</span><span>' + esc(ce.nombre) + '</span>';
      if(ce.precio) html += '<span style="color:var(--g400)">+' + ce.precio + cfg.currency + '</span>';
      html += '</button>';
    });
    html += '</div>';
    html += '</div>';
    html += '</div>';
  });
  el.innerHTML = html;

  // Bind events via delegation
  el.querySelectorAll('input[data-li][data-ei]').forEach(function(inp){
    inp.addEventListener('change', function(){
      var li2=parseInt(this.getAttribute('data-li'));
      var ei2=parseInt(this.getAttribute('data-ei'));
      if(!lineas[li2]) return;
      if(!lineas[li2].extras) lineas[li2].extras=[];
      lineas[li2].extras[ei2].qty = parseInt(this.value)||1;
      renderExtrasBici();
      recalcTotal();
    });
  });
  el.querySelectorAll('button[data-rm-ei]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var li2=parseInt(this.getAttribute('data-li'));
      var ei2=parseInt(this.getAttribute('data-rm-ei'));
      if(!lineas[li2]||!lineas[li2].extras) return;
      lineas[li2].extras.splice(ei2,1);
      renderExtrasBici();
      recalcTotal();
    });
  });
  el.querySelectorAll('button[data-add-eid]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var li2=parseInt(this.getAttribute('data-li'));
      var extId=parseInt(this.getAttribute('data-add-eid'));
      if(!lineas[li2]) return;
      if(!lineas[li2].extras) lineas[li2].extras=[];
      var ya = lineas[li2].extras.findIndex(function(x){return x.id===extId;});
      if(ya>=0){
        // Toggle off
        lineas[li2].extras.splice(ya,1);
      } else {
        var cat = catalogoExtras.find(function(x){return x.id===extId;});
        if(cat) lineas[li2].extras.push({id:cat.id,nombre:cat.nombre,icono:cat.icono,precio:cat.precio,qty:1});
      }
      renderExtrasBici();
      recalcTotal();
    });
  });
}

function toggleExtrasPanel(li){
  var panel = document.getElementById('extras-panel-'+li);
  if(!panel) return;
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

function recalcTotal(){
  var ini = document.getElementById('r-ini').value;
  var fin = document.getElementById('r-fin').value;
  if(!ini||!fin) return;
  var dias = diffD(ini,fin)+1;
  var totalBikes = lineas.reduce(function(s,l){return s+(l.ppd||0)*(l.uds||1);},0) * dias;
  var totalExtras = lineas.reduce(function(s,l){
    return s+(l.extras||[]).reduce(function(s2,e){return s2+(e.precio||0)*(e.qty||1);},0);
  },0);
  var totalGlobal = totalBikes + totalExtras;
  document.getElementById('r-total').value = totalGlobal ? totalGlobal.toFixed(2) : '';
  if(dias>0) document.getElementById('r-ppd').value = totalBikes ? (totalBikes/dias).toFixed(2) : '';
}

function initExtrasModal(){
  renderExtrasBici();
}

function loadExtrasFromRes(r){
  // extras per linea already loaded into lineas array from openEditRes
  renderExtrasBici();
}

// VISTA TABLA DESAGRUPADA
var vistaTabla = false;
var tableSort = 'ini';
var tableSortDir = 1;

function toggleVistaRes(){
  vistaTabla = !vistaTabla;
  var btn = document.getElementById('btn-vista');
  var lista = document.getElementById('rlist');
  var tabla = document.getElementById('res-tabla');
  var row2  = document.querySelector('#v-res .card div:nth-child(2)'); // sort row
  var row3  = document.getElementById('res-batch-bar');
  if(vistaTabla){
    lista.style.display = 'none';
    tabla.style.display = 'block';
    if(btn){btn.style.background='var(--g900)';btn.style.color='#fff';btn.style.borderColor='var(--g900)';btn.textContent='☰ Vista lista';}
    renderTablaRes();
  } else {
    lista.style.display = '';
    tabla.style.display = 'none';
    if(btn){btn.style.background='';btn.style.color='';btn.style.borderColor='var(--g300)';btn.textContent='📊 Vista tabla';}
    renderRes();
  }
}

function setTableSort(field){
  if(tableSort===field){tableSortDir*=-1;}else{tableSort=field;tableSortDir=1;}
  ['cli','ini','fin','lugar','mod'].forEach(function(f){
    var el=document.getElementById('ts-'+f);
    if(el)el.textContent=tableSort===f?(tableSortDir===1?'↑':'↓'):'';
  });
  renderTablaRes();
}

function getTableRows(){
  var q=(document.getElementById('rsrch')||{value:''}).value.toLowerCase();
  var rows=[];
  reservas.forEach(function(r){
    if(resF!=='all'){
      var _m2=new Date();_m2.setDate(_m2.getDate()+1);var _ms2=_m2.toISOString().slice(0,10);
      if(resF==='proxima_entrega'){if(r.ini<_ms2||['cancelada','anulada','recogida','alquiler','entregada','pendiente_recoger'].indexOf(r.estado)>=0)return;}
      else if(resF==='transito'){if(['transito_furgo','transito_carlos','transito_seur'].indexOf(r.estado)<0)return;}
      else{if(r.estado!==resF)return;}
    }
    if(q&&![r.cliente,r.tel,r.email||'',r.tipo,r.lugarIni||'',r.lugarFin||''].some(function(s){return(s||'').toLowerCase().indexOf(q)>=0;}))return;
    var fechaF2=getFechaFilter();
    if(fechaF2){
      var rIni=r.ini||'',rFin=r.fin||'';
      if(fechaF2.ini!=='0000-00-00'&&rIni<fechaF2.ini)return;
      if(fechaF2.fin!=='9999-99-99'&&rFin>fechaF2.fin)return;
    }
    var lineas2=r.lineas&&r.lineas.length?r.lineas:[{tipo:r.tipo,talla:r.talla,uds:r.uds||1}];
    lineas2.forEach(function(l){
      for(var u=0;u<(l.uds||1);u++){
        rows.push({
          resId:r.id, cliente:r.cliente||'', ini:r.ini||'', fin:r.fin||'',
          lugarIni:r.lugarIni||'', lugarFin:r.lugarFin||'Santiago de Compostela',
          tipo:l.tipo||r.tipo||'', talla:l.talla||r.talla||'',
          estado:r.estado||'pendiente', dias:r.dias||0,
          uds:l.uds||1, ubici:u+1
        });
      }
    });
  });
  // Sort
  rows.sort(function(a,b){
    var va,vb;
    if(tableSort==='cli'){va=a.cliente.toLowerCase();vb=b.cliente.toLowerCase();}
    else if(tableSort==='ini'){va=a.ini;vb=b.ini;}
    else if(tableSort==='fin'){va=a.fin;vb=b.fin;}
    else if(tableSort==='lugar'){va=a.lugarIni.toLowerCase();vb=b.lugarIni.toLowerCase();}
    else if(tableSort==='mod'){
      var ta=tipos[a.tipo]||{label:a.tipo};
      var tb=tipos[b.tipo]||{label:b.tipo};
      va=ta.label.toLowerCase()+' '+a.talla;
      vb=tb.label.toLowerCase()+' '+b.talla;
    }
    if(va<vb)return -tableSortDir;
    if(va>vb)return tableSortDir;
    return 0;
  });
  return rows;
}

var TABLE_STRIPE=['#ffffff','#f9fafb'];
var STATUS_COLOR={
  pendiente:'#fef3c7',confirmada:'#dbeafe',activa:'#dcfce7',
  finalizada:'#f3f4f6',cancelada:'#fee2e2'
};

function renderTablaRes(){
  var rows = getTableRows();
  var tbody = document.getElementById('res-table-body');
  if(!tbody)return;

  if(!rows.length){
    tbody.innerHTML='<tr><td colspan="8" style="padding:40px;text-align:center;color:var(--g400);font-style:italic">Sin registros</td></tr>';
    var fc=document.getElementById('res-table-count');
    if(fc)fc.textContent='0 filas';
    return;
  }

  // Group by resId to alternate row color per reservation
  var resColors={};
  var colorIdx=0;
  rows.forEach(function(row){
    if(!resColors.hasOwnProperty(row.resId)){
      resColors[row.resId]=prepararIds.some(function(x){return x==row.resId;})?'#dbeafe':TABLE_STRIPE[colorIdx%2];
      colorIdx++;
    }
  });

  var html='';
  rows.forEach(function(row,i){
    var t=tipos[row.tipo]||{icon:'🚲',label:row.tipo,color:'#999'};
    var sc=SCFG[row.estado]||{lbl:row.estado,cls:'bn-gray'};
    var bg=resColors[row.resId];
    var isRowPrep=prepararIds.some(function(x){return x==row.resId;});
    var isHoy=row.ini===todayS();
    var isFin=row.fin===todayS();
    var rowStyle='background:'+bg+';border-bottom:1px solid #e5e7eb;transition:background .1s;'+(isRowPrep?'border-left:4px solid #2563eb;':'border-left:4px solid transparent;');
    var hoverBg='rgba(13,148,136,.07)';
    html+='<tr data-bg="'+bg+'" data-prep="'+(isRowPrep?'1':'0')+'" style="'+rowStyle+'cursor:pointer" onclick="showResDetail('+row.resId+')" onmouseover="this.style.background=this.getAttribute(\'data-prep\')==\'1\'?\'#bfdbfe\':\'rgba(20,184,166,.08)\'" onmouseout="this.style.background=this.dataset.bg">';
    // Cliente
    html+='<td style="padding:9px 12px;border-right:1px solid #f3f4f6;white-space:nowrap;font-weight:600;color:#111">';
    html+=esc(row.cliente);
    if(isHoy) html+=' <span style="font-size:10px;background:#dcfce7;color:#15803d;padding:1px 5px;border-radius:4px;font-weight:700">HOY</span>';
    if(isFin) html+=' <span style="font-size:10px;background:#fee2e2;color:#991b1b;padding:1px 5px;border-radius:4px;font-weight:700">SALIDA</span>';
    html+='</td>';
    // F. Inicio
    html+='<td style="padding:9px 12px;border-right:1px solid #f3f4f6;white-space:nowrap;color:'+(isHoy?'#15803d':'#374151')+';font-weight:'+(isHoy?'700':'400')+'">'+fmtD(row.ini)+'</td>';
    // F. Fin
    html+='<td style="padding:9px 12px;border-right:1px solid #f3f4f6;white-space:nowrap;color:'+(isFin?'#dc2626':'#374151')+';font-weight:'+(isFin?'700':'400')+'">'+fmtD(row.fin)+'</td>';
    // Lugar inicio
    html+='<td style="padding:9px 12px;border-right:1px solid #f3f4f6;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#374151" title="'+esc(row.lugarIni)+'">'+esc(row.lugarIni||'—')+'</td>';
    // Modelo
    html+='<td style="padding:9px 12px;border-right:1px solid #f3f4f6;white-space:nowrap">';
    html+='<span style="display:inline-flex;align-items:center;gap:5px">';
    html+='<span style="width:8px;height:8px;border-radius:50%;background:'+t.color+';flex-shrink:0"></span>';
    html+=t.icon+' <span style="font-weight:600;color:#111">'+esc(t.label)+'</span>';
    html+='</span></td>';
    // Talla
    html+='<td style="padding:9px 12px;border-right:1px solid #f3f4f6;text-align:center;font-weight:700;color:#374151">'+esc(row.talla)+'</td>';
    // Estado
    var stBg=STATUS_COLOR[row.estado]||'#f3f4f6';
    html+='<td style="padding:9px 12px;border-right:1px solid #f3f4f6;white-space:nowrap">';
    html+='<span style="background:'+stBg+';padding:3px 8px;border-radius:4px;font-size:11px;font-weight:700;color:#374151">'+sc.lbl+'</span>';
    html+='</td>';
    // Destino
    html+='<td style="padding:9px 12px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#374151" title="'+esc(row.lugarFin)+'">'+esc(row.lugarFin)+'</td>';
    html+='</tr>';
  });
  tbody.innerHTML=html;

  var fc=document.getElementById('res-table-count');
  if(fc)fc.textContent=rows.length+' fila'+(rows.length!==1?'s':'')+' · '+reservas.filter(function(r){return (resF==='all'||(resF==='proxima_entrega'?(r.estado==='confirmada'&&r.ini>=new Date(new Date().setDate(new Date().getDate()+1)).toISOString().slice(0,10)):(resF==='transito'?['transito_furgo','transito_carlos','transito_seur'].indexOf(r.estado)>=0:r.estado===resF)));}).length+' reservas';
}

function exportTablaCSV(){
  var rows=getTableRows();
  var headers=['Cliente','F.Inicio','F.Fin','Dias','LugarInicio','LugarFin','Modelo','Talla','Estado'];
  var data=[headers.join(',')].concat(rows.map(function(row){
    var t=tipos[row.tipo]||{label:row.tipo};
    return [row.cliente,row.ini,row.fin,row.dias,row.lugarIni,row.lugarFin,t.label,row.talla,row.estado].map(csvEscape).join(',');
  }));
  downloadText(data.join('\n'),'tabla_bicis_'+todayS()+'.csv','text/csv;charset=utf-8');
  toast('Tabla exportada: '+rows.length+' filas');
}

// CAMBIO DE ESTADO DE BICICLETA (desde reservas)
function openBikeEstadoModal(bikeId){
  var b=bikes.find(function(x){return x.id===bikeId;});if(!b)return;
  var t=tipos[b.tipo]||{icon:'🚲',label:b.tipo};
  document.getElementById('m-bike-estado-tit').textContent=t.icon+' '+esc(b.numBici)+' — Cambiar estado';
  var be=BIKE_ESTADOS[b.estado]||BIKE_ESTADOS.disponible;
  document.getElementById('m-bike-estado-info').innerHTML=
    'Estado actual: <strong style="background:'+be.bg+';color:'+be.txt+';padding:2px 8px;border-radius:6px">'+be.icon+' '+be.lbl+'</strong>';
  var el=document.getElementById('m-bike-estado-btns');
  el.innerHTML='';
  Object.keys(BIKE_ESTADOS).forEach(function(k){
    var e2=BIKE_ESTADOS[k];
    var sel=b.estado===k;
    var btn=document.createElement('button');
    btn.style.cssText='display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;border:2px solid '+(sel?e2.color:e2.border)+';background:'+(sel?e2.bg:'#fff')+';color:'+(sel?e2.txt:'#374151')+';font-size:13px;font-weight:700;cursor:pointer;text-align:left;width:100%';
    btn.innerHTML='<span style="font-size:18px">'+e2.icon+'</span><div style="flex:1">'+e2.lbl+'</div>'+(sel?'<span style="font-size:11px;opacity:.7">Actual</span>':'');
    btn.addEventListener('click',(function(estado){return function(){saveBikeEstado(bikeId,estado);};})(k));
    el.appendChild(btn);
  });
  openM('m-bike-estado');
}

function saveBikeEstado(bikeId, newEstado){
  var b=bikes.find(function(x){return x.id===bikeId;});if(!b)return;
  if(b.estado===newEstado){closeM('m-bike-estado');return;}
  b.estado=newEstado;
  // Record in bike estado history
  if(!b.estadosHist) b.estadosHist=[];
  b.estadosHist.push({estado:newEstado,fecha:new Date().toLocaleString('es-ES'),ts:new Date().toISOString(),nota:'Reservas'});
  if(b.estadosHist.length>200) b.estadosHist=b.estadosHist.slice(-200);
  sBikes();
  closeM('m-bike-estado');
  var e=BIKE_ESTADOS[newEstado]||{icon:'',lbl:newEstado};
  toast(esc(b.numBici)+' → '+e.icon+' '+e.lbl);
  renderFlota();
  if(CV==='dash')renderDash();
}

// SISTEMA PREPARAR — comunica reservas a taller
var prepararIds = [];
function savePreparar(){DB.saveConfig('preparar', prepararIds).catch(function(e){console.error('savePreparar',e);});}
function prepContains(id){return prepararIds.some(function(x){return x==id;});}

function togglePreparar(resId){
  resId=parseInt(resId)||resId;
  var idx=prepararIds.findIndex(function(x){return x==resId;});
  if(idx>=0){
    prepararIds.splice(idx,1);
    toast('Reserva quitada de preparación');
  } else {
    prepararIds.push(resId);
    var r=reservas.find(function(x){return x.id===resId;});
    toast('🔧 '+( r?r.cliente:'Reserva')+' — marcada para preparar');
  }
  savePreparar();
  renderRes();
  if(vistaTabla)renderTablaRes();
}

// IMPORTAR / EXPORTAR RESERVAS
var importData = null;

// CSV headers definition (shared export/import)
var CSV_HEADERS = ['ID','Cliente','Telefono','Email','DNI','Modelos','FechaInicio','FechaFin','Dias',
  'LugarInicio','LugarFin','DirEntrega','PrecioDia','Total','Estado','Origen','BicisAsignadas','Notas'];

function csvEscape(v){
  var s = String(v==null?'':v);
  if(s.indexOf(',')>=0||s.indexOf('"')>=0||s.indexOf('\n')>=0){
    return '"'+s.replace(/"/g,'""')+'"';
  }
  return s;
}

function reservaToCSVRow(r){
  var bLine = r.lineas&&r.lineas.length>1
    ? r.lineas.map(function(l){var tl=tipos[l.tipo]||{label:l.tipo};return tl.label+' '+l.talla+(l.uds>1?' x'+l.uds:'');}).join(' | ')
    : (tipos[r.tipo]||{label:r.tipo||''}).label+' '+(r.talla||'')+(r.uds>1?' x'+r.uds:'');
  var bicis = r.bikesAsig&&r.bikesAsig.length ? r.bikesAsig.map(function(b){return b.num;}).join(' | ') : '';
  return [
    r.id, r.cliente||'', r.tel||'', r.email||'', r.dni||'',
    bLine, r.ini||'', r.fin||'', r.dias||'',
    r.lugarIni||'', r.lugarFin||'Santiago de Compostela', r.dirEntrega||'',
    r.ppd||0, r.total||0,
    r.estado||'pendiente', r.origen||'interno',
    bicis, r.notas||''
  ].map(csvEscape).join(',');
}

function exportarReservas(){
  var rows = [CSV_HEADERS.join(',')].concat(reservas.map(reservaToCSVRow));
  var csv  = rows.join('\n');
  var nombre = (cfg.bizName||'velotaller').replace(/\s+/g,'-').toLowerCase();
  downloadText(csv, 'reservas_'+nombre+'_'+todayS()+'.csv', 'text/csv;charset=utf-8');
  toast('Exportadas '+reservas.length+' reservas en CSV');
}

function downloadText(content, filename, mime){
  var bom  = '\uFEFF'; // BOM for Excel UTF-8
  var blob = new Blob([bom+content],{type:mime});
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href=url; a.download=filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function openImportRes(){
  importData = null;
  document.getElementById('import-file').value = '';
  document.getElementById('import-preview').style.display = 'none';
  document.getElementById('import-error').style.display   = 'none';
  document.getElementById('import-confirm-btn').style.display = 'none';
  openM('m-import-res');
}

function previewImport(event){
  var file = event.target.files && event.target.files[0];
  var prev = document.getElementById('import-preview');
  var err  = document.getElementById('import-error');
  var btn  = document.getElementById('import-confirm-btn');
  prev.style.display = 'none';
  err.style.display  = 'none';
  btn.style.display  = 'none';
  importData = null;
  if(!file) return;
  var reader = new FileReader();
  reader.onload = function(ev){
    try{
      var text = ev.target.result.replace(/^\uFEFF/,''); // strip BOM
      var lines = text.split(/\r?\n/).filter(function(l){return l.trim();});
      if(lines.length < 2) throw new Error('El archivo está vacío o no tiene datos.');
      var header = lines[0].split(',').map(function(h){return h.trim().replace(/^"|"$/g,'');});
      // Map header positions
      function col(name){
        var i = header.indexOf(name);
        return i >= 0 ? i : null;
      }
      var resArr = [];
      for(var i=1;i<lines.length;i++){
        var vals = parseCSVLine(lines[i]);
        function g(name){var idx=col(name);return idx!==null?(vals[idx]||'').trim():'';}
        var id = parseInt(g('ID'))||( Date.now()+i);
        var r = {
          id:       id,
          cliente:  g('Cliente'),
          tel:      g('Telefono'),
          email:    g('Email'),
          dni:      g('DNI'),
          ini:      g('FechaInicio'),
          fin:      g('FechaFin'),
          dias:     parseInt(g('Dias'))||0,
          lugarIni: g('LugarInicio'),
          lugarFin: g('LugarFin')||'Santiago de Compostela',
          ppd:      parseFloat(g('PrecioDia'))||0,
          total:    parseFloat(g('Total'))||0,
          precio:   parseFloat(g('Total'))||0,
          estado:   g('Estado')||'pendiente',
          origen:   g('Origen')||'importado',
          notas:    g('Notas'),
          ts:       new Date().toISOString(),
          lineas:   [],
          bikesAsig:[],
          extras:   []
        };
        // Parse modelos into lineas
        var modStr = g('Modelos');
        if(modStr){
          modStr.split('|').forEach(function(m){
            m = m.trim();
            // Try to match "Label Talla" or "Label Talla x2"
            var mUds = 1;
            var mUdsM = m.match(/x(\d+)$/);
            if(mUdsM){mUds=parseInt(mUdsM[1]);m=m.replace(/x\d+$/,'').trim();}
            r.lineas.push({tipo:'',talla:m,uds:mUds,ppd:r.ppd,extras:[]});
          });
        }
        // Parse bicis
        var bicisStr = g('BicisAsignadas');
        if(bicisStr){
          bicisStr.split('|').forEach(function(b){
            b=b.trim();if(b)r.bikesAsig.push({num:b,id:0,tipo:'',talla:''});
          });
        }
        if(r.cliente) resArr.push(r);
      }
      if(!resArr.length) throw new Error('No se encontraron filas de reservas válidas.');
      importData = {reservas: resArr};
      var nuevas = resArr.filter(function(r2){
        return !reservas.find(function(x){return x.id===r2.id;});
      }).length;
      var dupes = resArr.length - nuevas;
      prev.style.display = 'block';
      prev.innerHTML =
        '<div style="font-weight:700;margin-bottom:8px;color:var(--g800)">Vista previa:</div>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+
          '<div style="background:#fff;border-radius:8px;padding:10px 12px;border:1px solid var(--g200)">'+
            '<div style="font-size:22px;font-weight:800;color:var(--b600)">'+resArr.length+'</div>'+
            '<div style="font-size:12px;color:var(--g500)">Filas en archivo</div>'+
          '</div>'+
          '<div style="background:#fff;border-radius:8px;padding:10px 12px;border:1px solid var(--g200)">'+
            '<div style="font-size:22px;font-weight:800;color:var(--gr600)">'+nuevas+'</div>'+
            '<div style="font-size:12px;color:var(--g500)">Nuevas a importar</div>'+
          '</div>'+
          (dupes>0?'<div style="grid-column:1/-1;background:var(--am50);border-radius:8px;padding:8px 12px;font-size:12px;color:var(--am600)">⚠️ '+dupes+' ya existen (mismo ID) y se omitirán</div>':'')+
          '<div style="grid-column:1/-1;background:var(--b50);border-radius:8px;padding:8px 12px;font-size:12px;color:var(--b700)">Vista previa primera fila: '+esc(resArr[0].cliente)+' · '+resArr[0].ini+' → '+resArr[0].fin+'</div>'+
        '</div>';
      if(nuevas>0){btn.style.display='inline-flex';}
      else{prev.innerHTML+='<div style="margin-top:8px;color:var(--am600);font-size:13px">No hay reservas nuevas que importar.</div>';}
    }catch(e){
      err.style.display='block';
      err.innerHTML='❌ Error al leer el CSV:<br>'+esc(e.message)+
        '<br><small style="color:var(--g500)">Asegúrate de usar un CSV exportado desde esta app.</small>';
    }
  };
  reader.readAsText(file,'UTF-8');
}

// Parse a single CSV line respecting quoted fields
function parseCSVLine(line){
  var result=[],cur='',inQ=false;
  for(var i=0;i<line.length;i++){
    var ch=line[i];
    if(ch==='"'){
      if(inQ&&line[i+1]==='"'){cur+='"';i++;}
      else inQ=!inQ;
    } else if(ch===','&&!inQ){result.push(cur);cur='';}
    else cur+=ch;
  }
  result.push(cur);
  return result;
}

function confirmarImport(){
  if(!importData) return;
  var added=0;
  importData.reservas.forEach(function(r){
    if(!reservas.find(function(x){return x.id===r.id;})){
      reservas.push(r); added++;
    }
  });
  sR();
  closeM('m-import-res');
  importData=null;
  updBadge();
  renderRes();
  if(CV==='dash') renderDash();
  if(CV==='cal')  renderCal();
  toast('Importadas '+added+' reservas');
}

// INIT
document.getElementById('tdlbl').textContent=new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

// IMPRIMIR RESERVAS
function imprimirReservas(){
  // Get currently visible list (same filters as renderRes)
  var q=(document.getElementById('rsrch')||{value:''}).value.toLowerCase();
  var fechaF=getFechaFilter();
  var list=reservas.filter(function(r){
    if(resF!=='all'){
      var _manana=new Date();_manana.setDate(_manana.getDate()+1);var _ms=_manana.toISOString().slice(0,10);
      if(resF==='proxima_entrega'){
        if(r.estado!=='confirmada'||r.ini<_ms)return false;
      } else if(resF==='transito'){
        if(['transito_furgo','transito_carlos','transito_seur'].indexOf(r.estado)<0)return false;
      } else {
        if(r.estado!==resF)return false;
      }
    }
    if(q&&![r.cliente,r.tel,r.email||'',r.bikeNum||'',r.tipo,r.lugarIni||'',r.lugarFin||''].some(function(s){return(s||'').toLowerCase().indexOf(q)>=0;}))return false;
    if(fechaF){
      var rIni=r.ini||'',rFin=r.fin||'';
      if(fechaF.ini!=='0000-00-00'&&rIni<fechaF.ini)return false;
      if(fechaF.fin!=='9999-99-99'&&rFin>fechaF.fin)return false;
    }
    return true;
  });
  list=sortReservas(list);

  if(!list.length){toast('No hay reservas para imprimir');return;}

  var SCOL={pendiente:'#fef3c7',confirmada:'#dbeafe',activa:'#dcfce7',finalizada:'#f3f4f6',cancelada:'#fee2e2'};
  var SLBL={pendiente:'Pendiente',confirmada:'Confirmada',activa:'Activa',finalizada:'Finalizada',cancelada:'Cancelada'};

  // Build filter description for header
  var filtro='';
  if(resF!=='all')filtro+=' · Estado: '+SLBL[resF];
  if(q)filtro+=' · Búsqueda: "'+q+'"';
  if(fechaF&&fechaF.ini!=='0000-00-00')filtro+=' · Fechas: '+fmtD(fechaF.ini)+' – '+fmtD(fechaF.fin);

  var rows=list.map(function(r,ri){
    var t=tipos[r.tipo]||{icon:'🚲',label:r.tipo};
    // One row per linea/bici — if multiple models, expand
    var lineas2=r.lineas&&r.lineas.length?r.lineas:[{tipo:r.tipo,talla:r.talla,uds:r.uds||1}];
    var bg=ri%2===0?'#fff':'#f5f5f5';
    return lineas2.map(function(l,li){
      var tl=tipos[l.tipo]||{icon:'🚲',label:l.tipo||t.label};
      return '<tr style="background:'+bg+'">'
        +(li===0?'<td rowspan="'+lineas2.length+'" style="font-weight:700;border-bottom:2px solid #d1d5db">'+esc(r.cliente)+'</td>':'')
        +(li===0?'<td rowspan="'+lineas2.length+'" style="border-bottom:2px solid #d1d5db">'+fmtD(r.ini)+'</td>':'')
        +(li===0?'<td rowspan="'+lineas2.length+'" style="border-bottom:2px solid #d1d5db">'+esc(r.lugarIni||'—')+'</td>':'')
        +'<td>'+tl.icon+' '+esc(tl.label)+'</td>'
        +'<td style="text-align:center;font-weight:700">'+esc(l.talla||r.talla||'—')+'</td>'
        +'</tr>';
    }).join('');
  }).join('');

  var totales=list.reduce(function(s,r){return s+(r.total||0);},0);
  var hoy=new Date().toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});

  var html='<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/>'
    +'<title>Reservas — '+esc(cfg.bizName||'VeloRentas')+'</title>'
    +'<style>'
    +'*{box-sizing:border-box;margin:0;padding:0}'
    +'body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#111;padding:16px}'
    +'h1{font-size:16px;font-weight:700;margin-bottom:2px}'
    +'.sub{font-size:11px;color:#555;margin-bottom:12px}'
    +'table{width:100%;border-collapse:collapse;margin-top:8px}'
    +'th{background:#111827;color:#fff;padding:6px 8px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;white-space:nowrap}'
    +'td{padding:5px 8px;border-bottom:1px solid #e5e7eb;vertical-align:middle}'
    +'tr:hover{filter:brightness(.97)}'
    +'.footer{margin-top:14px;display:flex;justify-content:space-between;font-size:10px;color:#555;border-top:1px solid #e5e7eb;padding-top:8px}'
    +'@media print{'
    +'  body{padding:8px}'
    +'  @page{margin:12mm;size:A4 portrait}'
    +'  .no-print{display:none}'
    +'}'
    +'</style></head><body>'
    +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">'
    +'<div>'
    +'<h1>'+esc(cfg.bizName||'VeloRentas')+' — Listado de reservas</h1>'
    +'<div class="sub">'+list.length+' reserva'+(list.length!==1?'s':'')+(filtro?filtro:' · Todas')+' · '+hoy+'</div>'
    +'</div>'
    +'<button class="no-print" onclick="window.print()" style="padding:8px 18px;background:#111827;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer">🖨️ Imprimir</button>'
    +'</div>'
    +'<table>'
    +'<thead><tr>'
    +'<th style="width:25%">Cliente</th>'
    +'<th style="width:13%">F. Inicio</th>'
    +'<th style="width:27%">Lugar de inicio</th>'
    +'<th style="width:25%">Modelo</th>'
    +'<th style="width:10%;text-align:center">Talla</th>'
    +'</tr></thead>'
    +'<tbody>'+rows+'</tbody>'
    +'</table>'
    +'<div class="footer">'
    +'<span>'+esc(cfg.bizName||'VeloRentas')+(cfg.addr?' · '+esc(cfg.addr):'')+(cfg.phone?' · '+esc(cfg.phone):'')+'</span>'
    +'<span>'+list.length+' reserva'+(list.length!==1?'s':'')+' · '+hoy+'</span>'
    +'</div>'
    +'<script>window.onload=function(){window.print();}<\/script>'
    +'</body></html>';

  // Try window.open first; if blocked (file:// or popup blocker), use iframe fallback
  try {
    var w=window.open('','_blank');
    if(!w||w.closed||typeof w.document==='undefined'){throw new Error('blocked');}
    w.document.open();
    w.document.write(html);
    w.document.close();
  } catch(e) {
    // Fallback: inject into a full-screen overlay in the current page
    var overlay=document.createElement('div');
    overlay.id='print-overlay';
    overlay.style.cssText='position:fixed;inset:0;background:#fff;z-index:99999;overflow:auto;';
    var closeBtn='<button onclick="document.getElementById(\'print-overlay\').remove()" '
      +'style="position:fixed;top:12px;right:12px;padding:8px 16px;background:#ef4444;color:#fff;'
      +'border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;z-index:100000">✕ Cerrar</button>';
    overlay.innerHTML=closeBtn+'<iframe id="print-frame" style="width:100%;height:100%;border:none"></iframe>';
    document.body.appendChild(overlay);
    var frame=document.getElementById('print-frame');
    frame.contentDocument.open();
    frame.contentDocument.write(html);
    frame.contentDocument.close();
    // Trigger print from inside the iframe
    setTimeout(function(){
      try{frame.contentWindow.print();}catch(e2){}
    },400);
  }
}


// PRINT SELECTOR
var PRINT_FIELDS = [
  {key:'cliente',   lbl:'Cliente',             def:true},
  {key:'tel',       lbl:'Teléfono',            def:false},
  {key:'email',     lbl:'Email',               def:false},
  {key:'dni',       lbl:'DNI',                 def:false},
  {key:'ini',       lbl:'Fecha inicio',        def:true},
  {key:'fin',       lbl:'Fecha fin',           def:false},
  {key:'dias',      lbl:'Días',                def:false},
  {key:'lugarIni',  lbl:'Lugar de inicio',     def:true},
  {key:'lugarFin',  lbl:'Destino',             def:false},
  {key:'dirEntrega',lbl:'Dirección entrega',   def:false},
  {key:'modelo',    lbl:'Modelo / Talla',      def:true},
  {key:'bicisAsig', lbl:'Bicicletas asignadas',def:false},
  {key:'total',     lbl:'Total',               def:false},
  {key:'estado',    lbl:'Estado',              def:false},
  {key:'notas',     lbl:'Notas',               def:false},
  {key:'preparar',  lbl:'En preparación',      def:false},
];
var printSeleccion = {};

function openPrintSelector(){
  // Load saved selection or defaults
  PRINT_FIELDS.forEach(function(f){
    var saved=localStorage.getItem('print_sel_'+f.key);
    printSeleccion[f.key] = saved!==null ? saved==='1' : f.def;
  });
  renderPrintFields();
  openM('m-print-sel');
}

function renderPrintFields(){
  var el=document.getElementById('print-fields'); if(!el)return;
  el.innerHTML='';
  PRINT_FIELDS.forEach(function(f){
    var checked=printSeleccion[f.key];
    var row=document.createElement('label');
    row.style.cssText='display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;border:1px solid '+(checked?'#2563eb':'#e5e7eb')+';background:'+(checked?'#eff6ff':'#fff')+';cursor:pointer';
    row.innerHTML='<input type="checkbox" '+(checked?'checked':'')+' data-key="'+f.key+'" style="width:16px;height:16px;cursor:pointer"/>'
      +'<span style="font-size:13px;font-weight:'+(checked?'700':'400')+';color:'+(checked?'#1d4ed8':'#374151')+'">'+f.lbl+'</span>';
    row.querySelector('input').addEventListener('change',function(){
      printSeleccion[this.getAttribute('data-key')]=this.checked;
      localStorage.setItem('print_sel_'+this.getAttribute('data-key'),this.checked?'1':'0');
      renderPrintFields();
    });
    el.appendChild(row);
  });
  // Selec all / none buttons
  var btns=document.createElement('div');
  btns.style.cssText='display:flex;gap:8px;margin-top:6px;padding-top:10px;border-top:1px solid #e5e7eb';
  btns.innerHTML='<button class="btn bs bsm" onclick="setPrintAll(true)">☑ Todos</button>'
    +'<button class="btn bs bsm" onclick="setPrintAll(false)">☐ Ninguno</button>';
  el.appendChild(btns);
}

function setPrintAll(v){
  PRINT_FIELDS.forEach(function(f){
    printSeleccion[f.key]=v;
    localStorage.setItem('print_sel_'+f.key,v?'1':'0');
  });
  renderPrintFields();
}

function ejecutarImpresion(){
  closeM('m-print-sel');
  // Build selected fields list
  var selected=PRINT_FIELDS.filter(function(f){return printSeleccion[f.key];});
  if(!selected.length){toast('Selecciona al menos un campo');return;}

  // Get filtered list same as renderRes
  var q=(document.getElementById('rsrch')||{value:''}).value.toLowerCase();
  var fechaF=getFechaFilter();
  var list=reservas.filter(function(r){
    if(resF!=='all'){
      var _manana=new Date();_manana.setDate(_manana.getDate()+1);var _ms=_manana.toISOString().slice(0,10);
      if(resF==='proxima_entrega'){
        if(r.estado!=='confirmada'||r.ini<_ms)return false;
      } else if(resF==='transito'){
        if(['transito_furgo','transito_carlos','transito_seur'].indexOf(r.estado)<0)return false;
      } else {
        if(r.estado!==resF)return false;
      }
    }
    if(q&&![r.cliente,r.tel,r.email||'',r.tipo,r.lugarIni||'',r.lugarFin||''].some(function(s){return(s||'').toLowerCase().indexOf(q)>=0;}))return false;
    if(fechaF){var rIni=r.ini||'',rFin=r.fin||'';if(fechaF.ini!=='0000-00-00'&&rIni<fechaF.ini)return false;if(fechaF.fin!=='9999-99-99'&&rFin>fechaF.fin)return false;}
    return true;
  });
  list=sortReservas(list);
  if(!list.length){toast('No hay reservas para imprimir');return;}

  var SLBL={pendiente:'Pendiente',confirmada:'Confirmada',activa:'Activa',finalizada:'Finalizada',cancelada:'Cancelada'};
  var SCOL2={pendiente:'#fef3c7',confirmada:'#dbeafe',activa:'#dcfce7',finalizada:'#f3f4f6',cancelada:'#fee2e2'};

  function getCellValue(r, key){
    if(key==='cliente')  return esc(r.cliente||'');
    if(key==='tel')      return esc(r.tel||'');
    if(key==='email')    return esc(r.email||'');
    if(key==='dni')      return esc(r.dni||'');
    if(key==='ini')      return fmtD(r.ini);
    if(key==='fin')      return fmtD(r.fin);
    if(key==='dias')     return (r.dias||0)+'d';
    if(key==='lugarIni') return esc(r.lugarIni||'—');
    if(key==='lugarFin') return esc(r.lugarFin||'Santiago de Compostela');
    if(key==='dirEntrega')return esc(r.dirEntrega||'—');
    if(key==='modelo'){
      var t2=tipos[r.tipo]||{icon:'🚲',label:r.tipo};
      return r.lineas&&r.lineas.length>1
        ?r.lineas.map(function(l){var tl=tipos[l.tipo]||{label:l.tipo};return tl.label+' '+l.talla;}).join(' | ')
        :t2.label+' '+esc(r.talla);
    }
    if(key==='bicisAsig')return r.bikesAsig&&r.bikesAsig.length?r.bikesAsig.map(function(b){return b.num;}).join(', '):'Sin asignar';
    if(key==='total')    return r.total?(r.total+cfg.currency):'—';
    if(key==='estado')   return SLBL[r.estado]||r.estado;
    if(key==='notas')    return esc(r.notas||'');
    if(key==='preparar') return prepararIds.some(function(x){return x==r.id;})?'🔧 Preparar':'';
    return '';
  }

  var hoy=new Date().toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  var filtroDesc='';
  if(resF!=='all')filtroDesc+=' · '+( SLBL[resF]||resF);
  if(q)filtroDesc+=' · Búsqueda: "'+q+'"';

  var thead='<tr style="background:#111827;color:#fff">'+selected.map(function(f){return '<th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;white-space:nowrap">'+f.lbl+'</th>';}).join('')+'</tr>';

  var tbody=list.map(function(r,ri){
    var bg=prepararIds.some(function(x){return x==r.id;})?'#dbeafe':(SCOL2[r.estado]||(ri%2===0?'#fff':'#f9f9f9'));
    return '<tr style="background:'+bg+'">'
      +selected.map(function(f){return '<td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;vertical-align:top">'+getCellValue(r,f.key)+'</td>';}).join('')
      +'</tr>';
  }).join('');

  var html='<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>Reservas — '+esc(cfg.bizName||'VeloRentas')+'</title>'
    +'<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:12px;padding:14px}'
    +'h1{font-size:15px;font-weight:700;margin-bottom:2px}.sub{font-size:11px;color:#6b7280;margin-bottom:12px}'
    +'table{width:100%;border-collapse:collapse}th{white-space:nowrap}'
    +'.footer{margin-top:12px;display:flex;justify-content:space-between;font-size:10px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:8px}'
    +'@media print{body{padding:6px}@page{margin:8mm;size:A4 landscape}.no-print{display:none}}'
    +'</style></head><body>'
    +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">'
    +'<div><h1>'+esc(cfg.bizName||'VeloRentas')+' — Reservas</h1>'
    +'<div class="sub">'+list.length+' reserva'+(list.length!==1?'s':'')+filtroDesc+' · '+hoy+'</div></div>'
    +'<button class="no-print" onclick="window.print()" style="padding:7px 16px;background:#111827;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer">🖨️ Imprimir</button>'
    +'</div>'
    +'<table><thead>'+thead+'</thead><tbody>'+tbody+'</tbody></table>'
    +'<div class="footer"><span>'+esc(cfg.bizName||'VeloRentas')+(cfg.addr?' · '+esc(cfg.addr):'')+'</span>'
    +'<span>Total: '+list.length+' reservas</span></div>'
    +'<script>window.onload=function(){window.print();}<\/script>'
    +'</body></html>';

  try{
    var w=window.open('','_blank');
    if(!w||w.closed){throw new Error('blocked');}
    w.document.open();w.document.write(html);w.document.close();
  }catch(e){
    var ov=document.createElement('div');
    ov.id='print-overlay';
    ov.style.cssText='position:fixed;inset:0;background:#fff;z-index:99999;overflow:auto';
    var closeB='<button onclick="document.getElementById(\'print-overlay\').remove()" style="position:fixed;top:12px;right:12px;padding:8px 16px;background:#ef4444;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;z-index:100000">✕ Cerrar</button>';
    ov.innerHTML=closeB+'<iframe id="pf" style="width:100%;height:100%;border:none"></iframe>';
    document.body.appendChild(ov);
    var fr=document.getElementById('pf');
    fr.contentDocument.open();fr.contentDocument.write(html);fr.contentDocument.close();
    setTimeout(function(){try{fr.contentWindow.print();}catch(e2){}},400);
  }
}

// DATOS DE DEMO — genera 120 bicis y 30 reservas si la BD está vacía
function generarDemoData(){
  if(bikes.length>5||reservas.length>0)return; // ya hay datos reales

  var NOMBRES=['García López','Martínez Ruiz','Sánchez Pérez','González Díaz','Fernández Castro',
    'Rodríguez Mora','López Jiménez','Pérez Navarro','Álvarez Torres','Romero Vega',
    'Alonso Herrera','Gutiérrez Ramos','Muñoz Serrano','Moreno Iglesias','Jiménez Molina',
    'Núñez Delgado','Medina Ortiz','Blanco Vargas','Suárez Santana','Reyes Flores',
    'Domínguez Lara','Fuentes Campos','Rubio Montoya','Aguilar Mendoza','Castro Guerrero',
    'Ramos Espinosa','Vargas Ibáñez','Ríos Cabrera','Pascual Marín','Ortega Vidal'];
  var LUGARES=['Saint-Jean-Pied-de-Port','Roncesvalles','Pamplona','Burgos','León',
    'Ponferrada','Sarria','O Cebreiro','Porto','Lisboa','Sevilla','Oviedo','Irún','Tui'];
  var MODELOS={
    urbana:  ['Trek Marlin 7','Trek Marlin 5','Orbea Onna 10'],
    montana: ['Trek Powerfly 5','Trek Powerfly 7','Orbea Rise'],
    electrica:['Trek Checkpoint SL','Cannondale Synapse'],
    cargo:   ['Urban Arrow Family','Tern GSD'],
    infantil:['Trek Precaliber 20','Trek Precaliber 24'],
    gravel:  ['Trek Checkpoint ALR','Orbea Terra','Cannondale Topstone']
  };
  var ESTADOS=['disponible','disponible','disponible','disponible','averiada'];

  // ── 120 bicicletas ───────────────────────────────────────────────────
  var newBikes=[];
  var counter=1;
  Object.keys(tipos).forEach(function(k){
    var t=tipos[k];
    var mods=MODELOS[k]||[t.label];
    var n=Math.round(120/Object.keys(tipos).length);
    for(var i=0;i<n;i++){
      var talla=t.sizes[i%t.sizes.length];
      var mod=mods[i%mods.length];
      var num='B-'+String(counter).padStart(3,'0');
      newBikes.push({
        id:10000+counter,
        numBici:num,
        numSerie:'SN-'+counter,
        qr:num,
        modelo:mod,
        tipo:k,
        talla:talla,
        estado:ESTADOS[i%ESTADOS.length]
      });
      counter++;
    }
  });
  bikes=newBikes;
  sBikes();

  // ── 30 reservas ──────────────────────────────────────────────────────
  var newRes=[];
  var y=new Date().getFullYear();
  var estados=['pendiente','confirmada','confirmada','activa','activa','finalizada','cancelada'];
  for(var r=0;r<30;r++){
    // Random start day within the year
    var startDay=Math.floor(Math.random()*330)+1;
    var dur=Math.floor(Math.random()*18)+3; // 3-20 days
    var iniD=new Date(y,0,startDay);
    var finD=new Date(y,0,startDay+dur);
    var ini=iniD.toISOString().slice(0,10);
    var fin=finD.toISOString().slice(0,10);
    // Pick a random available bike
    var availBikes=bikes.filter(function(b){return bikeOperativa(b);});
    if(!availBikes.length)continue;
    var bike=availBikes[Math.floor(Math.random()*availBikes.length)];
    var cliente=NOMBRES[r%NOMBRES.length];
    var ppd=Math.floor(Math.random()*12+8); // 8-20€/día
    var total=ppd*dur;
    var lugarIni=LUGARES[Math.floor(Math.random()*LUGARES.length)];
    var estado=estados[r%estados.length];
    newRes.push({
      id:20000+r,
      cliente:cliente,
      tel:'+34 6'+String(Math.floor(Math.random()*90000000+10000000)),
      email:cliente.split(' ')[0].toLowerCase()+'@email.com',
      dni:'',
      tipo:bike.tipo,
      talla:bike.talla,
      uds:1,
      bikeId:bike.id,
      bikeNum:bike.numBici,
      lineas:[{tipo:bike.tipo,talla:bike.talla,uds:1,ppd:ppd,extras:[]}],
      bikesAsig:[{id:bike.id,num:bike.numBici,tipo:bike.tipo,talla:bike.talla}],
      ini:ini,
      fin:fin,
      dias:dur,
      ppd:ppd,
      total:total,
      precio:total,
      estado:estado,
      lugarIni:lugarIni,
      lugarFin:'Santiago de Compostela',
      dirEntrega:'',
      notas:'',
      extras:[],
      ts:new Date().toISOString(),
      origen:'demo'
    });
  }
  reservas=newRes;
  sR();
  toast('Demo generado: '+bikes.length+' bicis y '+reservas.length+' reservas');
}
// ── Inicio de la aplicación: carga datos desde Supabase ────────
async function initApp() {
  // Mostrar spinner de carga
  document.body.insertAdjacentHTML('beforeend',
    '<div id="db-loading" style="position:fixed;inset:0;background:rgba(17,24,39,.7);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px">' +
    '<div style="width:48px;height:48px;border:4px solid rgba(255,255,255,.2);border-top-color:#0d9488;border-radius:50%;animation:spin .7s linear infinite"></div>' +
    '<div style="color:#fff;font-family:Inter,sans-serif;font-size:15px;font-weight:600">Conectando con la base de datos...</div>' +
    '<style>@keyframes spin{to{transform:rotate(360deg)}}</style></div>');

  try {
    // Cargar datos en paralelo
    var results = await Promise.all([
      DB.getBicis(),
      DB.getReservas(),
      DB.getConfig('bloqueos', []),
      DB.getConfig('facturas', []),
      DB.getConfig('tarifas', {}),
      DB.getConfig('cfg', CFG_DEF),
      DB.getConfig('tipos', TIPOS_DEF),
      DB.getConfig('extras_cat', EXTRAS_DEF),
      DB.getConfig('preparar', []),
      DB.getConfig('imp_excluidas', []),
      DB.getConfig('historial', {}),
      DB.getConfig('clistas', null),
      DB.getConfig('photos', {})
    ]);

    var dbBikes     = results[0];
    var dbReservas  = results[1];
    var dbBloqueos  = results[2];
    var dbFacturas  = results[3];
    var dbTarifas   = results[4];
    var dbCfg       = results[5];
    var dbTipos     = results[6];
    var dbExtrasCat = results[7];
    var dbPreparar    = results[8];
    var dbImpExcl     = results[9];
    var dbHist      = results[9];
    var dbCLS       = results[10];
    var dbPhotos    = results[11];

    // Aplicar datos reservas
    if (dbBikes.length)       bikes          = dbBikes;
    if (dbReservas.length)    reservas       = dbReservas;
    if (dbBloqueos.length)    bloqueos       = dbBloqueos;
    if (dbFacturas.length)    facturas       = dbFacturas;
    if (Object.keys(dbTarifas).length) tarifas = dbTarifas;
    if (dbCfg && dbCfg.bizName) cfg          = dbCfg;
    if (dbTipos && Object.keys(dbTipos).length) tipos = dbTipos;
    if (dbExtrasCat && dbExtrasCat.length) catalogoExtras = dbExtrasCat;
    if (dbPreparar && dbPreparar.length) prepararIds = dbPreparar;
    if (dbImpExcl && dbImpExcl.length) impExcluidas = dbImpExcl;

    // Aplicar datos taller (variables de taller-merged.js)
    if (typeof hist !== 'undefined' && dbHist && dbHist !== null && !Array.isArray(dbHist) && Object.keys(dbHist).length) hist = dbHist;
    if (typeof CLS !== 'undefined' && Array.isArray(dbCLS) && dbCLS.length) CLS = dbCLS;
    if (typeof photos !== 'undefined' && dbPhotos && dbPhotos !== null && !Array.isArray(dbPhotos) && Object.keys(dbPhotos).length) photos = dbPhotos;

    // Caché compartida preparar
    window._sharedReservas = reservas;
    window._sharedPreparar = prepararIds;

    // Si la BD está vacía, generar demo
    if (!bikes.length && !reservas.length) {
      generarDemoData();
    }

  } catch(e) {
    console.error('initApp error:', e);
    toast('⚠️ Error conectando. Comprueba tu conexión.', 3000);
    generarDemoData();
  }

  // Quitar spinner
  var loader = document.getElementById('db-loading');
  if (loader) loader.remove();

  // Iniciar interfaz reservas
  document.getElementById('tdlbl').textContent = new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  initTLSelects(); initFlotaSelects(); updBadge(); renderDash();
  // Iniciar interfaz taller (rDB definido en taller-merged.js)
  if (typeof rDB === 'function') rDB();
}

setTimeout(initApp, 800);
