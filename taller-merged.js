// ── DATA ──────────────────────────────────────────────────
// NOTA: tipos y bikes vienen de reservas.js (globales compartidas).
// TD e IB eliminados — eran código muerto del archivo independiente anterior.
const DCL = {
  urbana:   ['Frenos delantero y trasero','Cadena limpia y lubricada','Neumáticos presión correcta','Luces delantera y trasera','Sillín regulado y apretado','Manillar alineado','Cambios (si aplica)','Pedales bien apretados','Guardabarros sin rozar','Timbre funciona'],
  montana:  ['Freno delantero hidráulico','Freno trasero hidráulico','Suspensión delantera','Suspensión trasera (si aplica)','Cambios delanteros','Cambios traseros','Cadena limpia','Platos y piñones','Neumáticos sin cortes','Tija sillín y potencia'],
  electrica:['Batería con carga','Conector batería OK','Display funciona','Motor responde','Sistema PAS','Frenos revisados','Cable acelerador','Luces LED','Cargador incluido','Neumáticos presión'],
  cargo:    ['Frenos delantero y trasero','Carga máxima señalizada','Arnés sujeción carga','Neumáticos reforzados','Cuadro sin grietas','Luces reglamentarias','Freno de aparcamiento','Timbre','Reflectantes laterales','Anclaje caja/plataforma'],
  infantil: ['Freno contrapedal','Ruedines (si aplica)','Sillín ajustado','Manillar a altura','Neumáticos presión','Pedales seguros','Reflectantes','Cadena lubricada','Protector cadena','Accesorios seguros'],
  gravel:   ['Freno hidráulico delantero','Freno hidráulico trasero','Presión tubeless','Cambio trasero','Plato único','Tija telescópica','Potencia y manillar','Pedales SPD','Cadena y piñones','Horquilla rigidez']
};
const PS = ['Cámara de aire','Neumático','Pastillas de freno','Cable de freno','Funda cable','Cable cambio','Cadena','Piñón','Cassette','Plato','Pedales','Grip manillar','Sillín','Tija sillín','Potencia manillar','Rodamiento pedalier','Aceite cadena','Desengrasante','Parche tubeless','Disco de freno','Líquido hidráulico'];

// ── STORAGE ───────────────────────────────────────────────
// ── Variables propias del taller (compartidas con reservas.js) ─
// bikes y tipos ya declarados en reservas.js — se comparten directamente
let CLS=DCL, hist={}, photos={};
// Checklist ANTES DE ENTREGA: uno distinto por cada modelo (clave = tipos[k]).
// Si un modelo aún no tiene el suyo, se propone esta lista genérica para empezar.
let CLE={};
const DCLE_GEN=['Frenos delantero y trasero ajustados','Presión de neumáticos','Ruedas centradas y cierres apretados','Cambios ajustados','Cadena limpia y lubricada','Sillín y tija apretados','Manillar y potencia apretados','Pedales montados según la reserva','Luces funcionan','Timbre','Extras de la reserva incluidos','Limpieza general','Etiqueta QR visible'];

// ── Guardar en Supabase ─────────────────────────────────────────
const sb=()=>DB.saveBicis(bikes).catch(e=>console.error('sb',e));
const sc=()=>DB.saveConfig('clistas', CLS).catch(e=>console.error('sc',e));
const sce=()=>DB.saveConfig('clistasEntrega', CLE).catch(e=>console.error('sce',e));
const sh=()=>DB.saveConfig('historial', hist).catch(e=>console.error('sh',e));
const st=()=>DB.saveConfig('tipos', tipos).catch(e=>console.error('st',e));
const sp=()=>DB.saveConfig('photos', photos).catch(e=>console.error('sp',e));

// ── STATE ─────────────────────────────────────────────────
let cv='dashboard', ft=null, fs=null, fe='all', aB=null, cs={}, pu=[], te='disponible', ect='urbana', eci=[], etc='urbana', cfs='';

// ── UTILS ─────────────────────────────────────────────────
const ns=()=>new Date().toLocaleString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
// Las ventanas no se cierran al pulsar el fondo (ver reservas.js): solo con ✕ o Cancelar.

// ── SIDEBAR ───────────────────────────────────────────────
function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open');document.getElementById('sidebar-overlay').classList.toggle('open');}
function closeSidebar(){document.getElementById('sidebar').classList.remove('open');document.getElementById('sidebar-overlay').classList.remove('open');}

// ── VIEWS ─────────────────────────────────────────────────
function showView(v){
  // Scope ONLY to taller views (vd, vb, vt) to avoid touching reservas views
  var tallerViews = ['vd','vb','vt'];
  tallerViews.forEach(function(id){
    var el=document.getElementById(id);
    if(el) el.classList.remove('active');
  });
  var prepView = document.getElementById('preparar-view');
  if(prepView) prepView.classList.add('hidden');

  // Show requested view
  var viewId=v==='dashboard'?'vd':v==='bikes'?'vb':v==='taller'?'vt':null;
  if(viewId){
    var viewEl=document.getElementById(viewId);
    if(viewEl) viewEl.classList.add('active');
  } else if(v==='preparar'){
    // preparar-view lives inside vb — need vb active too
    var vbEl = document.getElementById('vb');
    if(vbEl) vbEl.classList.add('active');
    if(prepView) prepView.classList.remove('hidden');
    // Hide the type-selector inside vb
    var tsv = document.getElementById('type-selector-view');
    if(tsv) tsv.style.display = 'none';
    var blv = document.getElementById('bike-list-view');
    if(blv) blv.classList.add('hidden');
  }

  // Update sidebar nav items (taller uses .nav-item, reservas uses .ni)
  document.querySelectorAll('.nav-item').forEach(function(n){n.classList.remove('active');});
  var navEl=document.getElementById('nav-'+v);
  if(navEl) navEl.classList.add('active');

  // Also update the unified sidebar .ni items for taller
  document.querySelectorAll('.ni[id^="nav-taller"]').forEach(function(n){n.classList.remove('on');});
  var uniNav=document.getElementById('nav-taller-'+v);
  if(uniNav) uniNav.classList.add('on');

  var titles={dashboard:'Panel General',bikes:'Bicicletas',taller:'Hoja de Taller',preparar:'Preparar bicicletas'};
  var titleEl=document.getElementById('topbar-title');
  if(titleEl) titleEl.textContent=titles[v]||'';
  cv=v;
  if(v==='dashboard') rDB();
  if(v==='bikes') rBV();
  if(v==='preparar'){renderPreparar();updPrepBadge();}
}

// ── DASHBOARD ─────────────────────────────────────────────
function rDB(){
  document.getElementById('today-label').textContent=new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const avr=bikes.filter(b=>b.estado==='averiada').length;
  const enReparto=bikes.filter(b=>b.estado==='reparto').length;
  const enStock=bikes.filter(b=>b.estado==='stock').length;
  const allR=Object.values(hist).flat();
  const todayR=allR.filter(r=>{try{return new Date(r.ts).toLocaleDateString('es-ES')===new Date().toLocaleDateString('es-ES');}catch{return false;}}).length;
  document.getElementById('stats-grid').innerHTML=[
    {c:'blue',  i:'🚲', v:bikes.length, l:'Total bicicletas'},
    {c:'green', i:'✅', v:bikes.filter(b=>b.estado==='disponible').length, l:'Disponibles'},
    {c:'red',   i:'⚠️', v:avr, l:'Averiadas'},
    {c:'amber', i:'📋', v:todayR, l:'Revisiones hoy'},
  ].map(s=>`<div class="stat-card ${s.c}"><div class="stat-icon">${s.i}</div><div class="stat-value">${s.v}</div><div class="stat-label">${s.l}</div></div>`).join('');

  document.getElementById('dash-types').innerHTML=Object.entries(tipos).map(([k,t])=>{
    const cnt=bikes.filter(b=>b.tipo===k).length;
    const disp=bikes.filter(b=>b.tipo===k&&b.estado==='disponible').length;
    const aver=bikes.filter(b=>b.tipo===k&&b.estado==='averiada').length; // FIX: solo averiadas reales
    return `<div class="type-card" onclick="showView('bikes');setTF('${k}')" style="border-left-color:${t.color}">
      <div class="type-card-header">
        <div class="type-thumb" style="background:${t.color}18">${t.icon}</div>
        <div class="type-count-badge">${cnt}</div>
      </div>
      <div class="type-name">${t.label}</div>
      <div class="type-meta">
        <span><span class="type-dot" style="background:#22c55e"></span> ${disp} disponibles</span>
        ${aver>0?`<span><span class="type-dot" style="background:#ef4444"></span> ${aver} averiadas</span>`:''}
      </div>
    </div>`;
  }).join('');

  const recentR=Object.values(hist).flat().sort((a,b)=>b.id-a.id).slice(0,4);
  if(!recentR.length){
    document.getElementById('dash-recent').innerHTML=`<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">Sin revisiones aún</div></div>`;
    return;
  }
  document.getElementById('dash-recent').innerHTML=`<div class="list-card"><div class="bike-table">`+recentR.map(rev=>{
    const b=bikes.find(x=>x.id===rev.bikeId);
    const bk=bikes.find(x=>hist[x.id]?.includes(rev));
    const t=bk?tipos[bk.tipo]:null;
    const pct=rev.totalItems?Math.round(rev.checkedCount/rev.totalItems*100):0;
    const th=bk?.icono&&bk.icono.startsWith('data:')?`<img src="${bk.icono}" style="width:100%;height:100%;object-fit:cover"/>`:t?.icon||'🚲';
    return `<div class="bike-row">
      <div class="bike-thumb">${th}</div>
      <div class="bike-main">
        <div class="bike-name-row">
          <span class="bike-name">${bk?esc(bk.numBici):'—'}</span>
          <span class="badge badge-${pct===100?'green':'blue'}">${pct}%</span>
        </div>
        <div class="bike-details">
          <span class="bike-detail-item">🕐 ${esc(rev.fecha)}</span>
          <span class="bike-detail-item">👤 ${esc(rev.tecnico)}</span>
        </div>
      </div>
    </div>`;
  }).join('')+`</div></div>`;
}

