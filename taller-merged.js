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
// Checklist de PREPARAR BICI por modelo: multiherramienta, repuestos específicos… (lo propio del modelo)
let CLP={};
const DCLP_GEN=['Multiherramienta','Cámara de repuesto de la medida','Kit de parches / desmontables','Bomba'];
const scp=()=>DB.saveConfig('clistasPrep', CLP).catch(e=>console.error('scp',e));
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
  ['prepbici-view','listas-view'].forEach(function(id){var e=document.getElementById(id);if(e)e.classList.add('hidden');});
  var _vh0=document.getElementById('vb-historial');if(_vh0)_vh0.style.display='';

  // Show requested view
  var viewId=v==='dashboard'?'vd':v==='bikes'?'vb':v==='taller'?'vt':null;
  if(viewId){
    var viewEl=document.getElementById(viewId);
    if(viewEl) viewEl.classList.add('active');
  } else if(v==='preparar'||v==='prepbici'||v==='listas'){
    // estas vistas viven dentro de vb — need vb active too
    var vbEl = document.getElementById('vb');
    if(vbEl) vbEl.classList.add('active');
    var _vid=v==='preparar'?'preparar-view':v+'-view';
    var _vh=document.getElementById('vb-historial');if(_vh)_vh.style.display='none'; // el historial de bicis no pinta nada aquí
    var _ve=document.getElementById(_vid);if(_ve)_ve.classList.remove('hidden');
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

  var titles={dashboard:'Panel General',bikes:'Bicicletas',taller:'Hoja de Taller',preparar:'Revisar bici',prepbici:'Preparar bici',listas:'Listas para salir'};
  var titleEl=document.getElementById('topbar-title');
  if(titleEl) titleEl.textContent=titles[v]||'';
  cv=v;
  if(v==='dashboard') rDB();
  if(v==='bikes') rBV();
  if(v==='preparar'){renderPreparar();updPrepBadge();}
  if(v==='prepbici')renderPrepBici();
  if(v==='listas')renderListasSalir();
  if(typeof updFlujoBadges==='function')updFlujoBadges();
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

  const du=document.getElementById('dash-ubic');
  if(du)du.innerHTML=`<button onclick="abrirLlegadaMondonedo()" style="flex:1 1 100%;border:none;background:#0d9488;color:#fff;border-radius:10px;padding:12px;font-size:15px;font-weight:800;cursor:pointer">📥 Llegada a Mondoñedo · escanear bicis al descargar</button>`+Object.entries(UBICACIONES).map(([k,u])=>{const n=bikes.filter(b=>ubicDe(b)===k).length;
    return `<button onclick="abrirUbicaciones('${k}')" style="flex:1;min-width:110px;border:1px solid var(--gray-200);background:${u.bg};color:${u.txt};border-radius:10px;padding:10px;cursor:pointer;text-align:left"><div style="font-size:20px;font-weight:800">${n}</div><div style="font-size:12px;font-weight:700">${u.icon} ${u.lbl}</div></button>`;}).join('');
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
          ${ubicBadge(b)}
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
        <button class="btn btn-secondary btn-sm" title="Checklist de Revisar bici" onclick="openCE(${b.id})">📦 Revisar</button>
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
      + '<div style="font-size:12px;font-weight:700;color:#6b7280">'+esc((typeof SCFG!=='undefined'&&SCFG[r.estado]?SCFG[r.estado].lbl:r.estado)||'')+'</div>'
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
function openEB(id){_abQrError('');const b=bikes.find(x=>x.id===id);if(!b)return;document.getElementById('madd-title').textContent='Editar bicicleta';document.getElementById('ab-savebtn').textContent='Guardar cambios';document.getElementById('ab-eid').value=id;document.getElementById('ab-num').value=b.numBici;document.getElementById('ab-ser').value=b.numSerie||'';document.getElementById('ab-qr').value=b.qr||'';document.getElementById('ab-mod').value=b.modelo||'';setBikePicPreview(b.icono||'');var ts=document.getElementById('ab-tipo');ts.removeAttribute('data-loaded');abSizes();ts.value=b.tipo;if(b.tipo&&ts.value!==b.tipo){var ot=document.createElement('option');ot.value=b.tipo;ot.textContent=b.tipo+' (no está en la lista)';ts.appendChild(ot);ts.value=b.tipo;}abSizes();var tl=document.getElementById('ab-tal');tl.value=b.talla;if(b.talla&&tl.value!==b.talla){var ol=document.createElement('option');ol.value=b.talla;ol.textContent=b.talla+' (talla actual, no está en el modelo)';tl.appendChild(ol);tl.value=b.talla;}window._ebIcono=b.icono||'';setABE(b.estado||'disponible');document.getElementById('ab-ubic').value=ubicDe(b);document.getElementById('ab-ubic-txt').value=b.ubicacionTxt||'';abUbicCambio();openM('madd');}
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
  const ubic=document.getElementById('ab-ubic').value||'mondonedo',ubicTxt=document.getElementById('ab-ubic-txt').value.trim();
  function doSave(){
    if(eid){const idx=bikes.findIndex(b=>String(b.id)===String(eid));if(idx>=0){bikes[idx]={...bikes[idx],numBici:num,numSerie:ser,qr,modelo,icono,tipo,talla,estado};setUbicacion(bikes[idx],ubic,ubicTxt,'Editar bici',false);}toast('✅ Bicicleta actualizada');}
    else{const nb={id:Date.now(),numBici:num,numSerie:ser,qr,modelo,icono,tipo,talla,estado};setUbicacion(nb,ubic,ubicTxt,'Alta',false);bikes.push(nb);toast('✅ Bicicleta añadida');}
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
  const _u=document.getElementById('ab-ubic');if(_u){_u.value='mondonedo';document.getElementById('ab-ubic-txt').value='';abUbicCambio();}
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

// ── EDIT CHECKLIST (V25): por MODELO, con sus dos listas ──
// Cada modelo: 📦 Revisar bici (CLE) y 🧰 Preparar bici (CLP). Abajo, plegada, la lista de
// reparaciones de la ficha de taller (CLS). Se guardan las tres a la vez para ese modelo.
let eclModo='entrega', eclSugerida=false;          // eclModo: qué lista resaltar al abrir
let eclL={entrega:[],prep:[],taller:[]}, eclSug={entrega:false,prep:false}, eclSucio=false;
const _ECL_SRC=()=>({entrega:CLE,prep:CLP,taller:CLS});
function _eclCargar(){
  const S=_ECL_SRC();
  ['entrega','prep','taller'].forEach(k=>{
    const v=S[k][ect];
    eclSug[k]=(k!=='taller')&&!(v&&v.length);
    eclL[k]=eclSug[k]?[...(k==='prep'?DCLP_GEN:DCLE_GEN)]:[...(v||[])];
  });
  eclSucio=false;
}
function setECLModo(m){eclModo=m;if(!tipos[ect])ect=Object.keys(tipos)[0];_eclCargar();renderECL(true);}
function abrirChecklistEntregaModelo(k){eclModo='entrega';ect=k||etc;openM('mecl');_eclCargar();renderECL(true);}
function abrirChecklistModelo(k,modo){eclModo=modo||'entrega';ect=k||etc;openM('mecl');_eclCargar();renderECL(true);}
function renderECL(yaCargado){
  if(!tipos[ect])ect=Object.keys(tipos)[0];
  if(!yaCargado)_eclCargar();
  document.getElementById('ecl-tabs').innerHTML=Object.entries(tipos).map(([k,t])=>{
    const ok=(CLE[k]&&CLE[k].length)&&(CLP[k]&&CLP[k].length);
    return `<button class="type-tab ${ect===k?'active':''}" onclick="swCL('${k}')" title="${ok?'Las dos listas configuradas':'Falta configurar alguna lista'}">${t.icon} ${esc(t.label)}${ok?'':' <span style="color:#d97706">•</span>'}</button>`;}).join('');
  const t=tipos[ect]||{icon:'🚲',label:ect};
  document.getElementById('ecl-modelo').innerHTML=`<span style="font-size:22px">${t.icon}</span> <b>${esc(t.label)}</b>`;
  const cp=document.getElementById('ecl-copiar');
  if(cp)cp.innerHTML='<option value="">📋 Copiar listas de…</option>'+Object.entries(tipos).filter(([k])=>k!==ect).map(([k,tt])=>`<option value="${k}">${tt.icon} ${esc(tt.label)}</option>`).join('');
  renderECI();
}
function _eclBloque(k){
  const L=eclL[k];
  const lst=L.length?L.map((item,i)=>`<div style="display:flex;align-items:center;gap:6px;padding:5px 2px;border-bottom:1px solid var(--gray-100)">
      <span style="font-size:11px;color:var(--gray-400);width:18px;flex-shrink:0;text-align:right">${i+1}</span>
      <input class="form-input" style="flex:1;padding:6px 8px;font-size:13px" value="${esc(item)}" oninput="eclL['${k}'][${i}]=this.value;eclSucio=true"/>
      <button class="btn btn-ghost btn-xs" title="Subir" onclick="eclMover('${k}',${i},-1)" ${i===0?'disabled':''}>↑</button>
      <button class="btn btn-ghost btn-xs" title="Bajar" onclick="eclMover('${k}',${i},1)" ${i===L.length-1?'disabled':''}>↓</button>
      <button class="btn btn-ghost btn-xs" title="Quitar" onclick="eclL['${k}'].splice(${i},1);eclSucio=true;renderECI()">✕</button>
    </div>`).join(''):'<div style="color:var(--gray-400);font-size:13px;padding:10px">Sin puntos todavía</div>';
  return lst+`<div style="display:flex;gap:6px;margin-top:8px"><input class="form-input" id="ecl-new-${k}" placeholder="+ Añadir punto…" style="padding:7px 9px;font-size:13px" onkeydown="if(event.key==='Enter')addCLI('${k}')"/><button class="btn btn-primary btn-sm" onclick="addCLI('${k}')">Añadir</button></div>`;
}
function renderECI(){
  const sug=k=>eclSug[k]?'<div style="background:#fef3c7;color:#92400e;border-radius:6px;padding:5px 8px;font-size:11.5px;margin-bottom:6px">Lista sugerida: ajústala y pulsa Guardar</div>':'';
  document.getElementById('ecl-rev').innerHTML=sug('entrega')+_eclBloque('entrega');
  document.getElementById('ecl-prep').innerHTML=sug('prep')+_eclBloque('prep');
  document.getElementById('ecl-rep').innerHTML=_eclBloque('taller');
  ['ecl-col-rev','ecl-col-prep'].forEach((id,i)=>{const e=document.getElementById(id);if(e)e.style.boxShadow=(eclModo===(i?'prep':'entrega'))?'0 0 0 3px #bfdbfe':'';});
}
function eclMover(k,i,d){const L=eclL[k],j=i+d;if(j<0||j>=L.length)return;[L[i],L[j]]=[L[j],L[i]];eclSucio=true;renderECI();}
function addCLI(k){k=k||'entrega';const inp=document.getElementById('ecl-new-'+k);const v=(inp&&inp.value||'').trim();if(!v)return;eclL[k].push(v);eclSucio=true;renderECI();const n=document.getElementById('ecl-new-'+k);if(n)n.focus();}
function eclCopiarDe(k){
  if(!k)return;const S=_ECL_SRC(),t=tipos[k]||{label:k};
  if(!confirm('¿Copiar las listas de '+t.label+' en '+((tipos[ect]||{}).label||ect)+'?\nSustituye lo que hay en pantalla (no se guarda hasta pulsar Guardar).')){document.getElementById('ecl-copiar').value='';return;}
  eclL.entrega=[...(S.entrega[k]&&S.entrega[k].length?S.entrega[k]:DCLE_GEN)];
  eclL.prep=[...(S.prep[k]&&S.prep[k].length?S.prep[k]:DCLP_GEN)];
  eclSug.entrega=eclSug.prep=false;eclSucio=true;renderECL(true);
}
function swCL(k){
  if(k===ect)return;
  if(eclSucio&&confirm('¿Guardar los cambios de '+((tipos[ect]||{}).label||ect)+' antes de cambiar de modelo?'))_eclGuardar();
  ect=k;_eclCargar();renderECL(true);
}
function _eclGuardar(){
  const limpia=L=>L.map(x=>String(x).trim()).filter(Boolean);
  CLE[ect]=limpia(eclL.entrega);CLP[ect]=limpia(eclL.prep);CLS[ect]=limpia(eclL.taller);
  sce();scp();sc();eclSucio=false;eclSug.entrega=eclSug.prep=false;
}
function eclCerrar(){if(eclSucio&&confirm('Hay cambios sin guardar en '+((tipos[ect]||{}).label||ect)+'. ¿Guardarlos?'))_eclGuardar();eclSucio=false;closeM('mecl');}
function saveCL(cerrar){
  _eclGuardar();
  toast('✅ Checklists de '+((tipos[ect]||{}).label||ect)+' guardados');
  if(cerrar!==false)closeM('mecl');else renderECL(true);
  if(typeof renderPrepBici==='function'&&cv==='prepbici')renderPrepBici();
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
          <div class="history-title">${b?esc(b.numBici):'?'} <span style="font-weight:400;color:var(--gray-400)">— ${esc(rev.fecha)}</span>${rev.tipo==='entrega'?` <span class="badge ${rev.resultado==='apta'?'badge-green':'badge-red'}">📦 Revisar bici · ${rev.resultado==='apta'?'Apta':'No apta'}</span>`:''}</div>
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
      +'<div style="font-size:16px;font-weight:700;color:#374151;margin-bottom:8px">Sin bicicletas para revisar</div>'
      +'<div style="font-size:13px;color:#6b7280;margin-bottom:16px">Marca "Revisar bici" en el gestor de reservas y pulsa Actualizar</div>'
      +'<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;font-size:12px;text-align:left;max-width:300px;margin:0 auto">'
      +'<div style="font-weight:700;color:#374151;margin-bottom:8px">📊 Estado del sistema:</div>'
      +'<div style="color:'+(diagRes>0?'#15803d':'#dc2626')+';margin-bottom:4px">'+(diagRes>0?'✅':'❌')+' Reservas en memoria: <strong>'+diagRes+'</strong></div>'
      +'<div style="color:'+(diagIds.length>0?'#15803d':'#dc2626')+';margin-bottom:4px">'+(diagIds.length>0?'✅':'❌')+' IDs para revisar: <strong>'+diagIds.length+'</strong></div>'
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
    var lineas2=(typeof _lineasRes==='function')?_lineasRes(r):(r.lineas&&r.lineas.length?r.lineas:[{tipo:r.tipo,talla:r.talla,uds:r.uds||1,extras:r.extras||[]}]);

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
    html+='<button onclick="switchSection(\'taller\',\'listas\')" style="background:#fff;color:#15803d;border:1px solid #86efac;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap">🚚 Ver en Listas para salir</button>';
    html+='</div>';
    html+='</div>';

    // ── Bicicletas a preparar ─────────────────────────────────────────────
    html+='<div style="padding:12px 16px">';
    if(typeof faltaStockReserva==='function')html+=htmlAvisoFaltaStock(faltaStockReserva(r));
    html+='<div style="font-size:10px;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">🚲 Bicicletas a revisar</div>';

    lineas2.forEach(function(l,li){
      var t2=tipos2[l.tipo]||{icon:'🚲',label:l.tipo||r.tipo||'',color:'#999'};
      var prepKey='prep_'+r.id+'_'+l.tipo+'_'+l.talla+'_'+li;
      var lista2=lineaRevisada(l);

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
      html+='<button onclick="revisarLinea('+r.id+','+li+')" title="Checklist de taller antes de la entrega" '
        +'style="border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap;'+(lista2?'background:#dcfce7;color:#15803d':'background:#f3f4f6;color:#374151')+'">'
        +(lista2?'✅ Revisada':'🔧 Revisar')+'</button>';
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
    if(String(r.id) === String(resId)) return; // excluir la reserva actual (id puede venir como texto)
    var quien = r.cliente + ' ' + (typeof fmtD==='function'?fmtD(r.ini)+'→'+fmtD(r.fin):'');
    (r.lineas||[]).forEach(function(l){ if(l&&l.bikeAsig) bicisOcupadas[l.bikeAsig.id] = quien; });
    (r.bikesAsig||[]).forEach(function(a){ if(a&&a.id) bicisOcupadas[a.id] = quien; });
  });
  // También marcar bicis ya asignadas a otras líneas de esta misma reserva
  var resActual = reservas.find(function(r){ return String(r.id) === String(resId); });
  if(resActual&&typeof _lineasRes==='function')_lineasRes(resActual); // vincula bicis asignadas desde Editar reserva
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
    + (typeof faltaStockReserva==='function'&&resActual?htmlAvisoFaltaStock(faltaStockReserva(resActual).filter(function(f){return f.tipo===tipo&&f.talla===talla;}),'No hay stock suficiente de este modelo y talla'):'')
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
    if(String(r.id) === String(ctx.resId)) return; // excluir reserva actual
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
  toast(n?'🔧 '+n+' reserva'+(n>1?'s':'')+' para revisar':'Sin reservas pendientes');
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
  if(typeof _cerrarLlegada==='function')_cerrarLlegada();
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
  if(!u)return '<span class="bike-detail-item" style="color:var(--gray-400)">📦 Sin revisar</span>';
  const f=(u.fecha||'').split(',')[0];
  return u.resultado==='apta'
    ?`<span class="bike-detail-item" style="color:var(--green-600);font-weight:600">📦 Revisada ${esc(f)} ✅</span>`
    :`<span class="bike-detail-item" style="color:#dc2626;font-weight:600">📦 No apta ${esc(f)} ❌</span>`;
}
function openCE(id){
  window._ceCtx=window._ceCtxNext||null;window._ceCtxNext=null; // contexto solo si viene de Revisar bici
  ceB=bikes.find(b=>b.id===id);if(!ceB)return;
  const t=tipos[ceB.tipo]||{icon:'🚲',label:'Bici'};
  const lista=_ceLista(ceB);
  ceS={};(lista||[]).forEach(i=>ceS[i]=false);
  document.getElementById('ce-titulo').textContent=`${t.icon} ${ceB.numBici} — ${ceB.modelo||t.label} · Talla ${ceB.talla||'—'}`;
  const u=_ultEntrega(ceB);
  document.getElementById('ce-ultima').innerHTML=u?`Última revisión: <b>${esc(u.fecha)}</b> por ${esc(u.tecnico)} — ${u.resultado==='apta'?'✅ Apta':'❌ No apta'}`:'Esta bici aún no tiene revisiones.';
  document.getElementById('ce-aviso-aver').style.display=ceB.estado==='averiada'?'':'none';
  document.getElementById('ce-tec').value=localStorage.getItem('vr_ce_tec')||'';
  document.getElementById('ce-notas').value='';
  renderCE();openM('mce');
}
function renderCE(){
  const el=document.getElementById('ce-items'),lista=_ceLista(ceB);
  const t=tipos[ceB.tipo]||{label:ceB.tipo};
  if(!lista){
    el.innerHTML=`<div class="empty-state" style="padding:20px"><div class="empty-state-icon">☑️</div><div class="empty-state-text">El modelo <b>${esc(t.label)}</b> aún no tiene checklist de Revisar bici.</div><button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="closeM('mce');abrirChecklistEntregaModelo('${ceB.tipo}')">Crear checklist de este modelo</button></div>`;
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
  const _ctx=window._ceCtx;
  const lista=_ceLista(ceB);
  if(!lista){toast('⚠️ Crea primero el checklist de Revisar bici de este modelo',3500,'error');return;}
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
  sh();closeM('mce');ceB=null;window._ceCtx=null;
  // Abierto desde "Revisar bici": la revisión cuenta para esa bici de la reserva
  if(_ctx){const rr=reservas.find(x=>String(x.id)===String(_ctx.resId));const ll=rr&&rr.lineas&&rr.lineas[_ctx.li];
    if(ll){ll.tallerOk=apta?{fecha:reg.fecha,ts:reg.ts,tec:tec,bikeId:b.id}:null;DB.saveReserva(rr).catch(e=>console.error('tallerOk',e));}
    if(typeof renderPreparar==='function'&&cv==='preparar')renderPreparar();updFlujoBadges();}
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


// ── UBICACIÓN DE LA BICI (solo informativa: NO cambia stock ni disponibilidad) ──
// Dónde está físicamente la bici. Se actualiza sola al entregarla (Con cliente) y al
// recogerla (Santiago); se cambia a mano en Editar bici o en "Dónde están las bicis".
const UBICACIONES={
  mondonedo:{lbl:'Mondoñedo',   icon:'🏠',bg:'#dcfce7',txt:'#166534'},
  santiago: {lbl:'Santiago',    icon:'⛪',bg:'#ede9fe',txt:'#5b21b6'},
  cliente:  {lbl:'Con cliente', icon:'🚴',bg:'#dbeafe',txt:'#1e40af'},
  otro:     {lbl:'Otro lugar',  icon:'📍',bg:'#fef3c7',txt:'#92400e'}
};
function ubicDe(b){return (b&&UBICACIONES[b.ubicacion])?b.ubicacion:'mondonedo';}
function ubicTexto(b){const u=UBICACIONES[ubicDe(b)];return u.lbl+(b.ubicacionTxt?' · '+b.ubicacionTxt:'');}
function ubicBadge(b){const u=UBICACIONES[ubicDe(b)];
  return `<span title="Ubicación${b.ubicacionFecha?' desde '+esc(b.ubicacionFecha):''}" style="display:inline-flex;align-items:center;gap:3px;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:700;background:${u.bg};color:${u.txt}">${u.icon} ${esc(ubicTexto(b))}</span>`;}
// Cambia la ubicación y la apunta en el historial de la bici. guardar=false si quien llama ya guarda.
function setUbicacion(b,u,txt,nota,guardar){
  if(!b||!UBICACIONES[u])return;
  const antes=ubicDe(b)+'|'+(b.ubicacionTxt||'');
  b.ubicacion=u;b.ubicacionTxt=(u==='cliente'||u==='otro')?(txt||''):'';
  if(antes===u+'|'+b.ubicacionTxt)return;
  b.ubicacionFecha=new Date().toLocaleString('es-ES');
  if(!b.ubicHist)b.ubicHist=[];
  b.ubicHist.push({u:u,txt:b.ubicacionTxt,fecha:b.ubicacionFecha,ts:new Date().toISOString(),nota:nota||''});
  if(b.ubicHist.length>40)b.ubicHist=b.ubicHist.slice(-40);
  if(guardar!==false&&typeof DB!=='undefined'&&DB.saveBici)DB.saveBici(b).catch(e=>console.error('ubicacion',e));
}
function abUbicCambio(){const v=document.getElementById('ab-ubic').value;const w=document.getElementById('ab-ubic-txt');w.style.display=(v==='otro'||v==='cliente')?'':'none';}

// Ventana "Dónde están las bicis" (V29)
let _ubicFiltro='santiago';
function abrirUbicaciones(u){_ubicFiltro=u||_ubicFiltro||'santiago';openM('mubic');renderUbicaciones();}
function renderUbicaciones(){
  const tabs=document.getElementById('ubic-tabs');
  tabs.innerHTML=Object.entries(UBICACIONES).map(([k,u])=>{const n=bikes.filter(b=>ubicDe(b)===k).length;
    return `<button class="type-tab ${_ubicFiltro===k?'active':''}" onclick="_ubicFiltro='${k}';renderUbicaciones()">${u.icon} ${u.lbl} <b>${n}</b></button>`;}).join('');
  const lista=bikes.filter(b=>ubicDe(b)===_ubicFiltro).sort((a,b)=>String(a.numBici).localeCompare(String(b.numBici),'es',{numeric:true}));
  const el=document.getElementById('ubic-lista');
  el.innerHTML=lista.length?lista.map(b=>{const t=tipos[b.tipo]||{icon:'🚲',label:b.tipo};const be=BIKE_ESTADOS[b.estado]||{icon:'',lbl:b.estado};
    return `<label style="display:flex;align-items:center;gap:10px;padding:8px 6px;border-bottom:1px solid var(--gray-100);cursor:pointer">
      <input type="checkbox" class="ubic-chk" value="${b.id}" style="width:18px;height:18px"/>
      <span style="font-size:18px">${t.icon}</span>
      <span style="flex:1"><b>${esc(b.numBici)}</b> · ${esc(t.label)} ${esc(b.talla||'')} <span style="color:var(--gray-400);font-size:12px">· ${be.icon} ${esc(be.lbl)}${b.ubicacionTxt?' · '+esc(b.ubicacionTxt):''}${b.ubicacionFecha?' · desde '+esc(b.ubicacionFecha.split(',')[0]):''}</span></span>
    </label>`;}).join(''):'<div class="empty-state" style="padding:24px"><div class="empty-state-text">No hay bicis aquí</div></div>';
  document.getElementById('ubic-mover').innerHTML=Object.entries(UBICACIONES).filter(([k])=>k!==_ubicFiltro).map(([k,u])=>`<option value="${k}">${u.icon} ${u.lbl}</option>`).join('');
  document.getElementById('ubic-todas').checked=false;
}
function ubicMarcarTodas(v){document.querySelectorAll('#ubic-lista .ubic-chk').forEach(c=>c.checked=v);}
function moverUbicaciones(){
  const ids=[...document.querySelectorAll('#ubic-lista .ubic-chk:checked')].map(c=>c.value);
  if(!ids.length){toast('⚠️ Marca las bicis que quieres mover');return;}
  const dest=document.getElementById('ubic-mover').value;
  let txt='';if(dest==='otro'||dest==='cliente'){txt=prompt('¿Dónde / con quién están?')||'';}
  ids.forEach(id=>{const b=bikes.find(x=>String(x.id)===String(id));if(b)setUbicacion(b,dest,txt,'Cambio manual',false);});
  sb();renderUbicaciones();renderBL();rDB();
  toast('📍 '+ids.length+' bici'+(ids.length>1?'s':'')+' → '+UBICACIONES[dest].lbl);
}


// Fin de la reserva: la bici queda donde termina la reserva (lugar de finalización).
function ubicarEnFinDeReserva(b,r,nota){
  const fin=String((r&&r.lugarFin)||'Santiago de Compostela').trim();
  if(/santiago/i.test(fin))setUbicacion(b,'santiago','',nota,false);
  else setUbicacion(b,'otro',fin,nota,false);
}

// ── LLEGADA A MONDOÑEDO: escanear el QR de cada bici al descargarla ──
// Escaneo seguido: cada bici leída queda en Mondoñedo y la cámara se vuelve a abrir sola.
let _llegadas=[];
function abrirLlegadaMondonedo(){
  _llegadas=[];
  window._qrModoAlta=false;
  window._qrDestino=_llegadaLeida;
  const tit=document.querySelector('#mqr .modal-title');if(tit)tit.textContent='📥 Llegada a Mondoñedo';
  const inp=document.getElementById('qr-inp');if(inp){inp.value='';inp.placeholder='BCP-0001 o nº de bici';}
  const mq=document.getElementById('mqr');if(mq)mq.style.zIndex='100000';
  openM('mqr');openQRCamera();
  _llegadaInfo('📷 Escanea las bicis una a una según las descargas','ok');
}
// Recuadro fijo con el resultado y el contador (no lo borra la cámara al reabrirse)
function _llegadaInfo(msg,tipo){
  let el=document.getElementById('llegada-info');
  if(!el){el=document.createElement('div');el.id='llegada-info';const st=document.getElementById('qr-status');st.parentNode.insertBefore(el,st);}
  const c={ok:['#f0fdf4','#166534','#86efac'],warn:['#fffbeb','#92400e','#fcd34d'],err:['#fef2f2','#991b1b','#fca5a5']}[tipo]||['#f0fdf4','#166534','#86efac'];
  el.style.cssText='display:block;background:'+c[0]+';color:'+c[1]+';border:2px solid '+c[2]+';border-radius:10px;padding:10px 12px;margin-bottom:10px;font-weight:700;font-size:14px';
  el.innerHTML=esc(msg)+'<div style="font-size:22px;font-weight:900;margin-top:4px">'+_llegadas.length+' <span style="font-size:13px;font-weight:700">bici'+(_llegadas.length!==1?'s':'')+' descargada'+(_llegadas.length!==1?'s':'')+'</span></div>';
}
function _llegadaLeida(txt){
  let c=(typeof bcpNormalizar==='function')?bcpNormalizar(txt):String(txt||'').trim().toUpperCase();
  const m=c.match(/BCP-\d{4}/);if(m&&!bikes.some(b=>String(b.qr||'').toUpperCase()===c))c=m[0];
  const b=bikes.find(x=>String(x.qr||'').toUpperCase()===c)||bikes.find(x=>String(x.numBici).toUpperCase()===c);
  const seguir=()=>{const mq=document.getElementById('mqr');if(mq&&mq.classList.contains('on')&&window._qrDestino===_llegadaLeida)setTimeout(()=>{openQRCamera();},1200);};
  const inp=document.getElementById('qr-inp');if(inp)inp.value='';
  if(!b){_llegadaInfo('❌ «'+c+'»: no es ninguna bici. Escanea la siguiente.','err');seguir();return;}
  if(_llegadas.indexOf(b.id)>=0){_llegadaInfo('ℹ️ '+b.numBici+' ya estaba escaneada','warn');seguir();return;}
  const eraTxt=ubicTexto(b);
  setUbicacion(b,'mondonedo','','Llegada a Mondoñedo (QR)');
  _llegadas.push(b.id);
  if(navigator.vibrate)try{navigator.vibrate(80);}catch(e){}
  _llegadaInfo('✅ '+b.numBici+' en Mondoñedo (estaba: '+eraTxt+')','ok');
  seguir();
}
function _cerrarLlegada(){
  const li=document.getElementById('llegada-info');if(li)li.style.display='none';
  if(window._qrDestino!==_llegadaLeida)return;
  const n=_llegadas.length;
  if(n)toast('📥 '+n+' bici'+(n>1?'s':'')+' de vuelta en Mondoñedo',3500,'success');
  if(typeof renderBL==='function')renderBL();if(typeof rDB==='function')rDB();
  const mu=document.getElementById('mubic');if(mu&&mu.classList.contains('on'))renderUbicaciones();
}


// ═══ FLUJO DE SALIDA: 1) Revisar bici (taller)  2) Preparar bici  3) Listas para salir ═══
// Cada bici de la reserva (línea) guarda en la propia reserva (Supabase):
//   l.tallerOk = {fecha,tec,bikeId}  → checklist de taller (V28) "Apta" en Revisar bici
//   l.prepChk  = {item:true…}, l.prepOk = {fecha,por} → Preparar bici completo
// No toca la disponibilidad ni asigna bicis.
function _lineasRes(r){
  if(Array.isArray(r.lineas))r.lineas=r.lineas.filter(Boolean);
  if(!Array.isArray(r.lineas)||!r.lineas.length)r.lineas=[{tipo:r.tipo,talla:r.talla,uds:r.uds||1,bikeAsig:(r.bikesAsig&&r.bikesAsig[0])||null}];
  _vincularAsignaciones(r);
  return r.lineas;
}
// Bicis asignadas desde "Editar reserva" se guardaban solo en r.bikesAsig y las bicis de la
// reserva salían "Sin asignar" aunque la bici ya estaba ocupada por esa reserva. Aquí se
// enlaza cada una a su línea (mismo modelo y talla, sin bici). No asigna nada nuevo: solo
// coloca en su línea la bici que ya se asignó a mano en esa reserva.
function _vincularAsignaciones(r){
  if(!Array.isArray(r.bikesAsig)||!r.bikesAsig.length)return;
  let cambio=false;
  r.bikesAsig.forEach(a=>{
    if(!a||!a.id)return;
    if(r.lineas.some(l=>l.bikeAsig&&String(l.bikeAsig.id)===String(a.id)))return;
    const b=bikes.find(x=>String(x.id)===String(a.id));
    const tipo=(b&&b.tipo)||a.tipo,talla=(b&&b.talla)||a.talla;
    const l=r.lineas.find(x=>!x.bikeAsig&&x.tipo===tipo&&x.talla===talla);
    if(l){l.bikeAsig={id:a.id,num:(b&&b.numBici)||a.num};cambio=true;}
  });
  if(cambio&&typeof DB!=='undefined'&&DB.saveReserva)DB.saveReserva(r).catch(e=>console.error('vincular',e));
}
function lineaRevisada(l){return !!(l&&l.tallerOk&&l.bikeAsig&&String(l.tallerOk.bikeId)===String(l.bikeAsig.id));}
// Extras de una bici de la reserva: los de la línea y, en reservas antiguas, los de la
// reserva que apuntan a ese modelo/talla (o sin línea, en la primera bici). Igual que la hoja.
const _arr=v=>Array.isArray(v)?v.filter(x=>x&&typeof x==='object'):[]; // datos antiguos: puede no ser una lista
function extrasDeLinea(r,l,li){
  const out=_arr(l.extras).slice();
  const ls=_lineasRes(r);
  _arr(r.extras).forEach(ex=>{
    // Extras guardados en la reserva (sistema antiguo): van a la bici de su modelo/talla;
    // si no hay ninguna que coincida (o no indican bici), a la primera. Nunca se pierden.
    const hayDestino=ex.lineaTipo&&ls.some(x=>x.tipo===ex.lineaTipo&&x.talla===ex.lineaTalla);
    const primeraQueCoincide=hayDestino?ls.findIndex(x=>x.tipo===ex.lineaTipo&&x.talla===ex.lineaTalla):0;
    const suya=hayDestino?(li===primeraQueCoincide):(li===0);
    if(suya&&!out.some(e=>String(e.id)===String(ex.id)))out.push(ex);
  });
  return out;
}
function _extraNombre(x){if(!x)return 'Extra';if(x.nombre)return x.nombre;const c=(catalogoExtras||[]).find(e=>String(e.id)===String(x.id));return (c&&c.nombre)||('Extra '+x.id);} // primero el nombre guardado en la reserva
function _extraIcono(x){if(!x)return '🎒';if(x.icono)return x.icono;const c=(catalogoExtras||[]).find(e=>String(e.id)===String(x.id));return (c&&c.icono)||'🎒';}
// Puntos a marcar en Preparar bici. Cada punto: {k:clave única, txt, grupo:'reserva'|'modelo', ico}
function puntosPrepLinea(l,r,li){
  const pts=[],uds=l.uds||1;
  const _peds=Array.isArray(l.pedales)?l.pedales:(l.pedales?[l.pedales]:(l.pedal?[l.pedal]:[]));
  for(let u=0;u<uds;u++){const ped=_peds[u]||'';
    if(ped)pts.push({k:'Pedales: '+ped+(uds>1?' (bici '+(u+1)+')':''),txt:'Pedales: '+ped+(uds>1?' (bici '+(u+1)+')':''),grupo:'reserva',ico:'🦶'});}
  if(l.altura)pts.push({k:'Sillín ajustado para ciclista de '+l.altura+' cm',txt:'Sillín ajustado para ciclista de '+l.altura+' cm',grupo:'reserva',ico:'📏'});
  if(r)extrasDeLinea(r,l,li||0).forEach(x=>{const q=x.qty||x.cant||1;const t='Extra: '+_extraNombre(x)+(q>1?' ×'+q:'');pts.push({k:t,txt:_extraNombre(x)+(q>1?' ×'+q:''),grupo:'reserva',ico:_extraIcono(x),extra:true});});
  const mod=(CLP[l.tipo]&&CLP[l.tipo].length)?CLP[l.tipo]:DCLP_GEN;
  mod.forEach(m=>pts.push({k:m,txt:m,grupo:'modelo',ico:'🧰'}));
  return pts;
}
function itemsPrepLinea(l,r,li){return puntosPrepLinea(l,r,li).map(p=>p.k);}
function lineaPreparada(l,r,li){const it=itemsPrepLinea(l,r,li);return !!(l&&l.prepOk&&it.every(i=>l.prepChk&&l.prepChk[i]));}
function revisarLinea(resId,li){
  const r=reservas.find(x=>String(x.id)===String(resId));if(!r)return;
  const l=_lineasRes(r)[li];
  if(!l||!l.bikeAsig){toast('⚠️ Asigna primero la bici a esta línea (botón Asignar)',3500,'error');return;}
  const b=bikes.find(x=>String(x.id)===String(l.bikeAsig.id));
  if(!b){toast('⚠️ No encuentro la bici '+l.bikeAsig.num,3500,'error');return;}
  window._ceCtxNext={resId:r.id,li:li};
  openCE(b.id);
}

// ---- 2) PREPARAR BICI (misma plantilla que Revisar bici) ----
// Página: tarjetas como Revisar bici; cada bici muestra pedales/sillín/extras y el botón
// "🧰 Preparar", que abre la ventana V30 (copia del checklist de Revisar, V28).
function renderPrepBici(){try{_renderPrepBici();}catch(e){console.error(e);const el=document.getElementById('prepbici-content');if(el)el.insertAdjacentHTML('afterbegin','<div style="background:#fee2e2;color:#991b1b;border-radius:8px;padding:10px;margin-bottom:10px;font-weight:700">⚠️ Error al mostrar Preparar bici: '+esc(e.message)+'</div>');}}
function _renderPrepBici(){
  const el=document.getElementById('prepbici-content');if(!el)return;
  const lista=getPrepararData().slice().sort((a,b)=>String(a.ini).localeCompare(String(b.ini)));
  if(!lista.length){el.innerHTML='<div style="padding:40px 20px;text-align:center"><div style="font-size:48px;margin-bottom:12px">🧰</div><div style="font-size:16px;font-weight:700;color:#374151">Sin bicicletas para preparar</div><div style="font-size:13px;color:#6b7280;margin-top:6px">Las reservas activadas para taller aparecen aquí</div></div>';return;}
  const SL={};Object.keys(SCFG).forEach(k=>SL[k]=SCFG[k].lbl);
  let h='<div style="display:flex;justify-content:flex-end;margin-bottom:10px"><button class="btn btn-ghost btn-sm" onclick="abrirChecklistModelo(null,\'prep\')">⚙️ Checklists por modelo</button></div><div style="display:flex;flex-direction:column;gap:14px">';
  lista.forEach(r=>{
    const ls=_lineasRes(r),hechas=ls.filter((l,i)=>lineaPreparada(l,r,i)).length,todas=hechas===ls.length;
    h+='<div style="background:#fff;border:2px solid #dbeafe;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(37,99,235,.1)">'
      +'<div style="background:#dbeafe;padding:12px 16px;display:flex;align-items:flex-start;justify-content:space-between;gap:10px"><div style="flex:1">'
      +'<div style="font-weight:900;font-size:16px;color:#1e3a5f;margin-bottom:4px">👤 '+esc(r.cliente)+'</div>'
      +(r.lugarIni?'<div style="font-size:13px;font-weight:700;color:#1d4ed8;margin-bottom:2px">📍 Inicio: <span style="font-weight:800">'+esc(r.lugarIni)+'</span></div>':'')
      +'<div style="font-size:12px;color:#3b82f6">📅 '+(r.ini||'')+' → '+(r.fin||'')+(r.dias?' ('+r.dias+' días)':'')+'</div>'
      +(r.tel?'<div style="margin-top:4px"><a href="tel:'+esc(r.tel)+'" style="font-size:12px;color:#2563eb;text-decoration:none;font-weight:700">📞 '+esc(r.tel)+'</a></div>':'')
      +'</div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">'
      +'<span style="background:#fff;border:1px solid #93c5fd;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700;color:#1d4ed8">'+esc(SL[r.estado]||r.estado)+'</span>'
      +'<span style="font-weight:900;font-size:13px;color:'+(todas?'#15803d':'#1d4ed8')+'">'+hechas+'/'+ls.length+' preparadas</span></div></div>'
      +'<div style="padding:12px 16px">'
      +(r.notas?'<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:8px 10px;margin-bottom:10px;font-size:13px;color:#92400e;white-space:pre-wrap"><b>📝 Observaciones de la reserva:</b>\n'+esc(r.notas)+'</div>':'')
      +'<div style="font-size:10px;font-weight:800;color:#6b7280;text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">🧰 Bicicletas a preparar</div>';
    ls.forEach((l,li)=>{
      const t=tipos[l.tipo]||{icon:'🚲',label:l.tipo,color:'#999'};
      const ok=lineaPreparada(l,r,li),pts=puntosPrepLinea(l,r,li);
      const exs=extrasDeLinea(r,l,li);
      const peds=(Array.isArray(l.pedales)?l.pedales:[]).filter(Boolean);
      h+='<div style="border:2px solid '+(ok?'#86efac':'#e5e7eb')+';border-radius:10px;padding:11px 13px;margin-bottom:8px;background:'+(ok?'#f0fdf4':'#fafafa')+'">'
        +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">'
        +'<div style="width:38px;height:38px;background:'+(t.color||'#999')+'22;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">'+t.icon+'</div>'
        +'<div style="flex:1"><div style="font-weight:800;font-size:14px;color:#111">'+esc(t.label)+'</div>'
        +'<div style="font-size:13px;color:#374151;font-weight:700">📏 Talla: <span style="background:#f3f4f6;padding:2px 8px;border-radius:4px;font-weight:800">'+esc(l.talla||r.talla||'?')+'</span>'+((l.uds||1)>1?' <span style="color:#6b7280">×'+l.uds+'</span>':'')+'</div>'
        +(l.bikeAsig?'<div style="font-size:12px;color:#15803d;margin-top:3px;font-weight:700">🔗 Bici: '+esc(l.bikeAsig.num)+'</div>':'<div style="font-size:12px;color:#d97706;margin-top:3px">⚠️ Sin bici asignada</div>')
        +'</div><div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0">'
        +'<button onclick="abrirPrepBici('+r.id+','+li+')" style="border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap;'+(ok?'background:#dcfce7;color:#15803d':'background:#f3f4f6;color:#374151')+'">'+(ok?'✅ Preparada':'🧰 Preparar')+'</button>'
        +'</div></div>'
        // Lo que lleva esta bici (igual que en Revisar se ve la bici asignada)
        +'<div style="display:flex;flex-wrap:wrap;gap:5px">'
        +(peds.length?peds.map(p=>'<span style="background:#ede9fe;color:#5b21b6;padding:3px 9px;border-radius:999px;font-size:12px;font-weight:800">🦶 '+esc(p)+'</span>').join(''):'<span style="background:#fee2e2;color:#b91c1c;padding:3px 9px;border-radius:999px;font-size:12px;font-weight:800">🦶 Pedales sin elegir</span>')
        +(l.altura?'<span style="background:#e0f2fe;color:#075985;padding:3px 9px;border-radius:999px;font-size:12px;font-weight:800">📏 '+esc(l.altura)+' cm</span>':'')
        +(exs.length?exs.map(x=>'<span style="background:#fef3c7;color:#92400e;padding:3px 9px;border-radius:999px;font-size:12px;font-weight:800">'+_extraIcono(x)+' '+esc(_extraNombre(x))+((x.qty||x.cant)>1?' ×'+(x.qty||x.cant):'')+'</span>').join(''):'<span style="background:#f3f4f6;color:#6b7280;padding:3px 9px;border-radius:999px;font-size:12px;font-weight:700">Sin extras</span>')
        +'</div>'
        +(ok&&l.prepOk?'<div style="font-size:11.5px;color:#15803d;margin-top:4px;font-weight:700">✅ Preparada por '+esc(l.prepOk.por||'')+' · '+esc(String(l.prepOk.fecha||'').split(',')[0])+'</div>':'')
        +'</div>';
    });
    h+='</div></div>';
  });
  h+='</div>';
  el.innerHTML=h;
}
// Ventana V30: copia de la plantilla del checklist de Revisar bici (V28)
let _pb=null,_pbChk={};
function abrirPrepBici(resId,li){
  const r=reservas.find(x=>String(x.id)===String(resId));if(!r)return;
  const l=_lineasRes(r)[li];if(!l)return;
  const t=tipos[l.tipo]||{icon:'🚲',label:l.tipo};
  _pb={resId:r.id,li:li};
  _pbChk=Object.assign({},l.prepChk||{});
  document.getElementById('pb-titulo').textContent=t.icon+' '+(l.bikeAsig?l.bikeAsig.num+' — ':'')+t.label+' · Talla '+(l.talla||'—');
  document.getElementById('pb-cliente').textContent='👤 '+r.cliente+' · 📅 '+fmtD(r.ini)+' → '+fmtD(r.fin)+(l.prepOk?' · Última: preparada por '+(l.prepOk.por||'')+' el '+String(l.prepOk.fecha||'').split(',')[0]:'');
  document.getElementById('pb-por').value=l.prepOk&&l.prepOk.por||(function(){try{return localStorage.getItem('vr_prep_por')||'';}catch(e){return '';}})();
  // Observaciones = las de la reserva (las mismas que en la hoja de reserva)
  document.getElementById('pb-obs').value=r.notas||'';
  renderPB();openM('mpb');
}
function renderPB(){
  const r=reservas.find(x=>String(x.id)===String(_pb.resId));const l=_lineasRes(r)[_pb.li];
  const pts=puntosPrepLinea(l,r,_pb.li);
  let h='',g='';
  pts.forEach((p,i)=>{
    if(p.grupo!==g){g=p.grupo;h+='<div style="font-size:11px;font-weight:800;color:'+(g==='reserva'?'#b45309':'#4b5563')+';text-transform:uppercase;letter-spacing:.4px;margin:8px 4px 4px">'+(g==='reserva'?'🎒 De esta reserva':'🧰 Del modelo '+esc((tipos[l.tipo]||{label:l.tipo}).label))+'</div>';}
    const c=!!_pbChk[p.k];
    h+='<div class="check-item'+(c?' done':'')+'" onclick="pbTog('+i+')"'+(p.extra&&!c?' style="background:#fffbeb"':'')+'><div class="check-box">'+(c?'✓':'')+'</div><span style="font-size:16px;margin-right:4px">'+p.ico+'</span><span class="check-text">'+esc(p.txt)+'</span></div>';
  });
  document.getElementById('pb-items').innerHTML=h;
  const done=pts.filter(p=>_pbChk[p.k]).length;
  const pr=document.getElementById('pb-prog');pr.textContent=done+' de '+pts.length+' preparados';pr.style.color=done===pts.length?'var(--green-600)':'var(--blue-600)';
}
function pbTog(i){const r=reservas.find(x=>String(x.id)===String(_pb.resId));const l=_lineasRes(r)[_pb.li];const p=puntosPrepLinea(l,r,_pb.li)[i];if(!p)return;_pbChk[p.k]=!_pbChk[p.k];renderPB();}
function pbTodo(v){const r=reservas.find(x=>String(x.id)===String(_pb.resId));const l=_lineasRes(r)[_pb.li];puntosPrepLinea(l,r,_pb.li).forEach(p=>{_pbChk[p.k]=v;});renderPB();}
function savePB(){try{_savePB();}catch(e){console.error(e);toast('⚠️ Error al guardar: '+e.message,7000,'error');}}
function _savePB(){
  if(!_pb)return;
  const r=reservas.find(x=>String(x.id)===String(_pb.resId));const li=_pb.li;const l=_lineasRes(r)[li];
  const pts=puntosPrepLinea(l,r,li);
  const falta=pts.filter(p=>!_pbChk[p.k]).map(p=>p.txt);
  const por=document.getElementById('pb-por').value.trim();
  if(!por){toast('🔴 Falta el nombre de quien prepara',3500,'error');document.getElementById('pb-por').focus();return;}
  if(falta.length&&!confirm('Faltan '+falta.length+' de '+pts.length+' puntos:\n• '+falta.join('\n• ')+'\n\n¿Guardar sin marcarla como preparada?'))return;
  try{localStorage.setItem('vr_prep_por',por);}catch(e){}
  l.prepChk=Object.assign({},_pbChk);
  r.notas=document.getElementById('pb-obs').value.trim(); // se guardan en la reserva
  l.prepOk=falta.length?null:{fecha:new Date().toLocaleString('es-ES'),ts:new Date().toISOString(),por:por};
  DB.saveReserva(r).catch(e=>{console.error('prep',e);toast('⚠️ No se ha podido guardar en el servidor: '+(e&&e.message||e)+'. Revisa la conexión y vuelve a pulsar.',7000,'error');});
  closeM('mpb');_pb=null;
  toast(falta.length?'💾 Guardado (faltan '+falta.length+' puntos)':'✅ Bici '+(li+1)+' de '+r.cliente+' preparada',3000,falta.length?'':'success');
  renderPrepBici();updFlujoBadges();
}
function tickPrep(resId,li,k){
  const r=reservas.find(x=>String(x.id)===String(resId));if(!r)return;
  const l=_lineasRes(r)[li];const it=itemsPrepLinea(l,r,li);const item=it[k];if(item===undefined)return;
  if(!l.prepChk)l.prepChk={};
  l.prepChk[item]=!l.prepChk[item];
  if(!l.prepChk[item])l.prepOk=null; // si se desmarca algo, deja de estar preparada
  DB.saveReserva(r).catch(e=>console.error('prep',e));
  renderPrepBici();updFlujoBadges();
}

// Confirmar con el botón: "✅ Bici preparada"
function marcarPreparada(resId,li){
  const r=reservas.find(x=>String(x.id)===String(resId));if(!r)return;
  const l=_lineasRes(r)[li];const it=itemsPrepLinea(l,r,li);
  const falta=it.filter(i=>!(l.prepChk&&l.prepChk[i]));
  if(falta.length){toast('⚠️ Falta marcar: '+falta.join(', '),5000,'error');return;}
  const por=((document.getElementById('prep-por')||{}).value||'').trim();
  if(!por){toast('⚠️ Escribe arriba quién la ha preparado',3500,'error');const e=document.getElementById('prep-por');if(e)e.focus();return;}
  l.prepOk={fecha:new Date().toLocaleString('es-ES'),ts:new Date().toISOString(),por:por};
  DB.saveReserva(r).catch(e=>console.error('prep',e));
  toast('✅ Bici '+(li+1)+' de '+r.cliente+' preparada');
  renderPrepBici();updFlujoBadges();
}
function desmarcarPreparada(resId,li){
  const r=reservas.find(x=>String(x.id)===String(resId));if(!r)return;
  const l=_lineasRes(r)[li];l.prepOk=null;
  DB.saveReserva(r).catch(e=>console.error('prep',e));
  renderPrepBici();updFlujoBadges();
}
function obsPrep(resId,li,v){
  const r=reservas.find(x=>String(x.id)===String(resId));if(!r)return;
  r.notas=String(v||'').trim();
  DB.saveReserva(r).catch(e=>console.error('notas',e));
}

// ---- 3) LISTAS PARA SALIR ----
function renderListasSalir(){
  const el=document.getElementById('listas-content');if(!el)return;
  const lista=getPrepararData().slice().sort((a,b)=>String(a.ini).localeCompare(String(b.ini)));
  if(!lista.length){el.innerHTML='<div class="empty-state" style="padding:32px"><div class="empty-state-icon">🚚</div><div class="empty-state-text">No hay reservas activadas para taller</div></div>';return;}
  const tick=(ok,lbl,go)=>'<span onclick="'+go+'" style="cursor:pointer;display:inline-flex;align-items:center;gap:4px;padding:4px 9px;border-radius:999px;font-size:12px;font-weight:800;background:'+(ok?'#dcfce7':'#fee2e2')+';color:'+(ok?'#15803d':'#b91c1c')+'">'+(ok?'✅':'❌')+' '+lbl+'</span>';
  let h='';
  lista.forEach(r=>{
    const ls=_lineasRes(r);
    const listas=ls.filter((l,i)=>lineaRevisada(l)&&lineaPreparada(l,r,i)).length,todas=listas===ls.length;
    h+='<div class="card" style="margin-bottom:14px;border:2px solid '+(todas?'#22c55e':'#e5e7eb')+'">'
      +'<div style="padding:12px 14px;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;background:'+(todas?'#dcfce7':'#f9fafb')+'">'
      +'<div><div style="font-weight:800;font-size:15px">'+esc(r.cliente)+'</div><div style="font-size:12px;color:#6b7280">📅 Inicio '+fmtD(r.ini)+' · 📍 '+esc(r.dirEntrega||r.lugarIni||'')+'</div></div>'
      +(todas?'<span style="background:#16a34a;color:#fff;padding:6px 12px;border-radius:8px;font-weight:900">✅ LISTA PARA SALIR</span>':'<span style="font-weight:800;color:#92400e">'+listas+'/'+ls.length+' bicis listas</span>')
      +'</div><div style="padding:8px 14px">';
    ls.forEach((l,li)=>{
      const t=tipos[l.tipo]||{icon:'🚲',label:l.tipo};
      const rv=lineaRevisada(l),pp=lineaPreparada(l,r,li),ok=rv&&pp;
      h+='<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:9px 10px;margin:6px 0;border-radius:10px;background:'+(ok?'#16a34a':'#fff')+';border:1px solid '+(ok?'#16a34a':'#e5e7eb')+'">'
        +'<div style="flex:1;min-width:160px;font-weight:800;color:'+(ok?'#fff':'#111')+'">'+t.icon+' Bici '+(li+1)+' · '+esc(t.label)+' '+esc(l.talla||'')+(l.bikeAsig?' · '+esc(l.bikeAsig.num):' · <span style="color:'+(ok?'#fff':'#d97706')+'">sin asignar</span>')+'</div>'
        +(ok?'<span style="color:#fff;font-weight:900">✅ Lista para salir</span>'
            :tick(rv,'Taller',"switchSection('taller','preparar')")+' '+tick(pp,'Preparar',"switchSection('taller','prepbici')"))
        +'</div>';
    });
    if(r.notas)h+='<div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:7px 10px;margin-top:6px;font-size:12.5px;color:#92400e;white-space:pre-wrap"><b>📝 Observaciones:</b> '+esc(r.notas)+'</div>';
    h+='<div style="text-align:right;margin-top:6px"><button class="btn '+(todas?'btn-success':'btn-secondary')+' btn-sm" onclick="haSalido('+r.id+')">🚚 Ha salido · quitar de la lista</button></div>';
    h+='</div></div>';
  });
  el.innerHTML=h;
}
function haSalido(resId){
  const r=reservas.find(x=>String(x.id)===String(resId));if(!r)return;
  const ls=_lineasRes(r),f=ls.filter((l,i)=>!(lineaRevisada(l)&&lineaPreparada(l,r,i))).length;
  if(f&&!confirm('A '+f+' bici'+(f>1?'s':'')+' de '+r.cliente+' le falta taller o preparar.\n¿Quitarla de la lista igualmente?'))return;
  marcarListoParaEntregar(resId);
  renderListasSalir();updFlujoBadges();
}
function updFlujoBadges(){
  const lista=getPrepararData();let rev=0,pre=0,lis=0;
  lista.forEach(r=>{_lineasRes(r).forEach((l,i)=>{const pp=lineaPreparada(l,r,i);if(!lineaRevisada(l))rev++;if(!pp)pre++;if(lineaRevisada(l)&&pp)lis++;});});
  const set=(id,n,col)=>{const b=document.getElementById(id);if(!b)return;b.textContent=n;b.classList.toggle('hidden',!n);if(col)b.style.background=col;};
  set('prepbici-badge-sb',pre);set('listas-badge-sb',lis,'#16a34a');
}
