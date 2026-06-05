// ── DATA ──────────────────────────────────────────────────
const TD = {
  urbana:   {label:'MTB',        icon:'🚲', color:'#3b82f6', sizes:['XS','S','M','L','XL']},
  montana:  {label:'Powerfly',   icon:'🚵', color:'#22c55e', sizes:['S','M','L','XL']},
  electrica:{label:'Checkpoint', icon:'⚡', color:'#f59e0b', sizes:['S','M','L']},
  cargo:    {label:'Cargo',      icon:'📦', color:'#8b5cf6', sizes:['Único','L','XL']},
  infantil: {label:'Infantil',   icon:'🛴', color:'#ec4899', sizes:['12"','16"','20"','24"']},
  gravel:   {label:'Gravel',     icon:'🏔️', color:'#06b6d4', sizes:['XS','S','M','L','XL']}
};
const DCL = {
  urbana:   ['Frenos delantero y trasero','Cadena limpia y lubricada','Neumáticos presión correcta','Luces delantera y trasera','Sillín regulado y apretado','Manillar alineado','Cambios (si aplica)','Pedales bien apretados','Guardabarros sin rozar','Timbre funciona'],
  montana:  ['Freno delantero hidráulico','Freno trasero hidráulico','Suspensión delantera','Suspensión trasera (si aplica)','Cambios delanteros','Cambios traseros','Cadena limpia','Platos y piñones','Neumáticos sin cortes','Tija sillín y potencia'],
  electrica:['Batería con carga','Conector batería OK','Display funciona','Motor responde','Sistema PAS','Frenos revisados','Cable acelerador','Luces LED','Cargador incluido','Neumáticos presión'],
  cargo:    ['Frenos delantero y trasero','Carga máxima señalizada','Arnés sujeción carga','Neumáticos reforzados','Cuadro sin grietas','Luces reglamentarias','Freno de aparcamiento','Timbre','Reflectantes laterales','Anclaje caja/plataforma'],
  infantil: ['Freno contrapedal','Ruedines (si aplica)','Sillín ajustado','Manillar a altura','Neumáticos presión','Pedales seguros','Reflectantes','Cadena lubricada','Protector cadena','Accesorios seguros'],
  gravel:   ['Freno hidráulico delantero','Freno hidráulico trasero','Presión tubeless','Cambio trasero','Plato único','Tija telescópica','Potencia y manillar','Pedales SPD','Cadena y piñones','Horquilla rigidez']
};
const PS = ['Cámara de aire','Neumático','Pastillas de freno','Cable de freno','Funda cable','Cable cambio','Cadena','Piñón','Cassette','Plato','Pedales','Grip manillar','Sillín','Tija sillín','Potencia manillar','Rodamiento pedalier','Aceite cadena','Desengrasante','Parche tubeless','Disco de freno','Líquido hidráulico'];
const IB = [
  {id:1,numBici:'B-001',numSerie:'SN-2021-001',tipo:'urbana',talla:'M',modelo:'Trek Marlin 7',qr:'B-001',estado:'disponible',icono:''},
  {id:2,numBici:'B-002',numSerie:'SN-2021-002',tipo:'urbana',talla:'L',modelo:'Trek Marlin 7',qr:'B-002',estado:'disponible',icono:''},
  {id:3,numBici:'B-003',numSerie:'SN-2022-003',tipo:'montana',talla:'M',modelo:'Powerfly 5',qr:'B-003',estado:'averiada',icono:''},
  {id:4,numBici:'B-004',numSerie:'SN-2023-004',tipo:'electrica',talla:'M',modelo:'Checkpoint SL',qr:'B-004',estado:'disponible',icono:''},
  {id:5,numBici:'B-005',numSerie:'SN-2023-005',tipo:'infantil',talla:'20"',modelo:'Trek Precaliber',qr:'B-005',estado:'disponible',icono:''}
];

// ── STORAGE ───────────────────────────────────────────────
// ── Variables propias del taller (compartidas con reservas.js) ─
// bikes y tipos ya declarados en reservas.js — se comparten directamente
let CLS=DCL, hist={}, photos={};

// ── Guardar en Supabase ─────────────────────────────────────────
const sb=()=>DB.saveBicis(bikes).catch(e=>console.error('sb',e));
const sc=()=>DB.saveConfig('clistas', CLS).catch(e=>console.error('sc',e));
const sh=()=>DB.saveConfig('historial', hist).catch(e=>console.error('sh',e));
const st=()=>DB.saveConfig('tipos', tipos).catch(e=>console.error('st',e));
const sp=()=>DB.saveConfig('photos', photos).catch(e=>console.error('sp',e));