// ── BIKES VIEW ────────────────────────────────────────────
function rBV(){
  if(!ft){
    document.getElementById('type-selector-view').classList.remove('hidden');
    document.getElementById('bike-list-view').classList.add('hidden');
    document.getElementById('type-selector-grid').innerHTML=Object.entries(tipos).map(([k,t])=>{
      const cnt=bikes.filter(b=>b.tipo===k).length;
      const disp=bikes.filter(b=>b.tipo===k&&b.estado==='disponible').length;
      const aver=bikes.filter(b=>b.tipo===k&&b.estado==='averiada').length; // FIX: solo averiadas reales
      return `<div class="type-card" onclick="setTF('${k}')" style="border-left-color:${t.color}">
        <div class="type-card-header">
          <div class="type-thumb" style="background:${t.color}18">${t.icon}</div>
          <div class="type-count-badge">${cnt}</div>
        </div>
        <div class="type-name">${t.label}</div>
        <div class="type-meta">
          <span><span class="type-dot" style="background:#22c55e"></span> ${disp} disp.</span>
          ${aver>0?`<span><span class="type-dot" style="background:#ef4444"></span> ${aver} aver.</span>`:''}
        </div>
      </div>`;
    }).join('');
  } else {
    document.getElementById('type-selector-view').classList.add('hidden');
    document.getElementById('bike-list-view').classList.remove('hidden');
    const t=tipos[ft]||{};
    document.getElementById('bike-list-title').textContent=t.label||'Bicicletas';
    document.getElementById('bike-list-sub').textContent=`${bikes.filter(b=>b.tipo===ft).length} bicicletas en este grupo`;
    renderSizeFilters();
    renderBL();
  }
}
function setTF(t){ft=t;fs=null;fe='all';document.getElementById('srch').value='';rBV();}
function clearTF(){ft=null;fs=null;rBV();}
function setFE(v,btn){fe=v;document.querySelectorAll('.filter-tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderBL();}
function renderSizeFilters(){
  const sizes=['Todas',...(tipos[ft]?.sizes||[])];
  document.getElementById('size-filters').innerHTML=sizes.map(s=>`<button class="size-chip ${(!fs&&s==='Todas')||fs===s?'active':''}" onclick="setSF('${s}')">${s}</button>`).join('');
}
function setSF(s){fs=s==='Todas'?null:s;renderSizeFilters();renderBL();}

function renderBL(){
  const q=(document.getElementById('srch')?.value||'').toLowerCase();
  const list=bikes.filter(b=>{
    if(ft&&b.tipo!==ft)return false;
    if(fs&&b.talla!==fs)return false;
    if(fe!=='all'&&b.estado!==fe)return false;
    if(q)return[b.numBici,b.numSerie,b.qr||'',b.modelo||''].some(s=>s.toLowerCase().includes(q));
    return true;
  });
  if(!list.length){document.getElementById('bike-table').innerHTML=`<div class="empty-state"><div class="empty-state-icon">🚲</div><div class="empty-state-text">Sin resultados</div></div>`;return;}
  document.getElementById('bike-table').innerHTML=list.map(b=>{
    const t=tipos[b.tipo]||{icon:'🚲',color:'#999',label:b.tipo};
    const d=b.estado==='disponible';
    // FIX: usar el estado real (antes cualquier estado ≠ disponible salía como "Averiada")
    const be=BIKE_ESTADOS[b.estado]||BIKE_ESTADOS.disponible;
    const hp=photos[b.id]?'<span title="Foto de serie">📷</span>':'';
    const rev=(hist[b.id]||[]).length;
    const thumb=b.icono&&b.icono.startsWith('data:')?`<img src="${b.icono}" style="width:100%;height:100%;object-fit:cover"/>`:`<span style="font-size:22px">${t.icon}</span>`;
    return `<div class="bike-row">
      <div class="bike-thumb" style="background:${t.color}15">${thumb}</div>
      <div class="bike-main">
        <div class="bike-name-row">
          <span class="bike-name">${esc(b.numBici)}</span>
          <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:700;background:${be.bg};color:${be.txt}">${be.icon} ${be.lbl}</span>
          <span class="badge badge-gray">${esc(b.talla)}</span>
          ${hp}
        </div>
        <div class="bike-details">
          <span class="bike-detail-item">📋 ${esc(b.modelo||'')}</span>
          <span class="bike-detail-item">🔢 ${esc(b.numSerie)}</span>
          <span class="bike-detail-item">📡 QR: ${esc(b.qr||b.numBici)}</span>
          <span class="bike-detail-item">🔧 ${rev} rev.</span>
          ${_ultEntregaHTML(b)}
        </div>
      </div>
      <div class="bike-actions">
        <button class="btn btn-ghost btn-icon" title="Historial" onclick="openHB(${b.id})">📋</button>
        <button class="btn btn-ghost btn-icon" title="Editar" onclick="openEB(${b.id})">✏️</button>
        <button class="btn ${b.estado==='disponible'?'btn-secondary':'btn-success'} btn-sm" onclick="toggleE(${b.id})">${b.estado==='disponible'?'⚠️ Averiar':'✅ Activar'}</button>
        <button class="btn btn-secondary btn-sm" title="Checklist antes de entregar" onclick="openCE(${b.id})">☑️ Entrega</button>
        <button class="btn btn-primary btn-sm" onclick="openT(${b.id})">🔧 Taller</button>
      </div>
    </div>`;
  }).join('');
}

// Check if bike has pending/active reservations — reads shared DB cache
function getReservasActivasBike(bikeId, numBici, talla, tipo){
  // FIX: usa la global reservas (cargada por initApp) en lugar de _sharedReservas
  var today=(typeof todayS==='function')?todayS():new Date().toISOString().slice(0,10); // fecha local
  return reservas.filter(function(r){
    if(r.estado==='cancelada'||r.estado==='finalizada')return false;
    // Check by bikeId or bikesAsig or tipo+talla match
    var porId=r.bikeId===bikeId||(r.bikesAsig&&r.bikesAsig.some(function(a){return a.id===bikeId;}));
    var porTipo=!porId&&r.tipo===tipo&&r.talla===talla;
    if(!porId&&!porTipo)return false;
    // Future or ongoing
    return r.fin>=today;
  });
}

function confirmarAveriada(bikeId, onConfirm){
  var b=bikes.find(function(x){return x.id===bikeId;});
  if(!b)return;
  if(b.estado==='averiada'){onConfirm();return;}

  var pendientes=getReservasActivasBike(bikeId, b.numBici, b.talla, b.tipo);
  if(!pendientes.length){onConfirm();return;}

  // Count remaining available stock of same tipo+talla (excluding this bike)
  var stockRestante=bikes.filter(function(bk){
    return bk.id!==bikeId && bk.tipo===b.tipo && bk.talla===b.talla && (bk.estado==='disponible'||bk.estado==='stock');
  }).length;

  // For each affected reservation, check if there's enough stock to cover it
  var sinCobertura=[];
  var conCobertura=[];
  pendientes.forEach(function(r){
    // Count how many reservations of same tipo+talla overlap with this one (excluding current bike's res)
    var reservas2=[];
    reservas2 = window._sharedReservas || [];
    var solapantes=reservas2.filter(function(r2){
      if(r2.id===r.id)return false;
      if(r2.estado==='cancelada'||r2.estado==='finalizada')return false;
      if(r2.tipo!==b.tipo||r2.talla!==b.talla)return false;
      return !(r2.fin<r.ini||r2.ini>r.fin);
    }).length;
    // If stock remaining > solapantes, it can be covered
    if(stockRestante>solapantes){conCobertura.push(r);}
    else{sinCobertura.push(r);}
  });

  var sinStock=sinCobertura.length>0;

  // Build modal content
  var bgColor=sinStock?'#fef2f2':'#fffbeb';
  var borderColor=sinStock?'#fecaca':'#fde68a';
  var iconAlert=sinStock?'🚨':'⚠️';

  var html='<div style="background:'+bgColor+';border:1px solid '+borderColor+';border-radius:10px;padding:12px 14px;margin-bottom:14px">';
  if(sinStock){
    html+='<div style="font-size:15px;font-weight:800;color:#dc2626;margin-bottom:6px">'+iconAlert+' SIN STOCK SUFICIENTE</div>';
    html+='<div style="font-size:13px;color:#7f1d1d"><strong>'+b.numBici+'</strong> ('+b.modelo+' '+b.talla+') tiene <strong>'+sinCobertura.length+' reserva'+(sinCobertura.length>1?'s':'')+' sin cobertura</strong>: no hay otras bicis del mismo modelo y talla disponibles para esas fechas.</div>';
  } else {
    html+='<div style="font-size:14px;font-weight:700;color:#92400e;margin-bottom:6px">'+iconAlert+' Hay alquileres afectados</div>';
    html+='<div style="font-size:13px;color:#78350f"><strong>'+b.numBici+'</strong> tiene reservas pero hay stock suficiente ('+stockRestante+' bici'+(stockRestante>1?'s':'')+' disponible'+(stockRestante>1?'s':'')+' del mismo modelo).</div>';
  }
  html+='</div>';

  // List affected reservations
  html+='<div style="max-height:220px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:12px">';
  pendientes.forEach(function(r){
    var noTieneStock=sinCobertura.indexOf(r)>=0;
    return html+='<div style="display:flex;align-items:center;gap:8px;padding:9px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;background:'+(noTieneStock?'#fef2f2':'#fff')+'">'
      +(noTieneStock?'<span style="color:#dc2626;font-size:16px;flex-shrink:0">❌</span>':'<span style="color:#16a34a;font-size:16px;flex-shrink:0">✅</span>')
      +'<div style="flex:1"><div style="font-weight:700">'+esc(r.cliente)+'</div>'
      +'<div style="font-size:11px;color:#6b7280">'+(r.ini||'')+' → '+(r.fin||'')+(r.lugarIni?' · '+esc(r.lugarIni):'')+'</div></div>'
      +'<span style="font-size:11px;padding:2px 8px;border-radius:4px;font-weight:700;background:'+(noTieneStock?'#fee2e2':'#dcfce7')+';color:'+(noTieneStock?'#991b1b':'#15803d')+'">'+(noTieneStock?'Sin stock':'Con stock')+'</span>'
      +'</div>';
  });
  html+='</div>';

  if(sinStock){
    html+='<div style="font-size:12px;color:#6b7280;background:#f9fafb;border-radius:8px;padding:10px 12px">💡 Considera asignar manualmente otras bicis a esas reservas antes de proceder, o añade más stock del mismo modelo.</div>';
  }

  document.getElementById('m-aver-body').innerHTML=html;
  // Update modal title
  var title=document.querySelector('#m-aver-warn .modal-title');
  if(title)title.textContent=sinStock?'🚨 Sin stock suficiente — bici con reservas':'⚠️ Bicicleta con alquileres pendientes';
  // Confirm button style
  var btn=document.getElementById('m-aver-confirm');
  if(btn){
    btn.style.background=sinStock?'#dc2626':'#d97706';
    btn.style.color='#fff';
    btn.style.border='none';
    btn.textContent=sinStock?'⚠️ Marcar averiada (sin stock)':'Marcar averiada igualmente';
  }
  document.getElementById('m-aver-confirm').onclick=function(){
    closeM('m-aver-warn');
    onConfirm();
  };
  openM('m-aver-warn');
}

function toggleE(id){
  const b=bikes.find(x=>x.id===id); if(!b)return;
  if(b.estado==='averiada'){
    b.estado='disponible';
    sb(); renderBL(); rDB();
    toast(b.numBici+' → ✅ Disponible');
    return;
  }
  confirmarAveriada(id, function(){
    b.estado='averiada';
    sb(); renderBL(); rDB();
    toast(b.numBici+' → ⚠️ Averiada');
  });
}

function delBike(id){
  const b = bikes.find(x=>x.id===id);
  if(!b){ toast('❌ Bicicleta no encontrada'); return; }
  const ok = window.confirm('¿Eliminar la bicicleta ' + b.numBici + '?\nSe perderán todas sus revisiones y fotos guardadas.\n\nEsta acción no se puede deshacer.');
  if(!ok) return;
  bikes = bikes.filter(x=>x.id!==id);
  if(hist[id]) delete hist[id];
  if(photos[id]) delete photos[id];
  sb(); sh(); sp();
  renderBL(); rDB();
  toast('🗑️ Bicicleta ' + b.numBici + ' eliminada');
}

// ── PESTAÑAS HISTORIAL DE BICI ────────────────────────────────────
// ── Registrar cambio de estado en historial de la bici ──────────
function _registrarEstadoBici(bici, nuevoEstado, nota) {
  if(!bici) return;
  if(!bici.estadosHist) bici.estadosHist = [];
  var ultimo = bici.estadosHist[bici.estadosHist.length-1];
  if(ultimo && ultimo.estado === nuevoEstado) return; // no duplicar
  bici.estadosHist.push({
    estado: nuevoEstado,
    fecha:  new Date().toLocaleString('es-ES'),
    ts:     new Date().toISOString(),
    nota:   nota || ''
  });
  if(bici.estadosHist.length > 200) bici.estadosHist = bici.estadosHist.slice(-200);
  sb(); // save to supabase
}


function switchBikeTab(tab) {
  var btnE = document.getElementById('tab-estados-btn');
  var btnA = document.getElementById('tab-alquileres-btn');
  var contE = document.getElementById('tab-estados-content');
  var contA = document.getElementById('tab-alquileres-content');
  if(!btnE) return;
  var activeStyle = 'padding:10px 20px;border:none;background:none;font-size:14px;font-weight:700;cursor:pointer;border-bottom:3px solid #0d9488;color:#0d9488;margin-bottom:-2px';
  var inactiveStyle = 'padding:10px 20px;border:none;background:none;font-size:14px;font-weight:600;cursor:pointer;color:#9ca3af;border-bottom:3px solid transparent;margin-bottom:-2px';
  if(tab === 'estados') {
    btnE.style.cssText = activeStyle;
    btnA.style.cssText = inactiveStyle;
    contE.style.display = 'block';
    contA.style.display = 'none';
    renderBikeEstadosHist();
  } else {
    btnA.style.cssText = activeStyle;
    btnE.style.cssText = inactiveStyle;
    contA.style.display = 'block';
    contE.style.display = 'none';
    renderBikeAlquileresHist();
  }
}

function renderBikeEstadosHist() {
  var el = document.getElementById('bike-estados-hist');
  if(!el || !aB) return;
  var histBike = (aB.estadosHist || []).slice().reverse();
  if(!histBike.length) {
    el.innerHTML = '<div style="color:#9ca3af;font-size:13px;text-align:center;padding:20px">Sin historial de estados</div>';
    return;
  }
  el.innerHTML = histBike.map(function(h) {
    var est = BIKE_ESTADOS[h.estado] || {icon:'', lbl:h.estado, bg:'#f3f4f6', border:'#e5e7eb', txt:'#374151'};
    return '<div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:'+est.bg+';border:1px solid '+est.border+';border-radius:8px">'
      + '<span style="font-size:20px">'+est.icon+'</span>'
      + '<div style="flex:1">'
      + '<div style="font-weight:700;color:'+est.txt+'">'+esc(est.lbl)+'</div>'
      + '<div style="font-size:12px;color:#6b7280">'+esc(h.fecha)+(h.nota?' · '+esc(h.nota):'')+'</div>'
      + '</div>'
      + '</div>';
  }).join('');
}

function renderBikeAlquileresHist() {
  var el = document.getElementById('bike-alquileres-hist');
  if(!el || !aB) return;
  // Find all reservations that used this bike
  var resShared = window._sharedReservas || [];
  var misRes = resShared.filter(function(r) {
    return r.bikesAsig && r.bikesAsig.some(function(a){return a.id === aB.id;});
  }).sort(function(a,b){ return (b.ini||'').localeCompare(a.ini||''); });

  if(!misRes.length) {
    el.innerHTML = '<div style="color:#9ca3af;font-size:13px;text-align:center;padding:20px">Sin alquileres registrados</div>';
    return;
  }
  el.innerHTML = misRes.map(function(r) {
    var estado = BIKE_ESTADOS ? '' : '';
    var sc = {pendiente:'#fef3c7',confirmada:'#dbeafe',alquiler:'#dcfce7',recogida:'#f3f4f6',cancelada:'#fee2e2'};
    var bg = sc[r.estado] || '#f9fafb';
    return '<div style="padding:12px 14px;background:'+bg+';border:1px solid #e5e7eb;border-radius:8px">'
      + '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">'
      + '<div style="font-weight:800;font-size:14px">'+esc(r.cliente||'-')+'</div>'
      + '<div style="font-size:12px;font-weight:700;color:#6b7280">'+esc(r.estado||'')+'</div>'
      + '</div>'
      + '<div style="font-size:12px;color:#374151">📅 '+esc(r.ini||'-')+' → '+esc(r.fin||'-')+'  ·  '+esc(String(r.dias||''))+ ' días</div>'
      + '<div style="font-size:12px;color:#374151;margin-top:2px">📍 '+esc(r.lugarIni||'-')+' → '+esc(r.lugarFin||'Santiago de Compostela')+'</div>'
      + (r.total?'<div style="font-size:13px;font-weight:800;color:#0d9488;margin-top:4px">'+r.total+'€</div>':'')
      + '</div>';
  }).join('');
}


// ── TALLER ────────────────────────────────────────────────
function openT(id){
  aB=bikes.find(b=>b.id===id);if(!aB)return;
  const t=tipos[aB.tipo]||{icon:'🚲',label:'Bici'};
  // thumb
  const th=document.getElementById('taller-thumb');
  if(aB.icono&&aB.icono.startsWith('data:')){th.innerHTML=`<img src="${aB.icono}" style="width:100%;height:100%;object-fit:cover"/>`;} else {th.innerHTML=`<span>${t.icon}</span>`;}
  document.getElementById('taller-name').textContent=`${aB.numBici} — ${aB.modelo||t.label}`;
  document.getElementById('taller-meta').innerHTML=`<span>📋 Serie: ${esc(aB.numSerie)}</span><span>📡 QR: ${esc(aB.qr||aB.numBici)}</span><span>📏 Talla: ${esc(aB.talla)}</span>`;
  document.getElementById('taller-estado-badge').innerHTML=`<span class="badge badge-${aB.estado==='disponible'?'green':'red'}"><span class="badge-dot"></span>${aB.estado==='disponible'?'Disponible':'Averiada'}</span>`;
  document.getElementById('t-tec').value='';
  document.getElementById('t-notas').value='';
  pu=[];te=aB.estado||'disponible';setTE(te);
  cfs=photos[aB.id]||'';renderFS();
  const cl=CLS[aB.tipo]||[];cs={};cl.forEach(i=>cs[i]=false);
  renderCL();renderPT();updProg();showView('taller');window.scrollTo(0,0);
  // Reset to estados tab
  switchBikeTab('estados');
}
function setTE(v){
  te=v;
  var el=document.getElementById('te-btns');
  if(el){
    el.innerHTML=['disponible','averiada'].map(function(k){
      var e=BIKE_ESTADOS[k];var sel=v===k;
      return '<button type="button" onclick="setTE(\''+k+'\')" style="padding:7px 16px;border-radius:8px;border:2px solid '+(sel?e.color:e.border)+';background:'+(sel?e.bg:'#fff')+';color:'+(sel?e.txt:'#374151')+';font-size:13px;font-weight:700;cursor:pointer">'+e.icon+' '+e.lbl+'</button>';
    }).join('');
  }
  // Keep old IDs working too
  var ed=document.getElementById('e-disp');
  var ea=document.getElementById('e-aver');
  if(ed)ed.className='toggle-opt'+(v==='disponible'?' sel-green':'');
  if(ea)ea.className='toggle-opt'+(v==='averiada'?' sel-red':'');
}
const ckeys=()=>Object.keys(cs);
function renderCL(){
  const cl=CLS[aB?.tipo]||[];
  document.getElementById('cl-items').innerHTML=cl.length?cl.map((item,i)=>`<div class="check-item${cs[item]?' done':''}" id="ci${i}" onclick="tChk(${i})"><div class="check-box">${cs[item]?'✓':''}</div><span class="check-text">${esc(item)}</span></div>`).join(''):`<div class="empty-state" style="padding:24px"><div class="empty-state-text">Sin ítems en el checklist.<br>Edítalo desde el menú.</div></div>`;
}
function tChk(i){const k=ckeys()[i];if(!k)return;cs[k]=!cs[k];const el=document.getElementById('ci'+i);if(el){el.classList.toggle('done',cs[k]);el.querySelector('.check-box').textContent=cs[k]?'✓':'';}updProg();}
function chkAll(v){ckeys().forEach(k=>cs[k]=v);renderCL();updProg();}
function updProg(){
  const tot=ckeys().length,done=Object.values(cs).filter(Boolean).length,pct=tot?Math.round(done/tot*100):0;
  document.getElementById('t-pct').textContent=pct+'%';
  document.getElementById('t-pct').style.color=pct===100?'var(--green-600)':'var(--blue-600)';
  const bar=document.getElementById('t-bar');bar.style.width=pct+'%';bar.className='progress-fill'+(pct===100?' complete':'');
  document.getElementById('t-sub').textContent=`${done} de ${tot} ítems completados`;
}
function renderPT(){
  const el=document.getElementById('t-parts');
  if(!pu.length){el.innerHTML=`<div class="empty-state" style="padding:24px 12px"><div style="font-size:20px;margin-bottom:6px">🔩</div><div style="font-size:12px;color:var(--gray-400)">Sin piezas registradas</div></div>`;return;}
  el.innerHTML=pu.map((p,i)=>`<div class="part-row"><div class="part-dot"></div><div class="part-info"><div class="part-name">${esc(p.nombre)}</div><div class="part-meta">Cant: ${p.qty}${p.ref?' · Ref: '+esc(p.ref):''}</div></div><button class="btn btn-danger btn-xs" onclick="rmp(${i})">✕</button></div>`).join('');
}
function rmp(i){pu.splice(i,1);renderPT();}

// ── FOTO NUM SERIE ────────────────────────────────────────
function handleFS(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{cfs=ev.target.result;renderFS();};r.readAsDataURL(f);e.target.value='';}
function renderFS(){
  const ph=document.getElementById('fs-ph'),pv=document.getElementById('fs-prev'),img=document.getElementById('fs-img');
  if(cfs){ph.style.display='none';img.src=cfs;pv.style.display='block';}
  else{ph.style.display='flex';pv.style.display='none';img.src='';}
}
function clearFS(){cfs='';renderFS();}

function saveTaller(){
  // Validaciones con mensajes claros
  var errores = [];
  const tec=document.getElementById('t-tec').value.trim();
  if(!tec) errores.push('Nombre del técnico');
  const tot=ckeys().length;
  const done=Object.values(cs).filter(Boolean).length;
  if(tot>0 && done===0) errores.push('Al menos un ítem del checklist');

  if(errores.length){
    // Mostrar flotante rojo con los campos que faltan
    toast('🔴 Faltan datos: ' + errores.join(', '), 4000, 'error');
    // También marcar el campo técnico visualmente si falta
    var tecInput = document.getElementById('t-tec');
    if(!tec && tecInput){
      tecInput.style.borderColor='#dc2626';
      tecInput.focus();
      setTimeout(function(){tecInput.style.borderColor='';}, 3000);
    }
    return;
  }

  const notas=document.getElementById('t-notas').value.trim();
  const reg={id:Date.now(),ts:new Date().toISOString(),fecha:ns(),tecnico:tec,notas,checklist:{...cs},checkedCount:done,totalItems:tot,piezas:[...pu],estadoResultante:te,bikeId:aB.id};
  if(!hist[aB.id])hist[aB.id]=[];
  hist[aB.id].unshift(reg);if(hist[aB.id].length>50)hist[aB.id]=hist[aB.id].slice(0,50);
  sh();
  // Record estado change in bike history
  _registrarEstadoBici(aB, te, tec);
  function doSaveT(){
    const idx=bikes.findIndex(b=>b.id===aB.id);if(idx>=0){bikes[idx].estado=te;sb();}
    if(cfs){photos[aB.id]=cfs;sp();}
    toast('✅ Revisión guardada correctamente', 3000, 'success');showView('bikes');aB=null;
  }
  if(te==='averiada'&&aB.estado!=='averiada'){
    confirmarAveriada(aB.id, doSaveT);
  } else {
    doSaveT();
  }
}

// ── ADD/EDIT BIKE ─────────────────────────────────────────
function abSizes(){
  const tipoSel=document.getElementById('ab-tipo');
  const talSel=document.getElementById('ab-tal');
  // Populate tipo options dynamically if empty
  if(!tipoSel.options.length||tipoSel.getAttribute('data-loaded')!=='1'){
    const prev=tipoSel.value;
    tipoSel.innerHTML=Object.entries(tipos).map(([k,t])=>`<option value="${k}">${t.icon} ${t.label}</option>`).join('');
    if(prev)tipoSel.value=prev;
    tipoSel.setAttribute('data-loaded','1');
  }
  const t=tipoSel.value;
  talSel.innerHTML=(tipos[t]?.sizes||['M']).map(s=>`<option>${s}</option>`).join('');
}
// abSizes() called later when modal opens
let abe='disponible';
function setABE(v){
  abe=v;
  document.getElementById('ab-est').value=v;
  var el=document.getElementById('ab-estado-btns');
  if(!el)return;
  el.innerHTML=['disponible','averiada'].map(function(k){
    var e=BIKE_ESTADOS[k];var sel=v===k;
    return '<button type="button" onclick="setABE(\''+k+'\')" style="padding:7px 16px;border-radius:8px;border:2px solid '+(sel?e.color:e.border)+';background:'+(sel?e.bg:'#fff')+';color:'+(sel?e.txt:'#374151')+';font-size:13px;font-weight:700;cursor:pointer">'+e.icon+' '+e.lbl+'</button>';
  }).join('');
}
function handleBikePic(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{const d=ev.target.result;document.getElementById('ab-ico').value=d;document.getElementById('ab-pic-img').src=d;document.getElementById('ab-pic-img').style.display='block';document.getElementById('ab-pic-ph').style.display='none';document.getElementById('ab-pic-del').classList.remove('hidden');};r.readAsDataURL(f);e.target.value='';}
function clearBikePic(){document.getElementById('ab-ico').value='';document.getElementById('ab-pic-img').src='';document.getElementById('ab-pic-img').style.display='none';document.getElementById('ab-pic-ph').style.display='block';document.getElementById('ab-pic-del').classList.add('hidden');}
function setBikePicPreview(src){if(src&&src.startsWith('data:')){document.getElementById('ab-ico').value=src;document.getElementById('ab-pic-img').src=src;document.getElementById('ab-pic-img').style.display='block';document.getElementById('ab-pic-ph').style.display='none';document.getElementById('ab-pic-del').classList.remove('hidden');}else{clearBikePic();}}
function _abQrError(m){var e=document.getElementById('ab-qr-err');if(e){e.textContent=m||'';e.style.display=m?'block':'none';}var i=document.getElementById('ab-qr');if(i)i.style.borderColor=m?'#dc2626':'';}
function abReset(){_abQrError('');window._ebIcono='';window._ebDesdeET=false;document.getElementById('madd-title').textContent='Nueva bicicleta';document.getElementById('ab-savebtn').textContent='Añadir bicicleta';document.getElementById('ab-eid').value='';['ab-num','ab-ser','ab-qr','ab-mod'].forEach(id=>document.getElementById(id).value='');clearBikePic();var ts=document.getElementById('ab-tipo');ts.removeAttribute('data-loaded');abSizes();setABE('disponible');}
function openEB(id){_abQrError('');const b=bikes.find(x=>x.id===id);if(!b)return;document.getElementById('madd-title').textContent='Editar bicicleta';document.getElementById('ab-savebtn').textContent='Guardar cambios';document.getElementById('ab-eid').value=id;document.getElementById('ab-num').value=b.numBici;document.getElementById('ab-ser').value=b.numSerie||'';document.getElementById('ab-qr').value=b.qr||'';document.getElementById('ab-mod').value=b.modelo||'';setBikePicPreview(b.icono||'');var ts=document.getElementById('ab-tipo');ts.removeAttribute('data-loaded');abSizes();ts.value=b.tipo;if(b.tipo&&ts.value!==b.tipo){var ot=document.createElement('option');ot.value=b.tipo;ot.textContent=b.tipo+' (no está en la lista)';ts.appendChild(ot);ts.value=b.tipo;}abSizes();var tl=document.getElementById('ab-tal');tl.value=b.talla;if(b.talla&&tl.value!==b.talla){var ol=document.createElement('option');ol.value=b.talla;ol.textContent=b.talla+' (talla actual, no está en el modelo)';tl.appendChild(ol);tl.value=b.talla;}window._ebIcono=b.icono||'';setABE(b.estado||'disponible');openM('madd');}
function saveBikeM(){
  const num=document.getElementById('ab-num').value.trim();
  if(!num){toast('⚠️ El número de bicicleta es obligatorio');return;}
  const ser=document.getElementById('ab-ser').value.trim();
  const _qrEl=document.getElementById('ab-qr');
  const qrIn=(typeof bcpNormalizar==='function')?bcpNormalizar(_qrEl.value):_qrEl.value.trim().toUpperCase();
  _qrEl.value=qrIn; _abQrError('');
  const qr=qrIn||num;
  if(qrIn.indexOf('BCP')===0&&typeof bcpValido==='function'&&!bcpValido(qrIn)){_abQrError('Código no válido: las etiquetas van de BCP-0001 a BCP-1000.');toast('⚠️ Código de etiqueta no válido: debe ser BCP-0001 a BCP-1000');return;}
  // Solo las etiquetas BCP tienen que ser únicas. Los códigos antiguos pueden estar repetidos
  // en bicis ya dadas de alta y eso no debe impedir editar la bici.
  const _dupQr=(typeof bcpValido==='function'&&bcpValido(qr))?bikes.find(b=>String(b.id)!==String(document.getElementById('ab-eid').value)&&String(b.qr||'').toUpperCase()===qr.toUpperCase()):null;
  if(_dupQr){_abQrError('El código '+qr+' ya está en la bici '+_dupQr.numBici+'. Usa otra etiqueta.');toast('⚠️ El código '+qr+' ya está en la bici '+_dupQr.numBici);return;}
  const modelo=document.getElementById('ab-mod').value.trim();
  const _icoForm=document.getElementById('ab-ico').value;
  // si la bici tenía un icono (emoji) y no se ha puesto foto, se conserva
  const icono=_icoForm||(document.getElementById('ab-eid').value&&window._ebIcono&&window._ebIcono.indexOf('data:')!==0?window._ebIcono:'');
  const tipo=document.getElementById('ab-tipo').value,talla=document.getElementById('ab-tal').value;
  if(!tipo||!talla){toast('⚠️ Elige tipo y talla de la bicicleta');return;}
  const estado=document.getElementById('ab-est').value||'disponible';
  const eid=document.getElementById('ab-eid').value;
  function doSave(){
    if(eid){const idx=bikes.findIndex(b=>String(b.id)===String(eid));if(idx>=0)bikes[idx]={...bikes[idx],numBici:num,numSerie:ser,qr,modelo,icono,tipo,talla,estado};toast('✅ Bicicleta actualizada');}
    else{bikes.push({id:Date.now(),numBici:num,numSerie:ser,qr,modelo,icono,tipo,talla,estado});toast('✅ Bicicleta añadida');}
    sb();closeM('madd');rDB();if(cv==='bikes')rBV();
    if(window._ebDesdeET){window._ebDesdeET=false;openM('met');renderET();}
  }
  if(estado==='averiada'&&eid){
    const prevBike=bikes.find(b=>String(b.id)===String(eid));
    if(prevBike&&prevBike.estado!=='averiada'){
      confirmarAveriada(parseInt(eid),doSave);
      return;
    }
  }
  doSave();
}

// ── QR SCANNER ────────────────────────────────────────────

// QR CAMERA - full implementation with file:// fallback
// QR SCANNER
var qrs=null, qra=null, qron=false;

function qrStatus(msg,type){
  var el=document.getElementById('qr-status');if(!el)return;
  if(!msg){el.style.display='none';return;}
  var bg={'ok':'#f0fdf4','warn':'#fffbeb','err':'#fef2f2'}[type]||'#fffbeb';
  var cl={'ok':'#15803d','warn':'#b45309','err':'#dc2626'}[type]||'#b45309';
  el.style.cssText='display:block;padding:10px 14px;border-radius:10px;font-size:13px;margin-bottom:12px;background:'+bg+';color:'+cl;
  el.innerHTML=msg;
}

function openQRCamera(){
  qrStatus('','');
  if(window.BarcodeDetector){
    if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&window.location.protocol!=='file:'){
      startQR();
    } else {
      document.getElementById('qr-file-input').click();
    }
  } else if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&window.location.protocol!=='file:'){
    startQR();
  } else {
    document.getElementById('qr-file-input').click();
  }
}

