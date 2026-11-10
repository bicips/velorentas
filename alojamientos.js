// ══════════════════════════════════════════════════════════════
// P16 · ALOJAMIENTOS: valoración de los sitios de entrega y recogida
// ¿Aceptan bicis? ¿Qué tal el trato? Dónde se dejan, teléfono y notas.
// Se guarda en config 'alojamientos'. Solo informa: no toca reservas ni stock.
// ══════════════════════════════════════════════════════════════
var alojamientos=[],_alojCargado=false;
var ALOJ_ACEPTA={si:{lbl:'Acepta bicis',ic:'✅',col:'#15803d',bg:'#dcfce7'},cond:{lbl:'Con condiciones',ic:'⚠️',col:'#b45309',bg:'#fef3c7'},no:{lbl:'No acepta bicis',ic:'⛔',col:'#b91c1c',bg:'#fee2e2'}};

function cargarAlojamientos(){
  if(typeof DB==='undefined'||!DB.getConfig)return Promise.resolve();
  return DB.getConfig('alojamientos',[]).then(function(a){alojamientos=Array.isArray(a)?a:[];_alojCargado=true;_alojDatalist();try{alojInfoForm();if(CV==='aloj')renderAloj();}catch(e){}}).catch(function(e){console.error('aloj',e);});
}
function guardarAlojamientos(){
  _alojDatalist();
  if(typeof DB!=='undefined'&&DB.saveConfig)return DB.saveConfig('alojamientos',alojamientos).catch(function(e){toast('⚠️ No se han podido guardar los alojamientos: '+(e&&e.message||e),6000,'error');});
}
function _alojN(s){return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
// Busca el alojamiento de una dirección (+ lugar) de reserva
function buscarAlojamiento(dir,lugar){
  var d=_alojN(dir),l=_alojN(lugar);if(!d)return null;
  var cands=alojamientos.filter(function(a){
    var n=_alojN(a.nombre),dd=_alojN(a.direccion);
    return (n&&(d===n||(' '+d+' ').indexOf(' '+n+' ')>=0))||(dd&&d===dd);
  });
  if(!cands.length)return null;
  if(l){var mismo=cands.filter(function(a){return !a.lugar||_alojN(a.lugar)===l||d.indexOf(_alojN(a.lugar))>=0;});if(mismo.length)return mismo[0];return null;}
  return cands[0];
}
function _estrellas(n,tam){n=Math.round(n||0);var h='';for(var i=1;i<=5;i++)h+='<span style="color:'+(i<=n?'#f59e0b':'#d1d5db')+';font-size:'+(tam||14)+'px">★</span>';return h;}
function alojBadge(a){
  var ac=ALOJ_ACEPTA[a.acepta];
  return (ac?'<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11.5px;font-weight:800;background:'+ac.bg+';color:'+ac.col+'">'+ac.ic+' '+ac.lbl+'</span>':'<span style="font-size:11.5px;color:#9ca3af">¿Acepta bicis? sin dato</span>')
    +(a.trato?' <span title="Trato: '+a.trato+'/5">'+_estrellas(a.trato,13)+'</span>':'');
}
function _alojDatalist(){
  var dl=document.getElementById('aloj-sugeridos');
  if(!dl){dl=document.createElement('datalist');dl.id='aloj-sugeridos';document.body.appendChild(dl);}
  dl.innerHTML=alojamientos.slice().sort(function(a,b){return String(a.nombre).localeCompare(String(b.nombre));}).map(function(a){return '<option value="'+esc(a.nombre)+'">'+esc(a.lugar||'')+'</option>';}).join('');
  ['r-dir-entrega','r-dir-devolucion'].forEach(function(id){var e=document.getElementById(id);if(e)e.setAttribute('list','aloj-sugeridos');});
}

// ── En Editar reserva: info del sitio debajo de cada dirección ──
function alojInfoForm(){
  [['r-dir-entrega','r-lugar-ini','aloj-info-ent'],['r-dir-devolucion','r-lugar-fin','aloj-info-dev']].forEach(function(c){
    var de=document.getElementById(c[0]),le=document.getElementById(c[1]);if(!de)return;
    var box=document.getElementById(c[2]);
    if(!box){box=document.createElement('div');box.id=c[2];box.style.cssText='margin-top:5px;font-size:12.5px';de.parentNode.appendChild(box);}
    var dir=de.value.trim(),lug=le?le.value.trim():'';
    if(!dir){box.innerHTML='';return;}
    var a=buscarAlojamiento(dir,lug);
    if(a)box.innerHTML='<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:6px 9px;border-radius:8px;background:#f9fafb;border:1px solid #e5e7eb">🏨 <b>'+esc(a.nombre)+'</b>'+(a.lugar?' <span style="color:#6b7280">· '+esc(a.lugar)+'</span>':'')+' '+alojBadge(a)
      +(a.dondeBicis?' <span style="color:#374151">· 🚲 '+esc(a.dondeBicis)+'</span>':'')
      +(a.notas?' <span title="'+esc(a.notas)+'" style="color:#6b7280">· 📝 '+esc(a.notas.length>60?a.notas.slice(0,60)+'…':a.notas)+'</span>':'')
      +' <a href="#" onclick="abrirAloj(\''+a.id+'\');return false" style="margin-left:auto;font-weight:800;color:#2563eb">⭐ Valorar</a></div>';
    else box.innerHTML='<a href="#" onclick="abrirAloj(null,\''+c[0]+'\',\''+c[1]+'\');return false" style="font-weight:700;color:#6b7280">☆ Valorar este sitio (¿acepta bicis?, trato…)</a>';
  });
}
function _alojEngancharForm(){
  ['r-dir-entrega','r-dir-devolucion','r-lugar-ini','r-lugar-fin'].forEach(function(id){var e=document.getElementById(id);if(e&&!e._aloj){e._aloj=1;e.addEventListener('input',alojInfoForm);e.addEventListener('change',function(){
    // al elegir un alojamiento de la lista, rellena el lugar si está vacío
    if(id==='r-dir-entrega'||id==='r-dir-devolucion'){var a=alojamientos.find(function(x){return x.nombre===e.value;});var lid=id==='r-dir-entrega'?'r-lugar-ini':'r-lugar-fin';var le=document.getElementById(lid);
      if(a&&a.lugar&&le&&!le.value.trim())le.value=a.lugar;}
    alojInfoForm();});}});
  _alojDatalist();
}

// ── Ventana de valoración ──
function abrirAloj(id,dirId,lugId){
  var a=id?alojamientos.find(function(x){return String(x.id)===String(id);}):null;
  var nuevo=!a;
  if(!a){a={id:'',nombre:dirId?((document.getElementById(dirId)||{}).value||'').trim():'',lugar:lugId?((document.getElementById(lugId)||{}).value||'').trim():'',direccion:'',tel:'',acepta:'',trato:0,dondeBicis:'',notas:''};}
  var v=document.getElementById('m-aloj');if(!v){v=document.createElement('div');v.id='m-aloj';document.body.appendChild(v);}
  v.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99980;display:flex;align-items:center;justify-content:center;padding:14px';
  var opt=function(k,lbl){var on=a.acepta===k,c=ALOJ_ACEPTA[k];return '<button type="button" data-ac="'+k+'" onclick="_alojAc(\''+k+'\')" style="flex:1;min-width:110px;padding:10px;border-radius:9px;font-weight:800;font-size:13.5px;cursor:pointer;border:2px solid '+(on?c.col:'#e5e7eb')+';background:'+(on?c.bg:'#fff')+';color:'+(on?c.col:'#374151')+'">'+c.ic+' '+lbl+'</button>';};
  var hist=(a.historial||[]).slice(-5).reverse();
  v.innerHTML='<div style="background:#fff;border-radius:14px;width:560px;max-width:100%;max-height:94vh;overflow:auto;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.35)">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div style="font-size:17px;font-weight:800">🏨 '+(nuevo?'Valorar sitio nuevo':'Valorar '+esc(a.nombre))+'</div><button onclick="cerrarAloj()" style="border:none;background:#f3f4f6;border-radius:8px;width:32px;height:32px;cursor:pointer;font-size:16px">✕</button></div>'
    +'<input type="hidden" id="al-id" value="'+esc(a.id)+'"/><input type="hidden" id="al-acepta" value="'+esc(a.acepta||'')+'"/><input type="hidden" id="al-trato" value="'+(a.trato||0)+'"/>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
      +'<div><label class="fl">Nombre *</label><input id="al-nombre" class="fi" value="'+esc(a.nombre)+'" placeholder="Hotel, albergue, pensión…"/></div>'
      +'<div><label class="fl">Lugar</label><input id="al-lugar" class="fi" value="'+esc(a.lugar)+'" placeholder="León, Sarria…" list="lugares-sugeridos"/></div>'
      +'<div><label class="fl">Dirección</label><input id="al-dir" class="fi" value="'+esc(a.direccion)+'" placeholder="Calle, número"/></div>'
      +'<div><label class="fl">Teléfono</label><input id="al-tel" class="fi" value="'+esc(a.tel)+'" type="tel"/></div>'
    +'</div>'
    +'<label class="fl" style="margin-top:12px;display:block">¿Aceptan bicicletas?</label><div id="al-ac-btns" style="display:flex;gap:6px;flex-wrap:wrap">'+opt('si','Sí')+opt('cond','Con condiciones')+opt('no','No')+'</div>'
    +'<label class="fl" style="margin-top:12px;display:block">Trato con el hospedaje</label><div id="al-estrellas" style="display:flex;gap:2px;align-items:center">'
      +[1,2,3,4,5].map(function(i){return '<span onclick="_alojTrato('+i+')" data-st="'+i+'" style="cursor:pointer;font-size:30px;line-height:1;color:'+(i<=(a.trato||0)?'#f59e0b':'#d1d5db')+'">★</span>';}).join('')
      +'<span id="al-trato-txt" style="margin-left:8px;font-size:13px;color:#6b7280">'+(['Sin valorar','Malo','Regular','Normal','Bueno','Muy bueno'][a.trato||0])+'</span></div>'
    +'<label class="fl" style="margin-top:12px;display:block">Dónde se dejan las bicis</label><input id="al-donde" class="fi" value="'+esc(a.dondeBicis)+'" placeholder="Garaje, recepción, cuarto de bicis, patio…"/>'
    +'<label class="fl" style="margin-top:10px;display:block">Notas</label><textarea id="al-notas" class="fi" style="min-height:70px" placeholder="Horario de recepción, persona de contacto, incidencias…">'+esc(a.notas)+'</textarea>'
    +(hist.length?'<div style="margin-top:10px;font-size:12px;color:#6b7280"><b>Últimas valoraciones:</b>'+hist.map(function(h){return '<div>· '+new Date(h.fecha).toLocaleDateString('es-ES')+' — '+(ALOJ_ACEPTA[h.acepta]?ALOJ_ACEPTA[h.acepta].ic+' ':'')+(h.trato?h.trato+'★ ':'')+esc(h.nota||'')+'</div>';}).join('')+'</div>':'')
    +'<div style="display:flex;gap:8px;margin-top:16px">'+(nuevo?'':'<button onclick="borrarAloj(\''+a.id+'\')" style="padding:11px 14px;background:#fff;color:#b91c1c;border:1px solid #fecaca;border-radius:9px;font-weight:700;cursor:pointer">🗑️</button>')
    +'<button onclick="cerrarAloj()" style="flex:1;padding:11px;background:#fff;color:#374151;border:1px solid #d1d5db;border-radius:9px;font-weight:700;cursor:pointer">Cancelar</button>'
    +'<button onclick="guardarAloj()" style="flex:1;padding:11px;background:#0d9488;color:#fff;border:none;border-radius:9px;font-weight:800;cursor:pointer">💾 Guardar</button></div></div>';
  v.onclick=function(ev){if(ev.target===v)cerrarAloj();};
}
function _alojAc(k){var h=document.getElementById('al-acepta');h.value=h.value===k?'':k;
  document.querySelectorAll('#al-ac-btns [data-ac]').forEach(function(b){var on=b.getAttribute('data-ac')===h.value,c=ALOJ_ACEPTA[b.getAttribute('data-ac')];b.style.borderColor=on?c.col:'#e5e7eb';b.style.background=on?c.bg:'#fff';b.style.color=on?c.col:'#374151';});}
function _alojTrato(n){var h=document.getElementById('al-trato');if(+h.value===n)n=0;h.value=n;
  document.querySelectorAll('#al-estrellas [data-st]').forEach(function(s){s.style.color=+s.getAttribute('data-st')<=n?'#f59e0b':'#d1d5db';});
  document.getElementById('al-trato-txt').textContent=['Sin valorar','Malo','Regular','Normal','Bueno','Muy bueno'][n];}
function cerrarAloj(){var v=document.getElementById('m-aloj');if(v)v.remove();}
function guardarAloj(){
  var g=function(id){return (document.getElementById(id).value||'').trim();};
  var nombre=g('al-nombre');if(!nombre){toast('Escribe el nombre del sitio');return;}
  var id=g('al-id'),a=id?alojamientos.find(function(x){return String(x.id)===String(id);}):null;
  if(!a){a={id:'a'+Date.now(),historial:[],creado:new Date().toISOString()};alojamientos.push(a);}
  var antes={acepta:a.acepta||'',trato:a.trato||0,notas:a.notas||''};
  a.nombre=nombre;a.lugar=g('al-lugar');a.direccion=g('al-dir');a.tel=g('al-tel');a.acepta=g('al-acepta');a.trato=parseInt(g('al-trato'))||0;a.dondeBicis=g('al-donde');a.notas=g('al-notas');
  a.actualizado=new Date().toISOString();
  if(antes.acepta!==a.acepta||antes.trato!==a.trato||antes.notas!==a.notas){a.historial=(a.historial||[]).concat([{fecha:a.actualizado,acepta:a.acepta,trato:a.trato,nota:a.notas!==antes.notas?a.notas.slice(0,140):''}]).slice(-20);}
  guardarAlojamientos();cerrarAloj();toast('🏨 '+nombre+' guardado');
  alojInfoForm();if(CV==='aloj')renderAloj();
}
function borrarAloj(id){
  var a=alojamientos.find(function(x){return String(x.id)===String(id);});if(!a)return;
  pedirConfirmacion('¿Borrar este sitio?','Se borrará <b>'+esc(a.nombre)+'</b> y su valoración. Las reservas no cambian.','Borrar',function(){
    alojamientos=alojamientos.filter(function(x){return x!==a;});guardarAlojamientos();cerrarAloj();alojInfoForm();if(CV==='aloj')renderAloj();toast('Sitio borrado');},null,true);
}

// ── Página P16 ──
function _alojUsos(a){
  var n=0;reservas.forEach(function(r){if(buscarAlojamiento(r.dirEntrega,r.lugarIni)===a||buscarAlojamiento(r.dirDevolucion,r.lugarFin)===a)n++;});return n;
}
// Direcciones usadas en reservas que todavía no tienen valoración
function _alojSinValorar(){
  var vistos={},out=[];
  reservas.forEach(function(r){[[r.dirEntrega,r.lugarIni],[r.dirDevolucion,r.lugarFin||'Santiago de Compostela']].forEach(function(p){
    if(!p[0]||!String(p[0]).trim())return;if(buscarAlojamiento(p[0],p[1]))return;
    var k=_alojN(p[0])+'|'+_alojN(p[1]);if(vistos[k]){vistos[k].n++;return;}vistos[k]={dir:String(p[0]).trim(),lugar:String(p[1]||'').trim(),n:1};out.push(vistos[k]);});});
  return out.sort(function(a,b){return b.n-a.n;});
}
var _alojF='all';
function renderAloj(){
  var el=document.getElementById('aloj-content');if(!el)return;
  if(!_alojCargado){el.innerHTML='<div style="padding:24px;color:#6b7280">Cargando…</div>';cargarAlojamientos();return;}
  var q=_alojN((document.getElementById('aloj-srch')||{}).value);
  var lista=alojamientos.filter(function(a){
    if(_alojF!=='all'&&(a.acepta||'')!==(_alojF==='sin'?'':_alojF))return false;
    return !q||_alojN([a.nombre,a.lugar,a.direccion,a.notas,a.dondeBicis].join(' ')).indexOf(q)>=0;
  }).sort(function(a,b){return (_alojN(a.lugar)+_alojN(a.nombre)).localeCompare(_alojN(b.lugar)+_alojN(b.nombre));});
  var tab=function(k,lbl){var on=_alojF===k;return '<button onclick="_alojF=\''+k+'\';renderAloj()" style="padding:6px 11px;border-radius:8px;font-size:12.5px;font-weight:700;cursor:pointer;border:1px solid '+(on?'#111827':'#e5e7eb')+';background:'+(on?'#111827':'#fff')+';color:'+(on?'#fff':'#374151')+'">'+lbl+'</button>';};
  var h='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">'+tab('all','Todos ('+alojamientos.length+')')+tab('si','✅ Aceptan')+tab('cond','⚠️ Con condiciones')+tab('no','⛔ No aceptan')+tab('sin','Sin dato')+'</div>';
  if(!lista.length)h+='<div class="card" style="padding:28px;text-align:center;color:#6b7280">'+(alojamientos.length?'Ningún sitio con este filtro':'Todavía no hay sitios valorados. Pulsa <b>+ Nuevo sitio</b> o valora uno desde Editar reserva.')+'</div>';
  var lugAnt=null;
  lista.forEach(function(a){
    var lg=a.lugar||'Sin lugar';
    if(lg!==lugAnt){lugAnt=lg;h+='<div style="font-size:12px;font-weight:800;color:#6b7280;text-transform:uppercase;margin:12px 0 5px">📍 '+esc(lg)+'</div>';}
    var u=_alojUsos(a),ac=ALOJ_ACEPTA[a.acepta];
    h+='<div class="card" onclick="abrirAloj(\''+a.id+'\')" style="cursor:pointer;padding:11px 14px;margin-bottom:8px;border-left:5px solid '+(ac?ac.col:'#d1d5db')+'">'
      +'<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center"><div style="font-weight:800;font-size:15px">🏨 '+esc(a.nombre)+'</div><div>'+alojBadge(a)+'</div></div>'
      +'<div style="font-size:12.5px;color:#374151;margin-top:4px;display:flex;gap:12px;flex-wrap:wrap">'
        +((a.direccion||a.lugar)&&typeof mapsA==='function'?'<span>'+mapsA(a.direccion||a.lugar,'',[a.nombre,a.direccion,a.lugar].filter(Boolean).join(', '))+'</span>':'')
        +(a.tel?'<a href="tel:'+esc(a.tel)+'" onclick="event.stopPropagation()" style="color:inherit">📞 '+esc(a.tel)+'</a>':'')
        +(a.dondeBicis?'<span>🚲 '+esc(a.dondeBicis)+'</span>':'')
        +'<span style="color:#6b7280">📋 '+u+' reserva'+(u!==1?'s':'')+'</span>'
        +(a.actualizado?'<span style="color:#9ca3af">Valorado el '+new Date(a.actualizado).toLocaleDateString('es-ES')+'</span>':'')
      +'</div>'+(a.notas?'<div style="font-size:12.5px;color:#6b7280;margin-top:4px;white-space:pre-wrap">📝 '+esc(a.notas)+'</div>':'')+'</div>';
  });
  var sv=_alojSinValorar();
  if(sv.length&&_alojF==='all'&&!q){
    h+='<div style="font-size:12px;font-weight:800;color:#6b7280;text-transform:uppercase;margin:18px 0 5px">☆ Sitios de las reservas sin valorar ('+sv.length+')</div>';
    sv.slice(0,30).forEach(function(s,i){h+='<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 12px;border:1px dashed #d1d5db;border-radius:9px;margin-bottom:6px;font-size:13px"><span>'+esc(s.dir)+(s.lugar?' <span style="color:#6b7280">· '+esc(s.lugar)+'</span>':'')+' <span style="color:#9ca3af">('+s.n+' reserva'+(s.n>1?'s':'')+')</span></span><button class="btn bs bxs" onclick="_alojValorarSug('+i+')">☆ Valorar</button></div>';});
  }
  el.innerHTML=h;
}
function _alojValorarSug(i){var s=_alojSinValorar()[i];if(!s)return;abrirAloj(null);document.getElementById('al-nombre').value=s.dir;document.getElementById('al-lugar').value=s.lugar;}

// ── Enganches ──
(function(){
  var ini=function(){
    try{
      if(typeof VTITLES!=='undefined')VTITLES.aloj='Alojamientos';
      if(typeof goV==='function'&&!goV._aloj){var _g=goV;goV=function(v){var r=_g.apply(this,arguments);if(v==='aloj')renderAloj();return r;};goV._aloj=1;}
      ['openEditRes','openNewRes'].forEach(function(fn){if(typeof window[fn]==='function'&&!window[fn]._aloj){var o=window[fn];window[fn]=function(){var r=o.apply(this,arguments);try{_alojEngancharForm();alojInfoForm();}catch(e){}return r;};window[fn]._aloj=1;}});
      _alojEngancharForm();
    }catch(e){console.error('aloj init',e);}
    // los datos se cargan cuando ya está la app arrancada
    var n=0,t=setInterval(function(){n++;if((typeof reservas!=='undefined'&&reservas.length)||n>20){clearInterval(t);cargarAlojamientos();}},500);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(ini,0);});else setTimeout(ini,0);
})();