// ── STATE ─────────────────────────────────────────────────
let cv='dashboard', ft=null, fs=null, fe='all', aB=null, cs={}, pu=[], te='disponible', ect='urbana', eci=[], etc='urbana', cfs='';

// ── UTILS ─────────────────────────────────────────────────
const ns=()=>new Date().toLocaleString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
document.querySelectorAll('.modal-overlay').forEach(m=>m.addEventListener('click',e=>{if(e.target===m){m.classList.remove('on');m.classList.remove('open');if(m.id==='mqr'){try{stopQR();}catch{}}}}));

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
    const aver=cnt-disp;
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
      const aver=cnt-disp;
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
    const hp=photos[b.id]?'<span title="Foto de serie">📷</span>':'';
    const rev=(hist[b.id]||[]).length;
    const thumb=b.icono&&b.icono.startsWith('data:')?`<img src="${b.icono}" style="width:100%;height:100%;object-fit:cover"/>`:`<span style="font-size:22px">${t.icon}</span>`;
    return `<div class="bike-row">
      <div class="bike-thumb" style="background:${t.color}15">${thumb}</div>
      <div class="bike-main">
        <div class="bike-name-row">
          <span class="bike-name">${esc(b.numBici)}</span>
          <span class="badge ${d?'badge-green':'badge-red'}"><span class="badge-dot"></span>${d?'Disponible':'Averiada'}</span>
          <span class="badge badge-gray">${esc(b.talla)}</span>
          ${hp}
        </div>
        <div class="bike-details">
          <span class="bike-detail-item">📋 ${esc(b.modelo||'')}</span>
          <span class="bike-detail-item">🔢 ${esc(b.numSerie)}</span>
          <span class="bike-detail-item">📡 QR: ${esc(b.qr||b.numBici)}</span>
          <span class="bike-detail-item">🔧 ${rev} rev.</span>
        </div>
      </div>
      <div class="bike-actions">
        <button class="btn btn-ghost btn-icon" title="Historial" onclick="openHB(${b.id})">📋</button>
        <button class="btn btn-ghost btn-icon" title="Editar" onclick="openEB(${b.id})">✏️</button>
        <button class="btn btn-danger btn-sm" title="Eliminar" onclick="delBike(${b.id})">🗑️</button>
        <button class="btn ${b.estado==='disponible'?'btn-secondary':'btn-success'} btn-sm" onclick="toggleE(${b.id})">${b.estado==='disponible'?'⚠️ Averiar':'✅ Activar'}</button>
        <button class="btn btn-primary btn-sm" onclick="openT(${b.id})">🔧 Taller</button>
      </div>
    </div>`;
  }).join('');
}