function startQR(){
  if(qron)return;
  qrStatus('Activando cámara...','ok');
  navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}}})
    .catch(function(){return navigator.mediaDevices.getUserMedia({video:true});})
    .then(function(stream){
      qrs=stream;
      var v=document.getElementById('qr-video');
      v.srcObject=stream; v.muted=true; v.setAttribute('playsinline','');
      var p=v.play(); if(p&&p.catch)p.catch(function(){v.muted=true;v.play();});
      var wrap=document.getElementById('qr-wrap');
      if(wrap){wrap.style.display='block';wrap.classList.add('active');}
      var bstop=document.getElementById('b-stopqr');
      if(bstop)bstop.style.display='block';
      qron=true;
      qrStatus('📷 Apunta al código QR','ok');
      tickQR();
    })
    .catch(function(){
      qron=false;
      document.getElementById('qr-file-input').click();
    });
}

function stopQR(){
  if(qrs){qrs.getTracks().forEach(function(t){t.stop();});qrs=null;}
  if(qra){cancelAnimationFrame(qra);qra=null;}
  var v=document.getElementById('qr-video'); if(v)v.srcObject=null;
  var wrap=document.getElementById('qr-wrap'); if(wrap){wrap.style.display='none';wrap.classList.remove('active');}
  var bstop=document.getElementById('b-stopqr'); if(bstop)bstop.style.display='none';
  qron=false;
}

