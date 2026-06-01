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
var SCFG={pendiente:{lbl:'Pendiente',cls:'bn-amber'},confirmada:{lbl:'Confirmada',cls:'bn-blue'},activa:{lbl:'Activa',cls:'bn-green'},finalizada:{lbl:'Finalizada',cls:'bn-gray'},cancelada:{lbl:'Cancelada',cls:'bn-red'}};
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

function bikeFreeForRange(bikeId,ini,fin,excludeId){var niG=addD(ini,-cfg.gapDays);var ok=true;reservas.forEach(function(r){if(r.bikeId!==bikeId||r.estado==='cancelada'||(excludeId&&r.id===excludeId))return;if(!(fin<r.ini||niG>r.fin))ok=false;});return ok;}
function getAvailCount(tipo,talla,ini,fin,excludeId){var niG=addD(ini,-cfg.gapDays);var blqUds=0;bloqueos.forEach(function(b){if(b.tipo!==tipo||b.talla!==talla)return;if(!(fin<b.ini||niG>b.fin))blqUds+=(b.uds||1);});var free=bikes.filter(function(b){return b.tipo===tipo&&b.talla===talla&&bikeOperativa(b)&&bikeFreeForRange(b.id,ini,fin,excludeId);});return Math.max(0,free.length-blqUds);}
function getAvailBikes(tipo,talla,ini,fin,excludeId){var niG=addD(ini,-cfg.gapDays);var blqUds=0;bloqueos.forEach(function(b){if(b.tipo!==tipo||b.talla!==talla)return;if(!(fin<b.ini||niG>b.fin))blqUds+=(b.uds||1);});var free=bikes.filter(function(b){return b.tipo===tipo&&b.talla===talla&&bikeOperativa(b)&&bikeFreeForRange(b.id,ini,fin,excludeId);});return free.slice(blqUds);}