// Check if bike has pending/active reservations — reads shared DB cache
function getReservasActivasBike(bikeId, numBici, talla, tipo){
  var reservas=[];
  reservas = window._sharedReservas || [];
  var today=new Date().toISOString().slice(0,10);
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
  const tec=document.getElementById('t-tec').value.trim();
  if(!tec){toast('⚠️ Indica el nombre del técnico');return;}
  const notas=document.getElementById('t-notas').value.trim();
  const tot=ckeys().length,done=Object.values(cs).filter(Boolean).length;
  const reg={id:Date.now(),ts:new Date().toISOString(),fecha:ns(),tecnico:tec,notas,checklist:{...cs},checkedCount:done,totalItems:tot,piezas:[...pu],estadoResultante:te,bikeId:aB.id};
  if(!hist[aB.id])hist[aB.id]=[];
  hist[aB.id].unshift(reg);if(hist[aB.id].length>50)hist[aB.id]=hist[aB.id].slice(0,50);
  sh();
  // Record estado change in bike history
  _registrarEstadoBici(aB, te, tec);
  function doSaveT(){
    const idx=bikes.findIndex(b=>b.id===aB.id);if(idx>=0){bikes[idx].estado=te;sb();}
    if(cfs){photos[aB.id]=cfs;sp();}
    toast('✅ Revisión guardada correctamente');showView('bikes');aB=null;
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
function abReset(){document.getElementById('madd-title').textContent='Nueva bicicleta';document.getElementById('ab-savebtn').textContent='Añadir bicicleta';document.getElementById('ab-eid').value='';['ab-num','ab-ser','ab-qr','ab-mod'].forEach(id=>document.getElementById(id).value='');clearBikePic();var ts=document.getElementById('ab-tipo');ts.removeAttribute('data-loaded');abSizes();setABE('disponible');}
function openEB(id){const b=bikes.find(x=>x.id===id);if(!b)return;document.getElementById('madd-title').textContent='Editar bicicleta';document.getElementById('ab-savebtn').textContent='Guardar cambios';document.getElementById('ab-eid').value=id;document.getElementById('ab-num').value=b.numBici;document.getElementById('ab-ser').value=b.numSerie||'';document.getElementById('ab-qr').value=b.qr||'';document.getElementById('ab-mod').value=b.modelo||'';setBikePicPreview(b.icono||'');var ts=document.getElementById('ab-tipo');ts.removeAttribute('data-loaded');abSizes();ts.value=b.tipo;abSizes();document.getElementById('ab-tal').value=b.talla;setABE(b.estado||'disponible');openM('madd');}
function saveBikeM(){
  const num=document.getElementById('ab-num').value.trim();
  if(!num){toast('⚠️ El número de bicicleta es obligatorio');return;}
  const ser=document.getElementById('ab-ser').value.trim();
  const qr=document.getElementById('ab-qr').value.trim()||num;
  const modelo=document.getElementById('ab-mod').value.trim();
  const icono=document.getElementById('ab-ico').value;
  const tipo=document.getElementById('ab-tipo').value,talla=document.getElementById('ab-tal').value;
  const estado=document.getElementById('ab-est').value||'disponible';
  const eid=document.getElementById('ab-eid').value;
  function doSave(){
    if(eid){const idx=bikes.findIndex(b=>String(b.id)===String(eid));if(idx>=0)bikes[idx]={...bikes[idx],numBici:num,numSerie:ser,qr,modelo,icono,tipo,talla,estado};toast('✅ Bicicleta actualizada');}
    else{bikes.push({id:Date.now(),numBici:num,numSerie:ser,qr,modelo,icono,tipo,talla,estado});toast('✅ Bicicleta añadida');}
    sb();closeM('madd');rDB();if(cv==='bikes')rBV();
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
  var raw=data.trim();
  var q=raw.toUpperCase();
  var found=bikes.find(function(b){
    var fields=[b.numBici||'',b.numSerie||'',b.qr||''].map(function(s){return s.toUpperCase();});
    if(fields.indexOf(q)>=0)return true;
    return fields.some(function(f){return f.length>2&&(f.indexOf(q)>=0||q.indexOf(f)>=0);});
  });
  if(found){closeM('mqr');toast('QR: '+found.numBici);openT(found.id);}
  else{
    qrStatus('Detectado: "'+raw+'" — no coincide con ninguna bici. Copia este texto en el campo QR de la ficha, o introdúcelo manualmente.','err');
    document.getElementById('qr-inp').value=raw;
  }
}

function doQS(){
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
  etc=etc||Object.keys(tipos)[0];
  document.getElementById('et-tabs').innerHTML=Object.entries(tipos).map(([k,t])=>`<button class="type-tab ${etc===k?'active':''}" onclick="swET('${k}')">${t.icon} ${t.label}</button>`).join('');
  const t=tipos[etc]||{};document.getElementById('et-n').value=t.label||'';document.getElementById('et-i').value=t.icon||'';document.getElementById('et-sz').value=(t.sizes||[]).join(', ');
  renderETB();
}
function swET(k){etc=k;renderET();}
function saveET(){const name=document.getElementById('et-n').value.trim(),icon=document.getElementById('et-i').value.trim(),sizes=document.getElementById('et-sz').value.split(',').map(s=>s.trim()).filter(Boolean);if(!name||!icon){toast('⚠️ Nombre e icono requeridos');return;}tipos[etc]={...tipos[etc],label:name,icon,sizes};st();renderET();rDB();toast('✅ Tipo actualizado');}
function renderETB(){
  const list=bikes.filter(b=>b.tipo===etc);
  document.getElementById('et-bikes').innerHTML=list.length?list.map(b=>{
    const d=b.estado==='disponible';
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--gray-100)">
      <span class="badge ${d?'badge-green':'badge-red'}"><span class="badge-dot"></span>${d?'Disp.':'Aver.'}</span>
      <div style="flex:1"><strong style="font-size:13px">${esc(b.numBici)}</strong> <span style="font-size:12px;color:var(--gray-400)">${esc(b.modelo||'')} · ${esc(b.talla)}</span></div>
      <button class="btn btn-secondary btn-xs" onclick="closeM('met');openEB(${b.id})">✏️ Editar</button>
      <button class="btn btn-danger btn-xs" onclick="delBikeFromET(${b.id})">🗑️</button>
    </div>`;
  }).join(''):`<div class="empty-state" style="padding:24px"><div class="empty-state-text">No hay bicicletas de este tipo</div></div>`;
}
function delBikeFromET(id){const b=bikes.find(x=>x.id===id);if(!b||!confirm(`¿Eliminar ${b.numBici}?`))return;bikes=bikes.filter(x=>x.id!==id);delete hist[id];delete photos[id];sb();sh();sp();renderETB();rDB();toast('🗑️ Bicicleta eliminada');}

// ── EDIT CHECKLIST ────────────────────────────────────────
function renderECL(){
  ect=ect||Object.keys(tipos)[0];eci=[...(CLS[ect]||[])];
  document.getElementById('ecl-tabs').innerHTML=Object.entries(tipos).map(([k,t])=>`<button class="type-tab ${ect===k?'active':''}" onclick="swCL('${k}')">${t.icon} ${t.label}</button>`).join('');
  renderECI();
}
function swCL(t){ect=t;eci=[...(CLS[t]||[])];renderECL();}
function renderECI(){
  document.getElementById('ecl-items').innerHTML=eci.length?eci.map((item,i)=>`<div style="display:flex;align-items:center;gap:8px;padding:7px 4px;border-bottom:1px solid var(--gray-100)"><span style="font-size:12px;color:var(--gray-400);width:22px;flex-shrink:0">${i+1}</span><input class="form-input" style="flex:1;padding:6px 10px;font-size:13px" value="${esc(item)}" oninput="eci[${i}]=this.value"/><button onclick="eci.splice(${i},1);renderECI()" style="background:none;border:none;color:var(--red-400);cursor:pointer;font-size:18px;padding:0 4px;flex-shrink:0">✕</button></div>`).join(''):`<div class="empty-state" style="padding:20px"><div class="empty-state-text">Sin ítems. Añade el primero.</div></div>`;
}
function addCLI(){const v=document.getElementById('ecl-new').value.trim();if(!v)return;eci.push(v);document.getElementById('ecl-new').value='';renderECI();}
function saveCL(){CLS[ect]=[...eci];sc();closeM('mecl');toast('✅ Checklist actualizado para '+tipos[ect]?.label);}

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
          <div class="history-title">${b?esc(b.numBici):'?'} <span style="font-weight:400;color:var(--gray-400)">— ${esc(rev.fecha)}</span></div>
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
  var ids=[];var reservas=[];
  ids = window._sharedPreparar || [];
  reservas = window._sharedReservas || [];
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
      +'<div style="color:'+(diagIds.length>0?'#15803d':'#dc2626')+';margin-bottom:4px">'+(diagIds.length>0?'✅':'❌')+' IDs para preparar: <strong>'+diagIds.length+'</strong></div>';
      +'<div style="color:#6b7280;margin-top:8px;font-size:11px">ℹ️ Ambos archivos deben estar en la misma carpeta y abrirse desde el dispositivo (no desde el chat)</div>'
      +'</div>'
      +'<button onclick="refreshPreparar()" style="margin-top:16px;padding:10px 20px;background:#7c3aed;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer">↻ Actualizar ahora</button>'
      +'</div>';
    el.innerHTML=diagHtml;
    return;
  }

  var tipos2 = tipos || {};
  var SLBL={pendiente:'Pendiente',confirmada:'Confirmada',activa:'Activa',finalizada:'Finalizada',cancelada:'Cancelada'};

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

      // Assigned bike for this linea
      var asig=r.bikesAsig&&r.bikesAsig.length
        ?r.bikesAsig.filter(function(a){return a.tipo===l.tipo&&a.talla===l.talla;})
        :[];

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
  var container = document.getElementById('asig-cam-container');
  var video = document.getElementById('asig-cam-video');
  if(!container || !video) return;
  container.style.display = 'block';
  navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}})
    .then(function(stream){
      _asigCamStream = stream;
      video.srcObject = stream;
      video.play();
      _asigCamInterval = setInterval(function(){
        if(video.readyState < 2) return;
        var canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        var img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        try {
          var code = jsQR(img.data, img.width, img.height);
          if(code && code.data) {
            cerrarCamaraAsignar();
            document.getElementById('asig-qr-inp').value = code.data;
            asignarPorQR();
          }
        } catch(e) {}
      }, 300);
    })
    .catch(function(e){
      toast('⚠️ No se pudo acceder a la cámara: ' + e.message);
      container.style.display = 'none';
    });
}

function cerrarCamaraAsignar() {
  if(_asigCamInterval){ clearInterval(_asigCamInterval); _asigCamInterval = null; }
  if(_asigCamStream){ _asigCamStream.getTracks().forEach(function(t){t.stop();}); _asigCamStream = null; }
  var container = document.getElementById('asig-cam-container');
  if(container) container.style.display = 'none';
}


function abrirAsignarBici(resId, tipo, talla, lineaIdx) {
  _asignarCtx = {resId: resId, tipo: tipo, talla: talla, lineaIdx: lineaIdx};

  // Build bike list filtered by tipo+talla and available states
  var disponibles = bikes.filter(function(b){
    return b.tipo === tipo && b.talla === talla &&
           (b.estado === 'disponible' || b.estado === 'stock' || b.estado === 'asignada');
  });

  var sel = '<select id="asig-bici-sel" style="width:100%;padding:9px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:14px;margin-bottom:12px">';
  sel += '<option value="">-- Elige una bicicleta --</option>';
  disponibles.forEach(function(b){
    var est = BIKE_ESTADOS[b.estado] || {icon:'',lbl:b.estado};
    sel += '<option value="'+b.id+'">'+esc(b.numBici)+' — '+esc(b.modelo||tipo)+' '+esc(b.talla)+' ('+est.icon+' '+est.lbl+')</option>';
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
    + '<input id="asig-qr-inp" placeholder="Nº bici o código QR..." style="flex:1;padding:9px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:14px"/>'
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
  var q = inp.value.trim().toUpperCase();
  var bici = bikes.find(function(b){
    return b.numBici.toUpperCase() === q || (b.qr||'').toUpperCase() === q || (b.numSerie||'').toUpperCase() === q;
  });
  var res = document.getElementById('asig-qr-result');
  if (!bici) {
    if (res) res.innerHTML = '<span style="color:#dc2626">❌ No se encontró ninguna bici con ese código</span>';
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

  // Update reserva in shared reservas
  var reservas = window._sharedReservas || [];
  var res = reservas.find(function(r){ return r.id === ctx.resId; });
  if (!res) { toast('❌ Reserva no encontrada'); return; }

  // Update bikesAsig
  if (!res.bikesAsig) res.bikesAsig = [];
  // Remove previous assignment for this linea tipo+talla
  res.bikesAsig = res.bikesAsig.filter(function(a){
    return !(a.tipo === ctx.tipo && a.talla === ctx.talla);
  });
  res.bikesAsig.push({id: bici.id, num: bici.numBici, tipo: bici.tipo, talla: bici.talla});

  // Update bici estado to 'asignada'
  bici.estado = 'asignada';

  // Save both to Supabase
  DB.saveReserva(res).catch(function(e){ console.error('saveReserva asignar', e); });
  DB.saveBici(bici).catch(function(e){ console.error('saveBici asignar', e); });

  // Update shared cache
  window._sharedReservas = reservas;

  closeM('masignar');
  toast('✅ Bici '+bici.numBici+' asignada a '+esc(res.cliente));
  renderPreparar();
}

function marcarListoParaEntregar(resId){
  // Remove from preparar list
  var ids=[];
  ids = (window._sharedPreparar || []).filter(function(x){return x!==resId;});
  window._sharedPreparar = ids;
  DB.saveConfig('preparar', ids).catch(function(e){console.error('preparar save',e);});
  toast('✅ Reserva lista para entregar');
  renderPreparar();
  updPrepBadge();
}

async function refreshPreparar(){
  // Force fresh read from Supabase
  try {
    window._sharedReservas = await DB.getReservas();
    window._sharedPreparar = await DB.getConfig('preparar', []);
  } catch(e) { console.error('refreshPreparar', e); }
  var n=getPrepararData().length;
  renderPreparar();
  var lbl=document.getElementById('prep-count-lbl');
  if(lbl)lbl.textContent=n?n+' reserva'+(n>1?'s':'')+' pendiente'+(n>1?'s':''):'';
  updPrepBadge();
  toast(n?'🔧 '+n+' reserva'+(n>1?'s':'')+' para preparar':'Sin reservas pendientes');
}