function tickQR(){
  var v=document.getElementById('qr-video'),cv=document.getElementById('qr-canvas');
  if(!v||!cv)return;
  var ctx=cv.getContext('2d');
  if(v.readyState===v.HAVE_ENOUGH_DATA){
    cv.width=v.videoWidth; cv.height=v.videoHeight; ctx.drawImage(v,0,0);
    if(window.BarcodeDetector){
      var bd=new BarcodeDetector({formats:['qr_code','aztec','data_matrix','code_128']});
      bd.detect(cv).then(function(codes){
        if(codes&&codes.length){stopQR();processQR(codes[0].rawValue);}
      }).catch(function(){});
    } else if(typeof jsQR!=='undefined'){
      try{var img=ctx.getImageData(0,0,cv.width,cv.height);var code=jsQR(img.data,img.width,img.height,{inversionAttempts:'attemptBoth'});if(code&&code.data){stopQR();processQR(code.data);return;}}catch(e){}
    }
  }
  if(qron)qra=requestAnimationFrame(tickQR);
}

function scanQRFromFile(event){
  var file=event.target.files&&event.target.files[0];if(!file)return;
  qrStatus('Analizando imagen...','ok');
  var reader=new FileReader();
  reader.onload=function(ev){
    var img=new Image();
    img.onload=function(){
      if(window.BarcodeDetector){
        var bd=new BarcodeDetector({formats:['qr_code','aztec','data_matrix','code_128','ean_13']});
        bd.detect(img).then(function(codes){
          event.target.value='';
          if(codes&&codes.length){qrStatus('','');processQR(codes[0].rawValue);}
          else{tryJsQRTaller(img,event);}
        }).catch(function(){tryJsQRTaller(img,event);});
      } else {tryJsQRTaller(img,event);}
    };
    img.onerror=function(){qrStatus('No se pudo leer la imagen.','err');event.target.value='';};
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
}

function tryJsQRTaller(img,event){
  if(typeof jsQR==='undefined'){
    qrStatus('No se detectó QR. Introduce el número manualmente.','warn');
    if(event)event.target.value=''; return;
  }
  var scales=[1,1.5,0.75,0.5];
  for(var si=0;si<scales.length;si++){
    var sc=scales[si];
    var canvas=document.createElement('canvas');
    canvas.width=Math.round((img.naturalWidth||img.width)*sc);
    canvas.height=Math.round((img.naturalHeight||img.height)*sc);
    if(canvas.width<10)continue;
    var ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,canvas.width,canvas.height);
    var id=ctx.getImageData(0,0,canvas.width,canvas.height);
    var modes=['attemptBoth','dontInvert','onlyInvert'];
    for(var mi=0;mi<modes.length;mi++){
      try{var r=jsQR(id.data,id.width,id.height,{inversionAttempts:modes[mi]});if(r&&r.data){if(event)event.target.value='';qrStatus('','');processQR(r.data);return;}}catch(e){}
    }
  }
  if(event)event.target.value='';
  qrStatus('No se detectó QR. Intenta con más luz y enfoca bien el código.','err');
}

function processQR(data){
  if(typeof window._qrDestino==='function'){var f=window._qrDestino;stopQR();f(data);return;}
  if(window._qrModoAlta){_etiquetaLeida(data);return;}
  var raw=data.trim();
  var q=raw.toUpperCase();
  var found=bikes.find(function(b){
    var fields=[b.numBici||'',b.numSerie||'',b.qr||''].map(function(s){return s.toUpperCase();});
    if(fields.indexOf(q)>=0)return true;
    return false; // solo coincidencia exacta: evita confundir B-01 con B-010
  });
  if(found){closeM('mqr');toast('QR: '+found.numBici);openT(found.id);}
  else{
    qrStatus('Detectado: "'+raw+'" — no coincide con ninguna bici. Copia este texto en el campo QR de la ficha, o introdúcelo manualmente.','err');
    document.getElementById('qr-inp').value=raw;
  }
}

function doQS(){
  if(typeof window._qrDestino==='function'){var f=window._qrDestino;f(document.getElementById('qr-inp').value);return;}
  if(window._qrModoAlta){_etiquetaLeida(document.getElementById('qr-inp').value);return;}
  var q=document.getElementById('qr-inp').value.trim().toUpperCase();
  if(!q){toast('Introduce un código');return;}
  var found=bikes.find(function(b){
    return[b.numBici,b.numSerie,b.qr||''].map(function(s){return s.toUpperCase();}).indexOf(q)>=0;
  });
  if(found){stopQR();closeM('mqr');document.getElementById('qr-inp').value='';openT(found.id);}
  else toast('Bicicleta no encontrada');
}