// DASHBOARD
function emptyHTML(icon,txt){return '<div class="empty"><div class="empty-i">'+icon+'</div><div class="empty-t">'+txt+'</div></div>';}
function renderDash(){
  var lbl=document.getElementById('tdlbl');if(lbl)lbl.textContent=new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  var today=todayS();
  var activas=reservas.filter(function(r){return r.estado!=='cancelada'&&r.ini<=today&&r.fin>=today;}).length;
  var bikesReparto=bikes.filter(function(b){return b.estado==='reparto';}).length;
  var bikesEntregadas=bikes.filter(function(b){return b.estado==='entregada';}).length;
  var pend=reservas.filter(function(r){return r.estado==='pendiente';}).length;
  var prox=reservas.filter(function(r){return r.estado!=='cancelada'&&r.ini>today&&diffD(today,r.ini)<=7;}).length;
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
      // Auto-advance status: confirmed → active if today is within range
      var today=todayS();
      if(r.estado==='confirmada'&&r.ini<=today&&r.fin>=today){
        r.estado='activa';
        toast('🚲 '+bike.numBici+' asignada · Reserva activada');
      } else if(r.estado==='pendiente'){
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
    if(resF!=='all'&&r.estado!==resF)return false;
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
    if(resF!=='all'&&r.estado!==resF)return false;
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
function changeStatus(id,st){var r=reservas.find(function(x){return x.id===id;});if(!r)return;r.estado=st;sR();closeM('mdetail');updBadge();var L={confirmada:'Confirmada',activa:'Activa',finalizada:'Finalizada',cancelada:'Cancelada'};toast(L[st]||'Actualizado');renderRes();renderDash();if(CV==='flota')renderFlota();}
function showResDetail(id){
  var r=reservas.find(function(x){return x.id===id;});if(!r)return;
  var sc=SCFG[r.estado]||{lbl:r.estado,cls:'bn-gray'};
  var t=tipos[r.tipo]||{icon:'🚲',label:r.tipo,color:'#999'};
  var hasBike=r.bikesAsig&&r.bikesAsig.length>0;
  var bikesLine=r.lineas&&r.lineas.length>1?r.lineas.map(function(l){var tl=tipos[l.tipo]||{label:l.tipo};return tl.label+' talla '+esc(l.talla)+(l.uds>1?' x'+l.uds:'');}).join(', '):t.label+' '+esc(r.talla)+(r.uds>1?' x'+r.uds:'');
  var fields=[['Entrada',fmtD(r.ini)],['Salida',fmtD(r.fin)],['Duración',r.dias+' días'],['📍 Inicio',esc(r.lugarIni||'-')],['🏁 Finalización',esc(r.lugarFin||'Santiago de Compostela')],['🚚 Dir. entrega',esc(r.dirEntrega||'-')],['Bicicleta(s)',bikesLine],['Asignada(s)',hasBike?r.bikesAsig.map(function(b){return b.num;}).join(', '):'Sin asignar'],['Total',r.total?(r.total+cfg.currency):'-'],['Origen',r.origen==='publico'?'Portal web':'Interno']];
  document.getElementById('mdetail-body').innerHTML='<div style="display:flex;align-items:center;gap:12px;margin-bottom:18px"><div style="width:50px;height:50px;background:'+t.color+'18;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0">'+t.icon+'</div><div style="flex:1"><div style="font-family:var(--fontd);font-size:18px;font-weight:700">'+esc(r.cliente)+'</div><div style="font-size:13px;color:var(--g400)">'+esc(r.tel)+(r.email?' - '+esc(r.email):'')+(r.dni?' - DNI: '+esc(r.dni):'')+'</div></div><span class="badge '+sc.cls+'"><span class="bdot"></span>'+sc.lbl+'</span></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:14px">'+fields.map(function(f){return '<div style="background:var(--g50);border-radius:8px;padding:9px 12px"><div style="font-size:10px;font-weight:700;color:var(--g400);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">'+f[0]+'</div><div style="font-size:14px;font-weight:600;color:'+(f[1]==='Sin asignar'?'var(--am500)':'var(--g900)')+'">'+f[1]+'</div></div>';}).join('')+'</div>'+(r.notas?'<div style="background:var(--am50);border:1px solid var(--am100);border-radius:8px;padding:11px 14px;margin-bottom:8px"><div style="font-size:10px;font-weight:700;color:var(--am600);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px">Notas</div><div style="font-size:13px">'+esc(r.notas)+'</div></div>':'')+
  (r.extras&&r.extras.length?'<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:11px 14px"><div style="font-size:10px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">🎒 Extras</div>'+r.extras.map(function(e){return '<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:13px"><span>'+e.icono+'</span><span style="flex:1">'+esc(e.nombre)+(e.lineaTipo?'<span style="font-size:10px;color:var(--g400);margin-left:4px">('+esc((tipos[e.lineaTipo]||{label:e.lineaTipo}).label)+' '+esc(e.lineaTalla||'')+')</span>':'')+'</span><span style="color:var(--g500)">×'+(e.qty||1)+'</span><span style="font-weight:700;color:#0d9488">'+(( e.precio||0)*(e.qty||1)).toFixed(0)+cfg.currency+'</span></div>';}).join('')+'</div>':'');
  document.getElementById('mdetail-ftr').innerHTML='<div style="display:flex;gap:6px;flex-wrap:wrap;width:100%"><button class="btn bs bsm" onclick="closeM(\'mdetail\')">Cerrar</button><button class="btn bs bsm" onclick="closeM(\'mdetail\');openEditRes('+r.id+')">Editar</button><button class="btn ba bsm" onclick="closeM(\'mdetail\');openEditRes('+r.id+');setTimeout(openQRAsign,200)">Asignar bici</button>'+(r.estado==='pendiente'?'<button class="btn bb bsm" onclick="changeStatus('+r.id+',\'confirmada\')">Confirmar</button>':'')+(r.estado==='confirmada'?'<button class="btn bg- bsm" onclick="changeStatus('+r.id+',\'activa\')">Activar</button>':'')+(['activa','confirmada'].indexOf(r.estado)>=0?'<button class="btn ba bsm" onclick="changeStatus('+r.id+',\'finalizada\')">Finalizar</button>':'')+(['activa','finalizada','confirmada'].indexOf(r.estado)>=0?'<button class="btn bi bsm" onclick="closeM(\'mdetail\');genFactFromRes('+r.id+')">Factura</button>':'')+(r.estado!=='cancelada'?'<button class="btn bd bsm" onclick="changeStatus('+r.id+',\'cancelada\')">Cancelar</button>':'')+'</div>';
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
  var lista = reservas.filter(function(r){
    return r.estado==='confirmada'||r.estado==='activa'||r.estado==='pendiente';
  });
  if (!lista.length) { toast('No hay reservas para imprimir'); return; }

  var LOGO = 'data:image/jpeg;base64,' + "/9j/7gAOQWRvYmUAZAAAAAAA/9sAQwAGBAUGBQQGBgUGBwcGCAoQCgoJCQoUDg8MEBcUGBgXFBYWGh0lHxobIxwWFiAsICMmJykq" +
    "KRkfLTAtKDAlKCko/8AAFAgAyAH+BEMRAE0RAFkRAEsRAP/EAB0AAQABBAMBAAAAAAAAAAAAAAAFBAYHCAIDCQH/xABWEAABAwMC" +
    "AwQHAwYICgkEAwEBAAIDBAURBhIHITETQVFhCBQiMnGBkUJSoRUjNnR1szdicoKSorGyFhckMzQ4Y3PBwxglQ0RTxNHh8JOjtPEm" +
    "VMI1/9oADgRDAE0AWQBLAAA/AMUWO7XBuvKCvFbUmsdco3mYyEuJMozk9+QSFiux3a4DXlBX+u1JrHXKN5mMhLiTKM5PfnJCx9Zb" +
    "pXjW9DXeuVHrZuLHmUyEuJMozk+eStddN3Wvbrm3XMVk/wCUDXxymoLzvLjIMknvyvQALf0LeoL0zHRERERERERERERERERERERE" +
    "RERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERE" +
    "REREREREREREREREREREREREREREREREREREREREREREXnlZP0rt/wC0Iv3oXnpZP0rt/wC0Iv3oWhFm/Sig/X4v3oXl/p39JLb+" +
    "txf3wvQ0L0LC33C9QB0RERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERER" +
    "ERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERF55WT9K7f+0Iv3oX" +
    "npZP0rt/7Qi/ehaEWb9KKD9fi/eheX+nf0ktv63F/fC9DQvQsLfcL1AHRERERERERERERERERERERERERERERERERERERERERERE" +
    "RERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERE" +
    "REREREREREREREREREREREXnlZP0rt/7Qi/eheelk/Su3/tCL96FoRZv0ooP1+L96F5f6d/SS2/rcX98L0NC9Cwt9wvUAdERERER" +
    "ERERERERERERERERERERERERU5iqMkioHw2BQUluve9zo720AkkNNK3AHh1WLqvR/Eo1U01JxMjawvc6OKSxwlrWk8mk5zyHJF8L" +
    "6iLnIxsrB1LOR+i4SVd6tjd9bTwV9M3m59MC2Ro8dp6/JU9Vf+JGjIjU6jtVt1PZohumqbOHQ1UTB1cYXcnY8GlF3xyNkYHsOWnv" +
    "UzQVkFfSx1FLIJInjII/s+KyHpXUNs1VYqW72OqZVUNQ3LHt5EHvaR1BB5EFFyXepZERERERERERERERERERERERERERERERERER" +
    "EREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREReeVk/Su3" +
    "/tCL96F56WT9K7f+0Iv3oWhFm/Sig/X4v3oXl/p39JLb+txf3wvQ0L0LC33C9QB0REREREREREREREREREREREREREREREREXx7m" +
    "saXOIDR1JXVVVEVLTvmqJGxxMGXOccABUN7utDZLVU3K61MVLRUzDJLNI7AaB/x8B1JRU9A0hkjiC1r3lzWnuChNGwSspKuofG6G" +
    "GqqHTRROGC1h6cu7Kxn6OtrraWw3+61FLJQUF7u01woKKRu0xQO90lv2d3h4AeKKpVwLLSIiIiIiIiIiIiIiIiIiIiIiIiIiIiIi" +
    "IiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIi88rJ" +
    "+ldv/aEX70Lz0sn6V2/9oRfvQtCLN+lFB+vxfvQvL/Tv6SW39bi/vhehoXoWFvuF6gDoiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiI" +
    "uLo2ucHOGSOmegVLPQU9RUNmqGdq5nNjXklrT4hvTPmoG6aTtF3u8Fxu1M6vlpyHQRVEjnwwuH2mxE7N38YgnwIRcIphJLLHggsP" +
    "f3rot91jrLjX0YjdHJSOAO4+8D3hRmktd0motXao082kmpayxTMjd2rge2Y4HD2gdBy+hHii7VIq8URERERERERERERERERERERE" +
    "RERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERE" +
    "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" +
    "6j1BI3MjpGUETse6AN7x8yY/oqe3tIg7R3vyHefmoXRkBbaPW5udRWvNRIT15nkPoscejpapIdBfl+v9q7ajqJLpVSHqd7jsGfAN" +
    "5j+UVtIqlTyymi6Zxse2YfZ5O/k/+yiLyw0dTBdYwcQjs6gD7URPM/zTz+GVj3iPA7T15tuu6Nji23tNJdmMGTJQPOXPx3mJ2JB5" +
    "b0XcpdpDmgggg8wQsgRSMljbJG5r2OAc1zTkEHoQURFyREQoqKmHY180Q91w3gK07C38mauuVubygnaKiNvcD34+p+iwFwsjGieP" +
    "+stIQ/m7Xc4W3WjjHRh5Eho7vecPgwIq1XYs+oiIiIi8v6f9JY/1sf30RF6gBERasem9eXiLTFlY47HGaskbnqRhjD+L0RFU+hJY" +
    "GMtWodQSMzLLMyhicR0a0B78fEuZ/RREWzyIiIiIiIiIiIiIiIqG+2ynvVlr7ZWtDqasgfTyAj7L2lp/tREXmvaaqo0jrekqSS2q" +
    "tNe1zsfeik5j8CiIvTSJ7ZI2vYctcA4HxBREXJERERERERERERFrj6VXCeG72mo1lYoAy6UbN9fGxv8ApEIHOT+WwdfFo8giIsXe" +
    "ifr2XTeuWafq5T+Sr04RBrjyjqMew4fyvcPjlvgiIt30REREREREREREREREREREREREREREREREREREREREREREREREREXnvprb" +
    "/hrae0xs/KcO7Ph2zV59aa2/4a2ntMbPylDuz4ds1aG6d2/4Y2vtPc/KMO7Ph2wXmJpPaNX2ftfc9eh3Z8O0blegOxxrWvx7AYRn" +
    "zyt7JKSZ+rIKrsyadlI5m/uDi/p9FtbW2K4z8erbe/VHutNPYZaf1jI2tmdNnb45Lea9Ox0XeplZFRERERERERERFxl/zb89MFU9" +
    "ywbfVbvd7J2foVD6yDDpC9ibHZGhn358OzdlFib0gdv+JO578Z7WDb8e2b/7rC/FbH/R5rO069tFsz4+sN/91rjpzP8A0O4u3/8A" +
    "7J7PP63/APtYd9LLb/iWum7G71im2/HtR/wysQ+ibu/xkVu33fyZJu/+pHhY49E/d/jIrdvu/kyTd/8AUjwuHoubv8YVZt938nSb" +
    "v/qR4WBPQ13f42anbnH5Lm3fDfH/AMcLblbbralbulEReaPEz+EjVX7Vq/3rkRF6N6W/Rq0/qkP9xqIi1l9OTf2+jv8Aw9tX9cxL" +
    "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" +
    "IrJvXDDTN61TUX+5Us01dPC2F47dwYQ3GDtHfgAKyb1wx0zetU1F/uVLNNXTwtheO3cGENxg7R34ACs28cN9OXjU099uNLNNWzRN" +
    "heO2cGEDGDtHfgALHOpuDekdS6tqtRXimqp66pibHI0VDmxnaAA4AcwcNA648leyvZXksjIiIiIiIiIiIiIiIiIiIiIiIiIiIiIi" +
    "IiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiItN/TZ/Tuxfs3/AJr0RFlH0NP4Jqr9qzfu4kRFndERERERERERERERERERERER" +
    "ERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERcZHtjY58jmtY0ZLnHAAXGR7Y2O" +
    "fI5rWNGS5xwAF8ke2NjnyODWNGS5xwAFxlkZFG6SVzWMaMuc44AHiSuQORkdFyByMjovoORkdFyBBGRzBRERERF1yzxRPiZLKxj5" +
    "TtY1zgC84zgeJwCuuWeKJ8bJZWMfKdrGucAXHGcDxOAVwkmiifGySRjHyHaxrnAFxxnA8eQXXLUQwyRMlljY+V22NrnAF5xnAHec" +
    "AlcmSMeXBjmuLTtdg5wfArkyRjy4Mc1xadrsHOD4FfWPY8uDHNdtO12DnB8CuUcjJC8Rva4sdtdg5wfA+fNclyXJckRERERERFxj" +
    "eyWNr43NexwyHNOQQuMb2SxtfG5r2OGQ5pyCFxje2RjXxua5jhkOacghcYpGSxtkie17HDLXNOQR5FclyXJckREXGORksbXxua9j" +
    "hkOacgj4rjHIyWNr43NexwyHNOQQuMb2yMa+NzXMcMhzTkFcYpGSxtkie17HDLXNOQR5FcZZ4onRtllYx0jtjA5wBccZwPE4BXGW" +
    "eKJ0bZZWMdI7YwOcAXHGcDxOAV8lmiidG2WRjHSO2sDnAFxxnA8TgFcZqiGF8TJpY43Su2RhzgC92M4HicA8l2LsXNdi66ieKmid" +
    "LUSsiibjL3uDQOeOpXXUTxU0TpaiVkUTcZe9waBzx1K4TzRU8RlnkZFG3q57g0Du6lddTUQ0sLpqmWOGJuMvkcGtGTgcz5rsXYua" +
    "7EJABJOAO9CQASTgDvQkAEk4AQkAEkgAcySvkb2yMa9jg5jhkOByCPFfGPbIxr2ODmOGQ4HIIXxj2vY17HBzXDIIOQQuMb2yRtfG" +
    "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" +
    "5OA0DqATkgHl0Vp644a6g11WxtvV4t9thpHSer3C1QSMrJWOPKN+XYawDqATlwB5YwsorKCyUsuoiIiIiIiIiIiIiIiIiIiIiIiI" +
    "iIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiItN/TZ/Tuxfs3/mvREWUfQ0/gmqv2rN+7iREWd0RERERERERERERERERE" +
    "RERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERE" +
    "REREREREREREREREREREREREREREREREREREREREREREREWm/ps/p3Yv2b/zXoiLKPoafwTVX7Vm/dxIiLO6IiIiIiIiIiIiIiIi" +
    "IiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIi" +
    "IiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiLT702qSoGrrBWGCT1V1C6IS7Tt3iRxLc+OCD80RFlL0P6Kpo+EZd" +
    "VQSRNqLhNNFvbjezaxu4eWWn6IiLN6IiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIiIi" +
    "IiIiIiIiIiIiIiIiIiIiIiIv/9k=";
  var hoyStr = new Date().toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric'});
  var paginas = [];

  lista.forEach(function(r){
    var lineas = r.lineas&&r.lineas.length ? r.lineas : [{tipo:r.tipo,talla:r.talla,uds:r.uds||1,extras:r.extras||[]}];
    lineas.forEach(function(l){
      var uds = l.uds||1;
      for(var u=0;u<uds;u++){
        var t = tipos[l.tipo]||{label:l.tipo||'',icon:'\uD83D\uDEB2'};
        var asig = r.bikesAsig&&r.bikesAsig.filter(function(a){return a.tipo===l.tipo&&a.talla===l.talla;});
        var bikeNum = asig&&asig[u] ? asig[u].num : '\u2014';
        var extrasLinea = l.extras&&l.extras.length ? l.extras.slice() : [];
        var fechaIni = r.ini ? new Date(r.ini+'T00:00:00') : null;
        var fechaEntrega = fechaIni ? new Date(fechaIni.getTime()-86400000) : null;
        paginas.push({
          resId:       r.id,
          cliente:     r.cliente||'',
          tel:         r.tel||'',
          fechaEntrega: fechaEntrega ? fechaEntrega.toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) : '\u2014',
          lugarFin:    r.lugarFin||'Santiago de Compostela',
          dirEntrega:  r.dirEntrega||'',
          fechaIni:    fechaIni ? fechaIni.toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'}) : '\u2014',
          fechaFin:    r.fin ? new Date(r.fin+'T00:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'}) : '\u2014',
          dias:        r.dias||'',
          modelo:      t.label,
          icon:        t.icon||'\uD83D\uDEB2',
          talla:       l.talla||r.talla||'',
          bikeNum:     bikeNum,
          extras:      extrasLinea,
          notas:       r.notas||''
        });
      }
    });
  });

  var pJson = JSON.stringify(paginas).replace(/<\/script>/gi,'<\\/script>');

  var css = [
    '*{box-sizing:border-box;margin:0;padding:0}',
    'body{font-family:Arial,Helvetica,sans-serif;background:#fff;color:#111}',
    '.hoja{width:190mm;margin:10mm auto;border:2px solid #111;border-radius:4px;overflow:hidden;page-break-after:always}',
    '.hoja:last-child{page-break-after:auto}',
    '.cab{display:flex;justify-content:space-between;align-items:center;padding:6mm 8mm;border-bottom:2.5px solid #111}',
    '.cab img{height:22mm;width:auto;max-width:80mm;object-fit:contain}',
    '.cab-qr{display:flex;flex-direction:column;align-items:center;gap:3px}',
    '.qr-lbl{font-size:9px;font-weight:700;color:#374151;text-align:center;margin-top:2px}',
    '.body{padding:4mm 8mm 2mm}',
    '.campo{border:1.5px solid #374151;border-radius:4px;margin-bottom:4px;overflow:hidden}',
    '.lbl{background:#1f2937;color:#fff;font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;padding:3px 8px}',
    '.val{padding:5px 10px;font-size:14px;font-weight:800;min-height:24px}',
    '.val.grande{font-size:18px;font-weight:900}',
    '.val.alerta{font-size:15px;font-weight:900;color:#b45309;background:#fffbeb}',
    '.g2{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:4px}',
    '.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-bottom:4px}',
    '.g2 .campo,.g3 .campo{margin-bottom:0}',
    '.ext-val{padding:5px 10px;display:flex;flex-wrap:wrap;gap:4px;min-height:24px}',
    '.tag{background:#fef3c7;border:1px solid #fcd34d;border-radius:3px;padding:2px 7px;font-size:11px;font-weight:700;color:#92400e}',
    '.obs-val{padding:5px 10px;min-height:20mm;font-size:13px}',
    '.pie{border-top:2px solid #111;padding:4mm 8mm;display:flex;justify-content:space-between;align-items:flex-end;background:#f9fafb}',
    '.pie-txt{font-size:10px;color:#6b7280}',
    '.firma{border-top:1px solid #374151;width:65mm;text-align:center;padding-top:3px;font-size:10px;color:#6b7280;font-weight:700}',
    '@media print{@page{margin:8mm;size:A4 portrait}body{margin:0}.hoja{margin:0 auto;border-radius:0}}'
  ].join('');

  var html = '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/>'
    + '<title>Hojas Bici</title>'
    + '<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>'
    + '<style>' + css + '</style></head><body>'
    + '<script>'
    + 'var L=' + JSON.stringify('data:image/jpeg;base64,' + logo_b64) + ';'
    + 'var H=' + JSON.stringify(hoyStr) + ';'
    + 'var P=' + pJson + ';'
    + 'function xe(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}'
    + 'window.onload=function(){'
    +   'P.forEach(function(p,i){'
    +     'var ext=p.extras&&p.extras.length?p.extras.map(function(e){var span=document.createElement("span");span.className="tag";span.textContent=(e.icono||"")+" "+xe(e.nombre||"Extra")+(e.qty>1?" x"+e.qty:"");return span.outerHTML;}).join(""):"<span style=\"color:#9ca3af\">Sin extras</span>";'
    +     'var sitio=p.dirEntrega||p.lugarFin||"Santiago de Compostela";'
    +     'var div=document.createElement("div");div.className="hoja";'
    +     'div.innerHTML='
    +       '"<div class=\"cab\"><img src=\""+L+"\" alt=\"Bicips\"/>"'
    +         '+"<div class=\"cab-qr\"><div id=\"qr"+i+"\"></div><div class=\"qr-lbl\">Reserva #"+p.resId+"<\/div><\/div><\/div>"'
    +       '+"<div class=\"body\">"'
    +         '+"<div class=\"campo\"><div class=\"lbl\">Cliente<\/div><div class=\"val grande\">"+xe(p.cliente)+"<\/div><\/div>"'
    +         '+(p.tel?"<div class=\"campo\"><div class=\"lbl\">Telefono<\/div><div class=\"val\">"+xe(p.tel)+"<\/div><\/div>":"")'
    +         '+"<div class=\"campo\"><div class=\"lbl\">Entregar antes de<\/div><div class=\"val alerta\">"+xe(p.fechaEntrega)+"<\/div><\/div>"'
    +         '+"<div class=\"campo\"><div class=\"lbl\">Sitio de entrega<\/div><div class=\"val grande\">"+xe(sitio)+"<\/div><\/div>"'
    +         '+"<div class=\"g2\">"'
    +           '+"<div class=\"campo\"><div class=\"lbl\">Inicio alquiler<\/div><div class=\"val\">"+xe(p.fechaIni)+"<\/div><\/div>"'
    +           '+"<div class=\"campo\"><div class=\"lbl\">Fin alquiler<\/div><div class=\"val\">"+xe(p.fechaFin)+" ("+p.dias+" dias)<\/div><\/div>"'
    +         '+"<\/div>"'
    +         '+"<div class=\"g3\">"'
    +           '+"<div class=\"campo\"><div class=\"lbl\">Modelo<\/div><div class=\"val\">"+p.icon+" "+xe(p.modelo)+"<\/div><\/div>"'
    +           '+"<div class=\"campo\"><div class=\"lbl\">Talla<\/div><div class=\"val\">"+xe(p.talla)+"<\/div><\/div>"'
    +           '+"<div class=\"campo\"><div class=\"lbl\">N bici<\/div><div class=\"val\">"+xe(p.bikeNum)+"<\/div><\/div>"'
    +         '+"<\/div>"'
    +         '+"<div class=\"campo\"><div class=\"lbl\">Extras y accesorios<\/div><div class=\"ext-val\">"+ext+"<\/div><\/div>"'
    +         '+"<div class=\"campo\"><div class=\"lbl\">Observaciones<\/div><div class=\"obs-val\">"+xe(p.notas)+"<\/div><\/div>"'
    +       '+"<\/div>"'
    +       '+"<div class=\"pie\"><div class=\"pie-txt\">Impreso: "+H+"<\/div><div class=\"firma\">Firma transportista<\/div><\/div>";'
    +     'document.body.appendChild(div);'
    +     'try{new QRCode(document.getElementById("qr"+i),{text:"Res#"+p.resId+" "+p.cliente,width:72,height:72,colorDark:"#1f2937",colorLight:"#fff",correctLevel:QRCode.CorrectLevel.M});}catch(e){}'
    +   '});'
    +   'setTimeout(function(){window.print();},900);'
    + '};'
    + '<\/script></body></html>';

  try {
    var w=window.open('','_blank');
    if(!w||w.closed) throw new Error('popup');
    w.document.open(); w.document.write(html); w.document.close();
  } catch(e) {
    var ov=document.createElement('div');
    ov.style.cssText='position:fixed;inset:0;background:#fff;z-index:99999;overflow:auto';
    ov.innerHTML='<button onclick="this.parentNode.remove()" style="position:fixed;top:10px;right:10px;padding:7px 14px;background:#ef4444;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer;z-index:100000">Cerrar</button>'
      +'<iframe id="hbf" style="width:100%;height:100%;border:none"></iframe>';
    document.body.appendChild(ov);
    var fr=document.getElementById('hbf');
    fr.contentDocument.open(); fr.contentDocument.write(html); fr.contentDocument.close();
  }
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
    if(resF!=='all'&&r.estado!==resF)return;
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
  if(fc)fc.textContent=rows.length+' fila'+(rows.length!==1?'s':'')+' · '+reservas.filter(function(r){return resF==='all'||r.estado===resF;}).length+' reservas';
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
    if(resF!=='all'&&r.estado!==resF)return false;
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
    if(resF!=='all'&&r.estado!==resF)return false;
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
    var dbPreparar  = results[8];
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

    // Aplicar datos taller (variables de taller-merged.js)
    if (typeof hist !== 'undefined' && Object.keys(dbHist).length) hist = dbHist;
    if (typeof CLS !== 'undefined' && dbCLS) CLS = dbCLS;
    if (typeof photos !== 'undefined' && Object.keys(dbPhotos).length) photos = dbPhotos;

    // Caché compartida preparar
    window._sharedReservas = reservas;
    window._sharedPreparar = prepararIds;

    // Si la BD está vacía, generar demo
    if (!bikes.length && !reservas.length) {
      generarDemoData();
    }

  } catch(e) {
    console.error('initApp error:', e);
    toast('⚠️ Error conectando con la base de datos. Usando datos locales.', 4000);
    // Fallback a datos de demo
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

initApp();