// ── PIEZAS ────────────────────────────────────────────────
function initPartsDL(){
  var dl=document.getElementById('p-dl');
  var pq=document.getElementById('p-quick');
  if(dl) dl.innerHTML=PS.map(p=>`<option value="${esc(p)}"/>`).join('');
  if(pq) pq.innerHTML=PS.slice(0,14).map(p=>`<button type="button" class="size-chip" onclick="document.getElementById('p-n').value='${p.replace(/'/g,"\\'")}'">${p}</button>`).join('');
}
function addPart(){const n=document.getElementById('p-n').value.trim();if(!n){toast('⚠️ Escribe el nombre de la pieza');return;}const q=parseInt(document.getElementById('p-q').value)||1,r=document.getElementById('p-r').value.trim();pu.push({nombre:n,qty:q,ref:r});renderPT();closeM('mparts');document.getElementById('p-n').value='';document.getElementById('p-q').value='1';document.getElementById('p-r').value='';toast('🔩 Pieza añadida');}

// ── EDIT TIPOS ────────────────────────────────────────────
function renderET(){
  if(!tipos[etc])etc=Object.keys(tipos)[0];
  document.getElementById('et-tabs').innerHTML=Object.entries(tipos).map(([k,t])=>{const n=bikes.filter(b=>b.tipo===k).length;return `<button class="type-tab ${etc===k?'active':''}" onclick="swET('${k}')">${t.icon} ${esc(t.label)} <span style="opacity:.6;font-size:11px">(${n})</span></button>`;}).join('');
  const t=tipos[etc]||{};
  document.getElementById('et-n').value=t.label||'';document.getElementById('et-i').value=t.icon||'';document.getElementById('et-sz').value=(t.sizes||[]).join(', ');
  const ec=document.getElementById('et-color');if(ec)ec.value=/^#[0-9a-f]{6}$/i.test(t.color||'')?t.color:'#3b82f6';
  const cw=document.getElementById('et-cat-wrap'),cs=document.getElementById('et-cat');
  if(cw&&cs&&typeof categoriasBici==='function'){cw.style.display='';cs.innerHTML='<option value="">— Sin tipo (precio antiguo por talla) —</option>'+categoriasBici().map(c=>`<option${c===t.categoria?' selected':''}>${esc(c)}</option>`).join('');}
  const cl=document.getElementById('et-clave');if(cl)cl.textContent=etc?'clave interna: '+etc:'';
  renderETB();
}
function swET(k){etc=k;renderET();}
function saveET(){
  const name=document.getElementById('et-n').value.trim(),icon=document.getElementById('et-i').value.trim(),sizes=document.getElementById('et-sz').value.split(',').map(s=>s.trim()).filter(Boolean);
  if(!name||!icon){toast('⚠️ Nombre e icono requeridos');return;}
  if(!sizes.length){toast('⚠️ Añade al menos una talla');return;}
  // aviso si se quita una talla que tienen bicis de este modelo
  const quitadas=[...new Set(bikes.filter(b=>b.tipo===etc&&b.talla&&sizes.indexOf(b.talla)<0).map(b=>b.talla))];
  if(quitadas.length&&!confirm('Hay bicis de este modelo con talla '+quitadas.join(', ')+' que ya no estará en la lista.\nLas bicis conservan su talla, pero no podrás elegirla en reservas nuevas.\n\n¿Guardar igualmente?'))return;
  const upd={label:name,icon:icon,sizes:sizes};
  const ec=document.getElementById('et-color');if(ec&&ec.value)upd.color=ec.value;
  const cs=document.getElementById('et-cat');if(cs&&document.getElementById('et-cat-wrap').style.display!=='none')upd.categoria=cs.value;
  tipos[etc]={...tipos[etc],...upd};
  st();renderET();if(typeof initFlotaSelects==='function')initFlotaSelects();if(typeof renderModelosList==='function')renderModelosList();rDB();
  toast('✅ Modelo guardado');
}
function borrarModeloET(){
  const n=bikes.filter(b=>b.tipo===etc).length;
  if(n){toast('⚠️ No se puede eliminar: hay '+n+' bici'+(n!==1?'s':'')+' de este modelo. Muévelas o elimínalas primero.');return;}
  if(Object.keys(tipos).length<=1){toast('⚠️ Tiene que quedar al menos un modelo');return;}
  if(!confirm('¿Eliminar el modelo "'+((tipos[etc]||{}).label||etc)+'"?'))return;
  delete tipos[etc];etc=Object.keys(tipos)[0];st();renderET();if(typeof initFlotaSelects==='function')initFlotaSelects();rDB();toast('🗑️ Modelo eliminado');
}
function nuevaBiciDeModelo(){
  const k=etc;closeM('met');abReset();
  const ts=document.getElementById('ab-tipo');if(ts){ts.value=k;abSizes();}
  window._ebDesdeET=true;openM('madd');
}
function renderETB(){
  const list=bikes.filter(b=>b.tipo===etc);
  const nb=document.getElementById('et-nb');if(nb)nb.textContent='('+list.length+')';
  document.getElementById('et-bikes').innerHTML=list.length?list.map(b=>{
    const be=BIKE_ESTADOS[b.estado]||BIKE_ESTADOS.disponible;
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--gray-100)">
      <span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;background:${be.bg};color:${be.txt}">${be.icon} ${be.lbl}</span>
      <div style="flex:1"><strong style="font-size:13px">${esc(b.numBici)}</strong> <span style="font-size:12px;color:var(--gray-400)">${esc(b.modelo||'')} · ${esc(b.talla)}</span></div>
      <button class="btn btn-secondary btn-xs" onclick="closeM('met');openEB(${typeof b.id==='number'?b.id:"'"+String(b.id).replace(/'/g,'')+"'"});window._ebDesdeET=true">✏️ Editar</button>
      <button class="btn btn-danger btn-xs" onclick="delBikeFromET(${b.id})">🗑️</button>
    </div>`;
  }).join(''):`<div class="empty-state" style="padding:24px"><div class="empty-state-text">No hay bicicletas de este tipo</div></div>`;
}
function delBikeFromET(id){const b=bikes.find(x=>x.id===id);if(!b||!confirm(`¿Eliminar ${b.numBici}?`))return;bikes=bikes.filter(x=>x.id!==id);delete hist[id];delete photos[id];sb();sh();sp();renderETB();rDB();toast('🗑️ Bicicleta eliminada');}

// ── EDIT CHECKLIST ────────────────────────────────────────
let eclModo='taller', eclSugerida=false;
function _eclFuente(){return eclModo==='entrega'?CLE:CLS;}
function _eclCargar(){
  const src=_eclFuente();
  eclSugerida=eclModo==='entrega'&&!(CLE[ect]&&CLE[ect].length);
  eci=eclSugerida?[...DCLE_GEN]:[...(src[ect]||[])];
}
function setECLModo(m){eclModo=m;_eclCargar();renderECL(true);}
function abrirChecklistEntregaModelo(k){eclModo='entrega';ect=k||etc;openM('mecl');_eclCargar();renderECL(true);}
function renderECL(yaCargado){
  if(!tipos[ect])ect=Object.keys(tipos)[0];
  if(!yaCargado)_eclCargar();
  const mb=document.getElementById('ecl-modo');
  if(mb)mb.innerHTML=[['taller','🔧 Revisión de taller'],['entrega','🚚 Antes de cada entrega']].map(([k,l])=>`<button class="type-tab ${eclModo===k?'active':''}" onclick="setECLModo('${k}')">${l}</button>`).join('');
  const nt=document.getElementById('ecl-nota');
  if(nt){nt.style.display=eclSugerida?'':'none';nt.textContent='Este modelo aún no tiene checklist de entrega. Te propongo una lista genérica: ajústala a este modelo y pulsa Guardar.';}
  document.getElementById('ecl-tabs').innerHTML=Object.entries(tipos).map(([k,t])=>`<button class="type-tab ${ect===k?'active':''}" onclick="swCL('${k}')">${t.icon} ${t.label}</button>`).join('');
  renderECI();
}
function swCL(t){ect=t;_eclCargar();renderECL(true);}
function renderECI(){
  document.getElementById('ecl-items').innerHTML=eci.length?eci.map((item,i)=>`<div style="display:flex;align-items:center;gap:8px;padding:7px 4px;border-bottom:1px solid var(--gray-100)"><span style="font-size:12px;color:var(--gray-400);width:22px;flex-shrink:0">${i+1}</span><input class="form-input" style="flex:1;padding:6px 10px;font-size:13px" value="${esc(item)}" oninput="eci[${i}]=this.value"/><button onclick="eci.splice(${i},1);renderECI()" style="background:none;border:none;color:var(--red-400);cursor:pointer;font-size:18px;padding:0 4px;flex-shrink:0">✕</button></div>`).join(''):`<div class="empty-state" style="padding:20px"><div class="empty-state-text">Sin ítems. Añade el primero.</div></div>`;
}
function addCLI(){const v=document.getElementById('ecl-new').value.trim();if(!v)return;eci.push(v);document.getElementById('ecl-new').value='';renderECI();}
function saveCL(){
  if(eclModo==='entrega'){CLE[ect]=[...eci];sce();}else{CLS[ect]=[...eci];sc();}
  closeM('mecl');toast('✅ Checklist '+(eclModo==='entrega'?'de entrega':'de taller')+' guardado para '+(tipos[ect]?.label||ect));
  if(typeof renderBL==='function')renderBL();
}

// ── HISTORIAL ─────────────────────────────────────────────
function openHB(id){const sel=document.getElementById('hf');if(sel)sel.value=id;openM('mh');renderHistorial();}
function renderHistorial(){
  const sel=document.getElementById('hf'),cur=sel.value;
  sel.innerHTML='<option value="all">Todas las bicicletas</option>'+bikes.map(b=>`<option value="${b.id}" ${String(b.id)===String(cur)?'selected':''}>${esc(b.numBici)} — ${esc(b.modelo||b.tipo)}</option>`).join('');
  sel.value=cur;
  const fb=sel.value;
  let entries=[];Object.entries(hist).forEach(([bid,revs])=>revs.forEach(r=>entries.push({...r,bikeId:Number(bid)})));
  entries.sort((a,b)=>b.id-a.id);
  if(fb!=='all')entries=entries.filter(e=>String(e.bikeId)===String(fb));
  if(!entries.length){document.getElementById('h-list').innerHTML=`<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">Sin revisiones registradas</div></div>`;return;}
  document.getElementById('h-list').innerHTML=entries.map(rev=>{
    const b=bikes.find(x=>x.id===rev.bikeId),t=b?tipos[b.tipo]:null;
    const pct=rev.totalItems?Math.round(rev.checkedCount/rev.totalItems*100):0;
    const th=b?.icono&&b.icono.startsWith('data:')?`<img src="${b.icono}" style="width:100%;height:100%;object-fit:cover"/>`:(t?.icon||'🚲');
    const chkHTML=Object.entries(rev.checklist||{}).map(([item,val])=>`<div class="history-check-item" style="color:${val?'var(--blue-600)':'var(--gray-300)'}"><span>${val?'✓':'—'}</span><span style="text-decoration:${val?'none':'line-through'};color:${val?'var(--gray-700)':'var(--gray-300)'}">${esc(item)}</span></div>`).join('');
    const pzs=(rev.piezas||[]).map(p=>`<div style="font-size:12px;color:var(--gray-500);padding:2px 0;display:flex;gap:6px;align-items:center"><span>🔩</span>${esc(p.nombre)} × ${p.qty}${p.ref?` (${esc(p.ref)})`:''}</div>`).join('');
    return `<div class="history-entry">
      <div class="history-header" onclick="togH(this)">
        <div class="history-icon">${th}</div>
        <div class="history-info">
          <div class="history-title">${b?esc(b.numBici):'?'} <span style="font-weight:400;color:var(--gray-400)">— ${esc(rev.fecha)}</span>${rev.tipo==='entrega'?` <span class="badge ${rev.resultado==='apta'?'badge-green':'badge-red'}">🚚 Antes de entrega · ${rev.resultado==='apta'?'Apta':'No apta'}</span>`:''}</div>
          <div class="history-meta">
            <span>👤 ${esc(rev.tecnico)}</span>
            <span>✅ ${rev.checkedCount}/${rev.totalItems} ítems</span>
            <span>🔩 ${(rev.piezas||[]).length} piezas</span>
            ${rev.estadoResultante?`<span>${rev.estadoResultante==='disponible'?'🟢 Disponible':'🔴 Averiada'}</span>`:''}
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span class="badge ${pct===100?'badge-green':'badge-blue'}">${pct}%</span>
          <span id="tg-arr" style="color:var(--gray-300);font-size:16px">▾</span>
        </div>
      </div>
      <div class="history-body">
        <div class="history-grid">
          <div><div class="history-section-title">Checklist</div>${chkHTML||'<div class="empty-state-text" style="font-size:12px">Sin ítems</div>'}</div>
          <div>
            ${rev.notas?`<div class="history-section-title">Notas</div><div style="font-size:13px;color:var(--gray-600);line-height:1.6;margin-bottom:12px">${esc(rev.notas)}</div>`:''}
            ${pzs?`<div class="history-section-title">Piezas utilizadas</div>${pzs}`:''}
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}
function togH(h){const b=h.nextElementSibling,o=b.style.display!=='none';b.style.display=o?'none':'block';h.querySelector('#tg-arr').textContent=o?'▾':'▴';}

// ── INIT ──────────────────────────────────────────────────
document.getElementById('topbar-date').textContent=new Date().toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'});
// PREPARAR — lee reservas marcadas desde reservas-bicicletas.html
function getPrepararData(){
  // FIX: usa la global reservas (cargada por initApp) en lugar de _sharedReservas
  var ids = window._sharedPreparar || prepararIds || [];
  // Use == to handle string/number mismatch
  return reservas.filter(function(r){
    return ids.some(function(x){return x==r.id;});
  });
}

function updPrepBadge(){
  var n=getPrepararData().length;
  var b=document.getElementById('prep-badge');
  if(b){
    b.textContent=n;
    b.style.display=n?'inline-block':'none';
    b.className=n?'':'hidden';
  }
  // Also update unified sidebar badge
  var bsb=document.getElementById('prep-badge-sb');
  if(bsb){
    bsb.textContent=n;
    bsb.classList.toggle('hidden',!n);
  }
  // Also update nav item style to draw attention if there are pending items
  var nav=document.getElementById('nav-preparar');
  if(nav){
    if(n>0){
      nav.style.background='rgba(124,58,237,.1)';
      nav.style.color='#6d28d9';
      nav.style.fontWeight='700';
    } else {
      nav.style.background='';
      nav.style.color='';
      nav.style.fontWeight='';
    }
  }
}

function renderPreparar(){
  updPrepBadge();
  var list=getPrepararData();
  var el=document.getElementById('preparar-content');if(!el)return;

  // Diagnostic: show current state
  var diagIds=[];var diagRes=0;
  diagIds = window._sharedPreparar || [];
  diagRes = (window._sharedReservas||[]).length;

  if(!list.length){
    var diagHtml='<div style="padding:40px 20px;text-align:center">'
      +'<div style="font-size:48px;margin-bottom:12px">🔧</div>'
      +'<div style="font-size:16px;font-weight:700;color:#374151;margin-bottom:8px">Sin bicicletas para preparar</div>'
      +'<div style="font-size:13px;color:#6b7280;margin-bottom:16px">Marca "Preparar" en el gestor de reservas y pulsa Actualizar</div>'
      +'<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;font-size:12px;text-align:left;max-width:300px;margin:0 auto">'
      +'<div style="font-weight:700;color:#374151;margin-bottom:8px">📊 Estado del sistema:</div>'
      +'<div style="color:'+(diagRes>0?'#15803d':'#dc2626')+';margin-bottom:4px">'+(diagRes>0?'✅':'❌')+' Reservas en memoria: <strong>'+diagRes+'</strong></div>'
      +'<div style="color:'+(diagIds.length>0?'#15803d':'#dc2626')+';margin-bottom:4px">'+(diagIds.length>0?'✅':'❌')+' IDs para preparar: <strong>'+diagIds.length+'</strong></div>'
      +'<div style="color:#6b7280;margin-top:8px;font-size:11px">ℹ️ Si acabas de marcar reservas en otro dispositivo, pulsa Actualizar</div>'
      +'</div>'
      +'<button onclick="refreshPreparar()" style="margin-top:16px;padding:10px 20px;background:#7c3aed;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">↻ Actualizar ahora</button>'
      +'</div>';
    el.innerHTML=diagHtml;
    return;
  }

  var tipos2 = tipos || {};
  var SLBL={};Object.keys(SCFG).forEach(function(k){SLBL[k]=SCFG[k].lbl;}); // FIX: etiquetas desde SCFG

  var html='<div style="display:flex;flex-direction:column;gap:14px">';

  list.forEach(function(r){
    var lineas2=r.lineas&&r.lineas.length?r.lineas:[{tipo:r.tipo,talla:r.talla,uds:r.uds||1,extras:r.extras||[]}];

    html+='<div style="background:#fff;border:2px solid #dbeafe;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(37,99,235,.1)">';

    // ── Cabecera cliente ──────────────────────────────────────────────────
    html+='<div style="background:#dbeafe;padding:12px 16px;display:flex;align-items:flex-start;justify-content:space-between;gap:10px">';
    html+='<div style="flex:1">';
    html+='<div style="font-weight:900;font-size:16px;color:#1e3a5f;margin-bottom:4px">👤 '+esc(r.cliente)+'</div>';
    // Lugar de inicio
    if(r.lugarIni){
      html+='<div style="font-size:13px;font-weight:700;color:#1d4ed8;margin-bottom:2px">📍 Inicio: <span style="font-weight:800">'+esc(r.lugarIni)+'</span></div>';
    }
    html+='<div style="font-size:12px;color:#3b82f6">📅 '+( r.ini||'')+' → '+(r.fin||'')+(r.dias?' ('+r.dias+' días)':'')+'</div>';
    if(r.tel)html+='<div style="margin-top:4px"><a href="tel:'+esc(r.tel)+'" style="font-size:12px;color:#2563eb;text-decoration:none;font-weight:700">📞 '+esc(r.tel)+'</a></div>';
    html+='</div>';
    html+='<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">';
    html+='<span style="background:#fff;border:1px solid #93c5fd;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700;color:#1d4ed8">'+( SLBL[r.estado]||r.estado)+'</span>';
    html+='<button onclick="marcarListoParaEntregar('+r.id+')" style="background:#16a34a;color:#fff;border:none;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap">✅ Listo</button>';
    html+='</div>';
    html+='</div>';

    // ── Bicicletas a preparar ─────────────────────────────────────────────
    html+='<div style="padding:12px 16px">';
    html+='<div style="font-size:10px;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">🚲 Bicicletas a preparar</div>';

    lineas2.forEach(function(l,li){
      var t2=tipos2[l.tipo]||{icon:'🚲',label:l.tipo||r.tipo||'',color:'#999'};
      var prepKey='prep_'+r.id+'_'+l.tipo+'_'+l.talla+'_'+li;
      var lista2=false;try{lista2=!!localStorage.getItem(prepKey);}catch(e){}

      // Extras de esta línea — buscar bolsa de manillar y otros extras relevantes
      var extrasLinea=[];
      // Extras per linea (new system)
      if(l.extras&&l.extras.length){
        extrasLinea=l.extras;
      }
      // Also check global extras from reservation that match this linea
      if(r.extras&&r.extras.length){
        r.extras.forEach(function(ex){
          if(ex.lineaTipo===l.tipo&&ex.lineaTalla===l.talla){
            if(!extrasLinea.find(function(e2){return e2.id===ex.id;}))extrasLinea.push(ex);
          }
        });
      }
      // If no linea match, include unmatched extras on first linea
      if(li===0&&r.extras&&r.extras.length){
        r.extras.forEach(function(ex){
          if(!ex.lineaTipo&&!extrasLinea.find(function(e2){return e2.id===ex.id;}))extrasLinea.push(ex);
        });
      }

      // Assigned bike for this linea — usar l.bikeAsig (por línea) no bikesAsig (global)
      var asig = l.bikeAsig ? [l.bikeAsig] : [];

      html+='<div style="border:2px solid '+(lista2?'#86efac':'#e5e7eb')+';border-radius:10px;padding:11px 13px;margin-bottom:8px;background:'+(lista2?'#f0fdf4':'#fafafa')+'">';

      // Bike info row
      html+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">';
      html+='<div style="width:38px;height:38px;background:'+(t2.color||'#999')+'22;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">'+t2.icon+'</div>';
      html+='<div style="flex:1">';
      html+='<div style="font-weight:800;font-size:14px;color:#111">'+esc(t2.label)+'</div>';
      html+='<div style="font-size:13px;color:#374151;font-weight:700">📏 Talla: <span style="background:#f3f4f6;padding:2px 8px;border-radius:4px;font-weight:800">'+esc(l.talla||r.talla||'?')+'</span>'+(l.uds>1?' <span style="color:#6b7280">×'+l.uds+'</span>':'')+'</div>';
      if(asig.length){
        html+='<div style="font-size:12px;color:#15803d;margin-top:3px;font-weight:700">🔗 Bici: '+asig.map(function(a){return esc(a.num);}).join(', ')+'</div>';
      } else {
        html+='<div style="font-size:12px;color:#d97706;margin-top:3px">⚠️ Sin bici asignada</div>';
      }
      html+='</div>';
      // Prep toggle + Asignar buttons
      html+='<div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0">';
      html+='<button data-prepkey="'+prepKey+'" data-lista="'+(lista2?'1':'0')+'" class="prep-toggle-btn" '
        +'style="border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap">'
        +(lista2?'✅ Lista':'🔧 Preparar')+'</button>';
      html+='<button onclick="abrirAsignarBici('+r.id+',\''+l.tipo+'\',\''+l.talla+'\','+li+')" '
        +'style="border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap;'
        +(asig.length?'background:#dcfce7;color:#15803d;':'background:#fef3c7;color:#92400e;')+'">'
        +(asig.length?'🔗 Reasignar':'📋 Asignar')+'</button>';
      html+='</div>';
      html+='</div>';

      // Extras row
      if(extrasLinea.length){
        html+='<div style="border-top:1px solid #e5e7eb;padding-top:8px;margin-top:4px">';
        html+='<div style="font-size:10px;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px">🎒 Extras incluidos</div>';
        html+='<div style="display:flex;flex-wrap:wrap;gap:5px">';
        extrasLinea.forEach(function(ex){
          var isBolsa=ex.nombre&&ex.nombre.toLowerCase().indexOf('manillar')>=0;
          var isAlforja=ex.nombre&&ex.nombre.toLowerCase().indexOf('alforja')>=0;
          var highlight=isBolsa||isAlforja;
          html+='<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700;'
            +'background:'+(highlight?'#fef3c7':'#f3f4f6')+';color:'+(highlight?'#92400e':'#374151')+';border:1px solid '+(highlight?'#fcd34d':'#e5e7eb')+';">'
            +(ex.icono||'📦')+' '+esc(ex.nombre||'Extra')+(ex.qty>1?' ×'+ex.qty:'')+'</span>';
        });
        html+='</div></div>';
      }

      html+='</div>'; // end linea card
    });

    html+='</div>'; // end bikes section

    // Dirección de entrega
    if(r.dirEntrega){
      html+='<div style="padding:8px 16px 12px;border-top:1px solid #f0f0f0;font-size:12px;color:#6b7280">';
      html+='🚚 Entrega en: <strong>'+esc(r.dirEntrega)+'</strong>';
      html+='</div>';
    }

    html+='</div>'; // end reservation card
  });

  html+='</div>';
  el.innerHTML=html;

  // Bind toggle buttons
  el.querySelectorAll('.prep-toggle-btn').forEach(function(btn){
    var k=btn.getAttribute('data-prepkey');
    var l2=btn.getAttribute('data-lista')==='1';
    btn.style.background=l2?'#dcfce7':'#f3f4f6';
    btn.style.color=l2?'#15803d':'#374151';
    btn.addEventListener('click',function(){toggleLinealista(k);});
  });
}

function toggleLinealista(key){
  try{
    if(localStorage.getItem(key)){localStorage.removeItem(key);}
    else{localStorage.setItem(key,'1');}
  }catch(e){}
  renderPreparar();
}


// ── ASIGNAR BICICLETA DESDE PREPARAR ─────────────────────────────
var _asignarCtx = null; // {resId, tipo, talla, lineaIdx}

// ── CÁMARA QR PARA ASIGNAR BICI ──────────────────────────────────
var _asigCamStream = null;
var _asigCamInterval = null;

function abrirCamaraAsignar() {
  // Usa el MISMO escáner que el alta de bicis (V…/mqr): lector nativo del móvil,
  // jsQR de respaldo y foto si el navegador no deja abrir el vídeo.
  if(!_asignarCtx){toast('⚠️ Vuelve a pulsar Asignar en la reserva');return;}
  var t=tipos[_asignarCtx.tipo]||{label:_asignarCtx.tipo};
  window._qrModoAlta=false;
  window._qrDestino=function(txt){
    var c=(typeof bcpNormalizar==='function')?bcpNormalizar(txt):String(txt||'').trim().toUpperCase();
    var m=c.match(/BCP-\d{4}/);if(m&&!bikes.some(function(b){return String(b.qr||'').toUpperCase()===c;}))c=m[0];
    cerrarCamaraEtiqueta();
    var inp=document.getElementById('asig-qr-inp');if(inp)inp.value=c;
    asignarPorQR();
  };
  var tit=document.querySelector('#mqr .modal-title');if(tit)tit.textContent='Asignar bici · '+t.label+' '+(_asignarCtx.talla||'');
  if(typeof qrStatus==='function')qrStatus('','');
  var inp=document.getElementById('qr-inp');if(inp){inp.value='';inp.placeholder='BCP-0001';}
  var mq=document.getElementById('mqr');if(mq)mq.style.zIndex='100000'; // por encima de la ventana de asignar
  openM('mqr');
  openQRCamera();
}

function cerrarCamaraAsignar() {
  if(window._qrDestino){cerrarCamaraEtiqueta();}
  if(_asigCamInterval){ clearInterval(_asigCamInterval); _asigCamInterval = null; }
  if(_asigCamStream){ _asigCamStream.getTracks().forEach(function(t){t.stop();}); _asigCamStream = null; }
  var container = document.getElementById('asig-cam-container');
  if(container) container.style.display = 'none';
}


function abrirAsignarBici(resId, tipo, talla, lineaIdx) {
  _asignarCtx = {resId: resId, tipo: tipo, talla: talla, lineaIdx: lineaIdx};

  // Bicis asignadas en cualquier reserva activa (fuente de verdad: lineas[].bikeAsig)
  var ESTADOS_LIBRE = ESTADOS_LIBRE_GLOBAL;
  var bicisOcupadas = {}; // bikeId -> cliente
  reservas.forEach(function(r){
    if(ESTADOS_LIBRE.indexOf(r.estado) >= 0) return;
    if(r.id === resId) return; // excluir la reserva actual
    if(r.lineas && r.lineas.length){
      r.lineas.forEach(function(l){
        if(l.bikeAsig) bicisOcupadas[l.bikeAsig.id] = r.cliente;
      });
    } else if(r.bikesAsig && r.bikesAsig.length){
      r.bikesAsig.forEach(function(a){ bicisOcupadas[a.id] = r.cliente; });
    }
  });
  // También marcar bicis ya asignadas a otras líneas de esta misma reserva
  var resActual = reservas.find(function(r){ return r.id === resId; });
  if(resActual && resActual.lineas){
    resActual.lineas.forEach(function(l, idx){
      if(idx !== lineaIdx && l.bikeAsig) bicisOcupadas[l.bikeAsig.id] = 'otra línea';
    });
  }

  // Build bike list filtered by tipo+talla and available states
  var disponibles = bikes.filter(function(b){
    return b.tipo === tipo && b.talla === talla &&
           (b.estado === 'disponible' || b.estado === 'stock' || b.estado === 'asignada');
  });

  var sel = '<select id="asig-bici-sel" style="width:100%;padding:9px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:14px;margin-bottom:12px">';
  sel += '<option value="">-- Elige una bicicleta --</option>';
  disponibles.forEach(function(b){
    var est = BIKE_ESTADOS[b.estado] || {icon:'',lbl:b.estado};
    var ocupada = bicisOcupadas[b.id];
    var label = esc(b.numBici)+' — '+esc(b.modelo||tipo)+' '+esc(b.talla)+' ('+est.icon+' '+est.lbl+')';
    if(ocupada) label += ' ⚠️ OCUPADA: '+esc(ocupada);
    sel += '<option value="'+b.id+'"'+(ocupada?' disabled style="color:#9ca3af"':'')+'>'+label+'</option>';
  });
  sel += '</select>';

  var html = '<div style="padding:16px">'
    + '<div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:10px">Tipo: <strong>'
    + esc((tipos[tipo]||{label:tipo}).label) + ' ' + esc(talla) + '</strong></div>'
    + '<div style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Elegir de la lista</div>'
    + sel
    + '<button onclick="confirmarAsignacion()" style="width:100%;padding:11px;background:#0d9488;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:800;cursor:pointer;margin-bottom:10px">✅ Asignar bicicleta</button>'
    + '<div style="border-top:1px solid #e5e7eb;padding-top:12px;margin-top:4px">'
    + '<div style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">O escanear QR</div>'
    + '<div style="display:flex;gap:8px;margin-bottom:8px">'
    + '<input id="asig-qr-inp" onkeydown="if(event.key===\'Enter\')asignarPorQR()" placeholder="Nº bici o código QR (BCP-0001)..." style="flex:1;padding:9px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:14px"/>'
    + '<button onclick="asignarPorQR()" style="padding:9px 16px;background:#1d4ed8;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer">Buscar</button>'
    + '</div>'
    + '<button onclick="abrirCamaraAsignar()" style="width:100%;padding:10px;background:#7c3aed;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px">📷 Abrir cámara QR</button>'
    + '<div id="asig-cam-container" style="margin-top:8px;display:none">'
    + '<video id="asig-cam-video" style="width:100%;border-radius:8px;max-height:200px;object-fit:cover" playsinline></video>'
    + '<button onclick="cerrarCamaraAsignar()" style="width:100%;margin-top:6px;padding:8px;background:#6b7280;color:#fff;border:none;border-radius:8px;font-size:12px;cursor:pointer">✕ Cerrar cámara</button>'
    + '</div>'
    + '<div id="asig-qr-result" style="margin-top:8px;font-size:13px"></div>'
    + '</div>'
    + '</div>';

  document.getElementById('masignar-body').innerHTML = html;
  openM('masignar');
}

function confirmarAsignacion() {
  if (!_asignarCtx) return;
  var sel = document.getElementById('asig-bici-sel');
  if (!sel || !sel.value) { toast('⚠️ Elige una bicicleta'); return; }
  _hacerAsignacion(parseInt(sel.value));
}

function asignarPorQR() {
  var inp = document.getElementById('asig-qr-inp');
  if (!inp || !inp.value.trim()) { toast('⚠️ Escribe el número de bici o QR'); return; }
  var q = (typeof bcpNormalizar==='function') ? bcpNormalizar(inp.value) : inp.value.trim().toUpperCase();
  var bici = bikes.find(function(b){
    return b.numBici.toUpperCase() === q || (b.qr||'').toUpperCase() === q || (b.numSerie||'').toUpperCase() === q;
  });
  var res = document.getElementById('asig-qr-result');
  if (!bici) {
    if (res) res.innerHTML = '<span style="color:#dc2626">❌ Código «'+esc(q)+'»: no hay ninguna bici con ese código. Revisa en Tipos y modelos (V21) que la bici tenga esa etiqueta.</span>';
    return;
  }
  var est = BIKE_ESTADOS[bici.estado] || {icon:'',lbl:bici.estado};
  if (res) res.innerHTML = '<span style="color:#15803d">✅ Encontrada: <strong>'+esc(bici.numBici)+'</strong> — '+esc(bici.modelo||bici.tipo)+' '+esc(bici.talla)+' ('+est.icon+' '+est.lbl+')</span>';
  _hacerAsignacion(bici.id);
}

function _hacerAsignacion(bikeId) {
  if (!_asignarCtx) return;
  var ctx = _asignarCtx;
  var bici = bikes.find(function(b){ return b.id === bikeId; });
  if (!bici) { toast('❌ Bicicleta no encontrada'); return; }

  // FIX: usa la global reservas directamente, sin shadowing con var local
  if (!reservas || !reservas.length) { toast('❌ No hay reservas cargadas'); return; }
  var res = reservas.find(function(r){ return String(r.id) === String(ctx.resId); });
  if (!res) { toast('❌ Reserva no encontrada. Pulsa Actualizar y vuelve a intentarlo.',5000,'error'); return; }

  // Bloquear si la bici está asignada en otra reserva activa
  var ESTADOS_LIBRE = ESTADOS_LIBRE_GLOBAL;
  var ocupadaEn = null;
  reservas.forEach(function(r){
    if(ESTADOS_LIBRE.indexOf(r.estado) >= 0) return;
    if(r.id === ctx.resId) return; // excluir reserva actual
    var tieneEstaBici = false;
    if(r.lineas && r.lineas.length){
      tieneEstaBici = r.lineas.some(function(l){ return l.bikeAsig && l.bikeAsig.id === bici.id; });
    }
    if(!tieneEstaBici && r.bikesAsig && r.bikesAsig.length){
      tieneEstaBici = r.bikesAsig.some(function(a){ return a.id === bici.id; });
    }
    if(tieneEstaBici) ocupadaEn = r.cliente + ' (' + (typeof fmtD==='function'?fmtD(r.ini)+' → '+fmtD(r.fin):(r.ini||'')+' → '+(r.fin||'')) + ', ' + ((SCFG[r.estado]||{}).lbl||r.estado) + ')';
  });
  // Bloquear si la bici está en otra línea de esta misma reserva
  if(!ocupadaEn && res.lineas){
    res.lineas.forEach(function(l, idx){
      if(idx !== ctx.lineaIdx && l.bikeAsig && l.bikeAsig.id === bici.id){
        ocupadaEn = 'otra línea de esta reserva';
      }
    });
  }
  if(ocupadaEn){
    var msgOc='❌ '+bici.numBici+' ya está asignada a '+ocupadaEn+'. Quítala primero de esa reserva o elige otra bici.';
    var rq=document.getElementById('asig-qr-result');
    if(rq)rq.innerHTML='<div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:10px;color:#991b1b;font-weight:700">'+esc(msgOc)+'</div>';
    toast(msgOc,5000,'error');
    return;
  }
  // Una bici averiada no se puede asignar
  if(bici.estado==='averiada'){
    var msgAv='❌ '+bici.numBici+' está AVERIADA: repárala en el taller antes de asignarla.';
    var rq2=document.getElementById('asig-qr-result');
    if(rq2)rq2.innerHTML='<div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:10px;color:#991b1b;font-weight:700">'+esc(msgAv)+'</div>';
    toast(msgAv,5000,'error');
    return;
  }
  // Modelo / talla distintos a los de la línea: avisar y dejar decidir
  if((bici.tipo!==ctx.tipo||bici.talla!==ctx.talla)&&!confirm(bici.numBici+' es '+((tipos[bici.tipo]||{}).label||bici.tipo)+' '+bici.talla+', pero esta línea pide '+((tipos[ctx.tipo]||{}).label||ctx.tipo)+' '+ctx.talla+'.\n¿Asignarla igualmente?')){
    return;
  }

  // Update lineas[lineaIdx].bikeAsig — fuente de verdad por línea
  if (!res.lineas) {
    res.lineas = [{tipo:res.tipo||ctx.tipo, talla:res.talla||ctx.talla, uds:res.uds||1, ppd:res.ppd||0}];
  }
  var li = ctx.lineaIdx;

  // Liberar la bici anterior si había una asignada en esta línea
  if (li >= 0 && li < res.lineas.length && res.lineas[li].bikeAsig) {
    var bikeAnteriorId = res.lineas[li].bikeAsig.id;
    if (bikeAnteriorId !== bici.id) {
      var bikeAnterior = bikes.find(function(b){ return b.id === bikeAnteriorId; });
      if (bikeAnterior) {
        // Solo liberar si no está en otra línea de esta u otra reserva
        var sigueOcupada = false;
        reservas.forEach(function(r){
          if(ESTADOS_LIBRE.indexOf(r.estado) >= 0) return;
          if(r.lineas) r.lineas.forEach(function(l, idx){
            if(r.id === ctx.resId && idx === li) return; // excluir esta línea
            if(l.bikeAsig && l.bikeAsig.id === bikeAnteriorId) sigueOcupada = true;
          });
        });
        if (!sigueOcupada) {
          bikeAnterior.estado = 'disponible';
          DB.saveBici(bikeAnterior).catch(function(e){ console.error('liberarBici', e); });
        }
      }
    }
  }

  if (li >= 0 && li < res.lineas.length) {
    res.lineas[li].bikeAsig = {id: bici.id, num: bici.numBici, tipo: bici.tipo, talla: bici.talla};
  }
  // Reconstruir bikesAsig desde lineas para compatibilidad
  res.bikesAsig = res.lineas.filter(function(l){ return l.bikeAsig; }).map(function(l){ return l.bikeAsig; });

  // Update bici estado to 'asignada'
  bici.estado = 'asignada';

  // Save both to Supabase
  DB.saveReserva(res).catch(function(e){ console.error('saveReserva asignar', e); });
  DB.saveBici(bici).catch(function(e){ console.error('saveBici asignar', e); });
  // FIX: reservas es la global — ya está actualizada, no hace falta _sharedReservas

  closeM('masignar');
  toast('✅ Bici '+bici.numBici+' asignada a '+esc(res.cliente));
  renderPreparar();
}

function marcarListoParaEntregar(resId){
  // Remove from preparar list
  // FIX: comparación con == (Supabase puede devolver IDs como string) y
  // sincronizar TAMBIÉN la global prepararIds que usa la vista de reservas
  var ids = (window._sharedPreparar || prepararIds || []).filter(function(x){return x!=resId;});
  window._sharedPreparar = ids;
  prepararIds = ids;
  if(typeof renderRes==='function'&&typeof CV!=='undefined'&&CV==='res')renderRes();
  DB.saveConfig('preparar', ids).catch(function(e){console.error('preparar save',e);});
  toast('✅ Reserva lista para entregar');
  renderPreparar();
  updPrepBadge();
}

async function refreshPreparar(){
  // Force fresh read from Supabase
  try {
    // FIX: actualizar las GLOBALES (reservas, prepararIds) — antes solo se refrescaban
    // window._shared* y getPrepararData/renderRes seguían leyendo datos viejos
    reservas = await DB.getReservas();
    prepararIds = await DB.getConfig('preparar', []);
    window._sharedReservas = reservas;
    window._sharedPreparar = prepararIds;
  } catch(e) { console.error('refreshPreparar', e); }
  var n=getPrepararData().length;
  renderPreparar();
  var lbl=document.getElementById('prep-count-lbl');
  if(lbl)lbl.textContent=n?n+' reserva'+(n>1?'s':'')+' pendiente'+(n>1?'s':''):'';
  updPrepBadge();
  toast(n?'🔧 '+n+' reserva'+(n>1?'s':'')+' para preparar':'Sin reservas pendientes');
}
// Escanear la etiqueta BCP al dar de alta / editar una bici (foto con la cámara)
function scanEtiquetaBici(ev){
  if(typeof qrScanFromFileEvent!=='function'){toast('Escáner no disponible');return;}
  qrScanFromFileEvent(ev,function(txt){
    var c=String(txt||'').trim().toUpperCase();
    var m=c.match(/BCP-\d{4}/);if(m)c=m[0];
    if(!bcpValido(c)){toast('⚠️ No es una etiqueta de bici BCP: '+c);return;}
    var eid=document.getElementById('ab-eid').value;
    var dup=bikes.find(function(b){return String(b.id)!==String(eid)&&String(b.qr||'').toUpperCase()===c;});
    if(dup){toast('⚠️ '+c+' ya está en la bici '+dup.numBici);return;}
    document.getElementById('ab-qr').value=c;_abQrError('');toast('✅ Etiqueta '+c+' leída');
  },function(err){toast('⚠️ '+(err||'No se pudo leer el QR'));});
}

// ── Escanear la etiqueta BCP desde la ficha de la bici (cámara en vivo) ──
function abrirCamaraEtiqueta(){
  window._qrModoAlta=true;
  var tit=document.querySelector('#mqr .modal-title');if(tit)tit.textContent='Escanear etiqueta de la bici';
  qrStatus('','');
  var inp=document.getElementById('qr-inp');if(inp){inp.value='';inp.placeholder='BCP-0001';}
  var mq=document.getElementById('mqr');if(mq)mq.style.zIndex='100000'; // por encima de la ficha de la bici
  openM('mqr');
  openQRCamera(); // abre la cámara directamente (o la de fotos si el navegador no deja vídeo)
}
function cerrarCamaraEtiqueta(){
  stopQR();closeM('mqr');window._qrModoAlta=false;window._qrDestino=null;
  var mq=document.getElementById('mqr');if(mq)mq.style.zIndex='';
  var tit=document.querySelector('#mqr .modal-title');if(tit)tit.textContent='Escanear código QR';
}
function _etiquetaLeida(txt){
  var c=(typeof bcpNormalizar==='function')?bcpNormalizar(txt):String(txt||'').trim().toUpperCase();
  var m=c.match(/BCP-\d{4}/);if(m)c=m[0];
  if(!bcpValido(c)){qrStatus('Leído "'+c+'": no es una etiqueta de bici (BCP-0001 a BCP-1000). Prueba otra vez.','err');setTimeout(function(){if(window._qrModoAlta&&!qron)openQRCamera();},1500);return;}
  var eid=document.getElementById('ab-eid').value;
  var dup=bikes.find(function(b){return String(b.id)!==String(eid)&&String(b.qr||'').toUpperCase()===c;});
  if(dup){qrStatus('⚠️ '+c+' ya está en la bici '+dup.numBici+'. Usa otra etiqueta.','err');return;}
  document.getElementById('ab-qr').value=c;
  cerrarCamaraEtiqueta();
  toast('✅ Etiqueta '+c+' asignada');
}

// Todas las ventanas (de reservas y del taller) se sacan de su sección para poder abrirlas desde
// cualquier página: si no, una ventana de la sección oculta no se ve aunque se abra.
(function(){document.querySelectorAll('.mover, .modal-overlay').forEach(function(el){if(el.id&&el.parentNode!==document.body)document.body.appendChild(el);});})();


// ── CHECKLIST ANTES DE CADA ENTREGA (V28) ─────────────────
// Lista propia de cada modelo (CLE[b.tipo]). Solo registra la revisión en el
// historial: NO asigna bicis ni toca la disponibilidad. Si no es apta, se
// PREGUNTA si marcarla como averiada (decisión manual).
let ceB=null, ceS={};
function _ceLista(b){return (CLE[b.tipo]&&CLE[b.tipo].length)?CLE[b.tipo]:null;}
function _ultEntrega(b){return (hist[b.id]||[]).find(r=>r.tipo==='entrega')||null;}
function _ultEntregaHTML(b){
  const u=_ultEntrega(b);
  if(!u)return '<span class="bike-detail-item" style="color:var(--gray-400)">🚚 Sin revisión de entrega</span>';
  const f=(u.fecha||'').split(',')[0];
  return u.resultado==='apta'
    ?`<span class="bike-detail-item" style="color:var(--green-600);font-weight:600">🚚 Revisada para entrega ${esc(f)} ✅</span>`
    :`<span class="bike-detail-item" style="color:#dc2626;font-weight:600">🚚 No apta ${esc(f)} ❌</span>`;
}
function openCE(id){
  ceB=bikes.find(b=>b.id===id);if(!ceB)return;
  const t=tipos[ceB.tipo]||{icon:'🚲',label:'Bici'};
  const lista=_ceLista(ceB);
  ceS={};(lista||[]).forEach(i=>ceS[i]=false);
  document.getElementById('ce-titulo').textContent=`${t.icon} ${ceB.numBici} — ${ceB.modelo||t.label} · Talla ${ceB.talla||'—'}`;
  const u=_ultEntrega(ceB);
  document.getElementById('ce-ultima').innerHTML=u?`Última revisión de entrega: <b>${esc(u.fecha)}</b> por ${esc(u.tecnico)} — ${u.resultado==='apta'?'✅ Apta':'❌ No apta'}`:'Esta bici aún no tiene revisiones de entrega.';
  document.getElementById('ce-aviso-aver').style.display=ceB.estado==='averiada'?'':'none';
  document.getElementById('ce-tec').value=localStorage.getItem('vr_ce_tec')||'';
  document.getElementById('ce-notas').value='';
  renderCE();openM('mce');
}
function renderCE(){
  const el=document.getElementById('ce-items'),lista=_ceLista(ceB);
  const t=tipos[ceB.tipo]||{label:ceB.tipo};
  if(!lista){
    el.innerHTML=`<div class="empty-state" style="padding:20px"><div class="empty-state-icon">☑️</div><div class="empty-state-text">El modelo <b>${esc(t.label)}</b> aún no tiene checklist de entrega.</div><button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="closeM('mce');abrirChecklistEntregaModelo('${ceB.tipo}')">Crear checklist de este modelo</button></div>`;
    document.getElementById('ce-prog').textContent='';return;
  }
  el.innerHTML=lista.map((item,i)=>`<div class="check-item${ceS[item]?' done':''}" onclick="ceTog(${i})"><div class="check-box">${ceS[item]?'✓':''}</div><span class="check-text">${esc(item)}</span></div>`).join('');
  const done=Object.values(ceS).filter(Boolean).length;
  document.getElementById('ce-prog').textContent=`${done} de ${lista.length} revisados`;
  document.getElementById('ce-prog').style.color=done===lista.length?'var(--green-600)':'var(--blue-600)';
}
function ceTog(i){const k=Object.keys(ceS)[i];if(k===undefined)return;ceS[k]=!ceS[k];renderCE();}
function ceTodo(v){Object.keys(ceS).forEach(k=>ceS[k]=v);renderCE();}
function saveCE(apta){
  if(!ceB)return;
  const lista=_ceLista(ceB);
  if(!lista){toast('⚠️ Crea primero el checklist de entrega de este modelo',3500,'error');return;}
  const tec=document.getElementById('ce-tec').value.trim();
  if(!tec){toast('🔴 Falta el nombre de quien revisa',3500,'error');document.getElementById('ce-tec').focus();return;}
  const tot=lista.length,done=Object.values(ceS).filter(Boolean).length;
  if(apta&&done<tot&&!confirm('Faltan '+(tot-done)+' de '+tot+' puntos por marcar.\n¿Guardar la bici como APTA para entregar igualmente?'))return;
  const notas=document.getElementById('ce-notas').value.trim();
  if(!apta&&!notas&&!confirm('No has escrito qué le pasa a la bici. ¿Guardar sin notas?'))return;
  try{localStorage.setItem('vr_ce_tec',tec);}catch(e){}
  const b=ceB;
  const reg={id:Date.now(),ts:new Date().toISOString(),fecha:ns(),tipo:'entrega',resultado:apta?'apta':'no_apta',tecnico:tec,notas,checklist:{...ceS},checkedCount:done,totalItems:tot,piezas:[],bikeId:b.id};
  if(!hist[b.id])hist[b.id]=[];
  hist[b.id].unshift(reg);if(hist[b.id].length>50)hist[b.id]=hist[b.id].slice(0,50);
  sh();closeM('mce');ceB=null;
  if(typeof renderBL==='function')renderBL();
  if(apta){toast('✅ '+b.numBici+' revisada: apta para entregar',3000,'success');return;}
  toast('❌ '+b.numBici+' guardada como NO apta',3000,'error');
  if(b.estado!=='averiada'&&confirm(b.numBici+' no está apta para entregar.\n¿Quieres marcarla como AVERIADA? (saldrá del stock disponible)')){
    confirmarAveriada(b.id,function(){
      b.estado='averiada';
      if(typeof _registrarEstadoBici==='function')_registrarEstadoBici(b,'averiada',tec);
      sb();if(typeof renderBL==='function')renderBL();if(typeof rDB==='function')rDB();
      toast(b.numBici+' → ⚠️ Averiada');
    });
  }
}
