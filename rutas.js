// ══════════════════════════════════════════════════════════════
// P16 · RUTAS: ENTREGAS Y RECOGIDAS
// Programar hora y responsable, seleccionar las reservas/bicis de
// una ruta y abrirla en Google Maps ordenada automáticamente.
// Solo organiza: NO toca stock, disponibilidad ni asignación de bicis.
// ══════════════════════════════════════════════════════════════
var _rt={modo:'ent',desde:null,dias:1,sel:{},orden:null,manual:false};

// Coordenadas aproximadas de lugares habituales (solo para ordenar las paradas;
// la ruta real la calcula Google Maps)
var RT_GEO={
 'mondonedo':[43.428,-7.363],'santiago de compostela':[42.881,-8.545],'santiago':[42.881,-8.545],
 'saint-jean-pied-de-port':[43.163,-1.238],'saint jean':[43.163,-1.238],'roncesvalles':[43.009,-1.319],'pamplona':[42.813,-1.646],
 'logrono':[42.465,-2.445],'burgos':[42.344,-3.697],'sahagun':[42.371,-5.029],'leon':[42.599,-5.567],'astorga':[42.459,-6.056],
 'ponferrada':[42.550,-6.598],'villafranca del bierzo':[42.606,-6.811],'o cebreiro':[42.708,-7.042],'cebreiro':[42.708,-7.042],
 'triacastela':[42.756,-7.239],'samos':[42.731,-7.326],'sarria':[42.781,-7.414],'portomarin':[42.808,-7.616],'palas de rei':[42.873,-7.869],
 'melide':[42.914,-8.014],'arzua':[42.926,-8.163],'o pedrouzo':[42.905,-8.360],'lugo':[43.010,-7.557],'ourense':[42.336,-7.864],
 'a gudina':[42.060,-7.139],'verin':[41.941,-7.436],'xinzo de limia':[42.063,-7.725],'cea':[42.464,-7.988],'silleda':[42.696,-8.247],
 'tui':[42.047,-8.645],'valenca':[42.028,-8.633],'porto':[41.158,-8.629],'oporto':[41.158,-8.629],'lisboa':[38.722,-9.139],
 'vigo':[42.241,-8.721],'redondela':[42.283,-8.610],'pontevedra':[42.431,-8.644],'caldas de reis':[42.605,-8.643],'padron':[42.739,-8.660],
 'ferrol':[43.483,-8.237],'a coruna':[43.362,-8.412],'coruna':[43.362,-8.412],'betanzos':[43.280,-8.211],'pontedeume':[43.408,-8.171],
 'oviedo':[43.361,-5.849],'gijon':[43.532,-5.661],'aviles':[43.556,-5.925],'llanes':[43.420,-4.755],'ribadesella':[43.462,-5.059],
 'luarca':[43.543,-6.536],'navia':[43.540,-6.720],'tapia de casariego':[43.570,-6.944],'ribadeo':[43.536,-7.041],'lourenza':[43.471,-7.298],
 'abadin':[43.367,-7.473],'vilalba':[43.296,-7.681],'baamonde':[43.175,-7.758],'sobrado':[43.039,-8.028],'lugo ciudad':[43.010,-7.557],
 'irun':[43.339,-1.789],'san sebastian':[43.318,-1.981],'donostia':[43.318,-1.981],'bilbao':[43.263,-2.935],'santander':[43.462,-3.810],
 'grandas de salime':[43.217,-6.877],'fonsagrada':[43.124,-7.068],'a fonsagrada':[43.124,-7.068],'tineo':[43.337,-6.415],
 'salamanca':[40.970,-5.664],'zamora':[41.503,-5.747],'merida':[38.916,-6.344],'sevilla':[37.389,-5.985],
 'fisterra':[42.908,-9.264],'finisterre':[42.908,-9.264],'muxia':[43.103,-9.217],'negreira':[42.909,-8.736],'muros':[42.776,-9.060],
 'cambados':[42.513,-8.814],'vilagarcia de arousa':[42.594,-8.766],'a guarda':[41.902,-8.874],'baiona':[42.118,-8.850]
};
function _rtNorm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9 \-]/g,' ').replace(/\s+/g,' ').trim();}
var _rtClaves=null;
function rtGeo(txt){
  var n=' '+_rtNorm(txt)+' ';if(!n.trim())return null;
  if(!_rtClaves)_rtClaves=Object.keys(RT_GEO).sort(function(a,b){return b.length-a.length;});
  for(var i=0;i<_rtClaves.length;i++){if(n.indexOf(' '+_rtClaves[i]+' ')>=0)return RT_GEO[_rtClaves[i]];}
  return null;
}
function _rtKm(a,b){var R=6371,r=Math.PI/180,dl=(b[0]-a[0])*r,dg=(b[1]-a[1])*r;var x=Math.sin(dl/2)*Math.sin(dl/2)+Math.cos(a[0]*r)*Math.cos(b[0]*r)*Math.sin(dg/2)*Math.sin(dg/2);return 2*R*Math.asin(Math.sqrt(x));}

function _rtLS(k,d){try{var v=localStorage.getItem('vr_rt_'+k);return v==null?d:v;}catch(e){return d;}}
function _rtLSset(k,v){try{localStorage.setItem('vr_rt_'+k,v);}catch(e){}}
function rtOrigen(){return _rt.modo==='ent'?_rtLS('origen_ent','Mondoñedo, Lugo'):_rtLS('origen_rec','Mondoñedo, Lugo');}
function rtVolver(){return _rtLS('volver_'+_rt.modo,'1')==='1';}

function _rtCampo(){return _rt.modo==='ent'?'rutaEnt':'rutaRec';}
function _rtFecha(r){return _rt.modo==='ent'?r.ini:r.fin;}
function rtDireccion(r){return _rt.modo==='ent'?(r.dirEntrega||r.lugarIni||''):(r.dirDevolucion||r.lugarFin||'Santiago de Compostela');}
function rtLugar(r){return _rt.modo==='ent'?(r.lugarIni||''):(r.lugarFin||'Santiago de Compostela');}
function rtBicis(r){
  var ls=typeof _lineasRes==='function'?_lineasRes(r):(r.lineas||[]);var n=0,txt=[];
  ls.forEach(function(l){if(!l)return;var u=l.uds||1;n+=u;var t=tipos[l.tipo]||{icon:'🚲',label:l.tipo};
    txt.push(t.icon+' '+esc(t.label)+' '+esc(l.talla||'')+(u>1?' x'+u:'')+(l.bikeAsig?' · <b>'+esc(l.bikeAsig.num)+'</b>':''));});
  return {n:n,html:txt.join('<br>')};
}
function rtReservas(){
  var d0=_rt.desde,d1=addD(d0,_rt.dias-1);
  var fuera=['pendiente','cancelada','anulada'];
  return reservas.filter(function(r){
    if(!r||fuera.indexOf(r.estado)>=0)return false;
    if(r.estado==='pendiente')return false;
    var f=_rtFecha(r);return f&&f>=d0&&f<=d1;
  }).sort(function(a,b){var fa=_rtFecha(a),fb=_rtFecha(b);if(fa!==fb)return fa<fb?-1:1;
    var ha=(a[_rtCampo()]||{}).hora||'99',hb=(b[_rtCampo()]||{}).hora||'99';return ha<hb?-1:ha>hb?1:0;});
}
function _rtQuienes(){
  var s={'Furgo':1,'Carlos':1,'Seur':1};
  reservas.forEach(function(r){['rutaEnt','rutaRec'].forEach(function(c){if(r[c]&&r[c].quien)s[r[c].quien]=1;});});
  return Object.keys(s);
}

// ── Paradas y orden automático ──
function rtParadas(){
  var por={},lista=[];
  reservas.forEach(function(r){
    if(!_rt.sel[r.id])return;
    var dir=rtDireccion(r);var k=_rtNorm(dir)||('r'+r.id);
    if(!por[k]){por[k]={key:k,dir:dir,geo:rtGeo(dir)||rtGeo(rtLugar(r)),res:[],bicis:0};lista.push(por[k]);}
    por[k].res.push(r);por[k].bicis+=rtBicis(r).n;
  });
  return lista;
}
function rtOrdenar(paradas){
  var o=rtGeo(rtOrigen())||RT_GEO.mondonedo,volver=rtVolver();
  var con=paradas.filter(function(p){return p.geo;}),sin=paradas.filter(function(p){return !p.geo;});
  // vecino más cercano
  var ruta=[],pend=con.slice(),cur=o;
  while(pend.length){var bi=0,bd=1e9;pend.forEach(function(p,i){var d=_rtKm(cur,p.geo);if(d<bd){bd=d;bi=i;}});cur=pend[bi].geo;ruta.push(pend.splice(bi,1)[0]);}
  // mejora 2-opt
  var dist=function(r){var t=0,c=o;r.forEach(function(p){t+=_rtKm(c,p.geo);c=p.geo;});if(volver)t+=_rtKm(c,o);return t;};
  var mejor=true,it=0;
  while(mejor&&it<50){mejor=false;it++;
    for(var i=0;i<ruta.length-1;i++)for(var j=i+1;j<ruta.length;j++){
      var nv=ruta.slice(0,i).concat(ruta.slice(i,j+1).reverse(),ruta.slice(j+1));
      if(dist(nv)+0.01<dist(ruta)){ruta=nv;mejor=true;}
    }}
  return ruta.concat(sin);
}
function _rtParadasOrdenadas(){
  var ps=rtParadas(),map={};ps.forEach(function(p){map[p.key]=p;});
  if(_rt.manual&&_rt.orden){
    var res=[];_rt.orden.forEach(function(k){if(map[k]){res.push(map[k]);delete map[k];}});
    Object.keys(map).forEach(function(k){res.push(map[k]);});_rt.orden=res.map(function(p){return p.key;});return res;
  }
  var o=rtOrdenar(ps);_rt.orden=o.map(function(p){return p.key;});return o;
}
function rtKmTotal(ps){
  var o=rtGeo(rtOrigen())||RT_GEO.mondonedo,t=0,c=o,ok=true;
  ps.forEach(function(p){if(!p.geo){ok=false;return;}t+=_rtKm(c,p.geo);c=p.geo;});
  if(rtVolver())t+=_rtKm(c,o);return ok?Math.round(t*1.25):null; // ×1,25 aprox. por carretera
}

// ── Google Maps ──
function _rtMax(){return (window.matchMedia&&window.matchMedia('(max-width: 820px)').matches)?3:9;} // Maps admite 3 paradas intermedias en móvil y 9 en ordenador
function rtTramos(){
  var ps=_rtParadasOrdenadas();if(!ps.length)return [];
  var pts=ps.map(function(p){return p.dir;});var ori=rtOrigen();
  if(rtVolver())pts.push(ori);
  var max=_rtMax(),tramos=[],ini=ori;
  while(pts.length){var trozo=pts.splice(0,max+1);var dest=trozo.pop();
    var u='https://www.google.com/maps/dir/?api=1&travelmode=driving&origin='+encodeURIComponent(ini)+'&destination='+encodeURIComponent(dest);
    if(trozo.length)u+='&waypoints='+trozo.map(encodeURIComponent).join('%7C');
    tramos.push({url:u,desde:ini,hasta:dest,n:trozo.length+1});ini=dest;}
  return tramos;
}
function rtAbrirMaps(i){var t=rtTramos();if(!t.length){toast('Selecciona al menos una reserva');return;}window.open(t[i||0].url,'_blank','noopener');}

// ── Acciones ──
function rtModo(m){_rt.modo=m;_rt.sel={};_rt.manual=false;renderRutas();}
function rtDia(n){_rt.desde=addD(_rt.desde,n);renderRutas();}
function rtSetDesde(v){if(v){_rt.desde=v;renderRutas();}}
function rtSetDias(v){_rt.dias=parseInt(v)||1;renderRutas();}
function rtToggle(id,on){if(on)_rt.sel[id]=1;else delete _rt.sel[id];if(!_rt.manual)_rt.orden=null;renderRutas();}
function rtSelTodas(on){rtReservas().forEach(function(r){if(on&&!(r[_rtCampo()]||{}).hecha)_rt.sel[r.id]=1;else delete _rt.sel[r.id];});renderRutas();}
function rtSelQuien(q){_rt.sel={};rtReservas().forEach(function(r){var p=r[_rtCampo()]||{};if(p.quien===q&&!p.hecha)_rt.sel[r.id]=1;});_rt.manual=false;renderRutas();}
function rtMover(k,d){var o=_rt.orden||[];var i=o.indexOf(k),j=i+d;if(i<0||j<0||j>=o.length)return;var t=o[i];o[i]=o[j];o[j]=t;_rt.manual=true;renderRutas();}
function rtAuto(){_rt.manual=false;_rt.orden=null;renderRutas();toast('Ruta ordenada automáticamente');}
function rtSetOrigen(v){_rtLSset(_rt.modo==='ent'?'origen_ent':'origen_rec',v.trim()||'Mondoñedo, Lugo');if(!_rt.manual)_rt.orden=null;renderRutas();}
function rtSetVolver(on){_rtLSset('volver_'+_rt.modo,on?'1':'0');renderRutas();}
function _rtGuardar(r){if(typeof DB!=='undefined'&&DB.saveReserva)DB.saveReserva(r).catch(function(e){toast('⚠️ No se ha podido guardar: '+(e&&e.message||e),6000,'error');});}
function rtSet(id,campo,valor){
  var r=reservas.find(function(x){return String(x.id)===String(id);});if(!r)return;
  var c=_rtCampo();r[c]=Object.assign({},r[c]||{});r[c][campo]=valor;
  if(campo==='hecha')r[c].hechaTs=valor?new Date().toISOString():null;
  _rtGuardar(r);if(campo!=='hora')renderRutas();
}
function rtAsignarQuien(){
  var q=(document.getElementById('rt-quien-sel')||{}).value;q=(q||'').trim();
  var ids=Object.keys(_rt.sel);if(!ids.length){toast('Selecciona primero las reservas');return;}
  if(!q){toast('Escribe quién hace la ruta');return;}
  ids.forEach(function(id){var r=reservas.find(function(x){return String(x.id)===String(id);});if(!r)return;var c=_rtCampo();r[c]=Object.assign({},r[c]||{},{quien:q});_rtGuardar(r);});
  toast('Ruta asignada a '+q);renderRutas();
}
function rtImprimir(){
  var ps=_rtParadasOrdenadas();if(!ps.length){toast('Selecciona al menos una reserva');return;}
  var tit=(_rt.modo==='ent'?'Ruta de entregas':'Ruta de recogidas')+' · '+fmtD(_rt.desde)+(_rt.dias>1?' – '+fmtD(addD(_rt.desde,_rt.dias-1)):'');
  var h='<html><head><meta charset="utf-8"><title>'+tit+'</title><style>body{font-family:Arial,sans-serif;padding:18px}td,th{border:1px solid #999;padding:6px;font-size:13px;vertical-align:top}table{border-collapse:collapse;width:100%}</style></head><body>'
    +'<h2>'+tit+'</h2><p>Salida: <b>'+esc(rtOrigen())+'</b>'+(rtVolver()?' · vuelta al punto de salida':'')+'</p><table><tr><th>#</th><th>Dirección</th><th>Cliente / hora</th><th>Bicis</th><th>✔</th></tr>';
  ps.forEach(function(p,i){h+='<tr><td>'+(i+1)+'</td><td>'+esc(p.dir)+'</td><td>'+p.res.map(function(r){var x=r[_rtCampo()]||{};return esc(r.cliente)+(x.hora?' · '+esc(x.hora):'')+(r.tel?' · '+esc(r.tel):'');}).join('<br>')+'</td><td>'+p.res.map(function(r){return rtBicis(r).html;}).join('<br>')+'</td><td style="width:30px"></td></tr>';});
  h+='</table></body></html>';
  var w=window.open('','_blank');if(!w){toast('Permite ventanas emergentes para imprimir');return;}w.document.write(h);w.document.close();w.focus();setTimeout(function(){w.print();},300);
}

// ── Pantalla ──
function renderRutas(){
  var el=document.getElementById('rutas-content');if(!el)return;
  if(!_rt.desde)_rt.desde=todayS();
  var ent=_rt.modo==='ent',c=_rtCampo();
  var lista=rtReservas();
  // quita de la selección lo que ya no está en la lista
  var vis={};lista.forEach(function(r){vis[r.id]=1;});Object.keys(_rt.sel).forEach(function(id){if(!vis[id])delete _rt.sel[id];});
  var quienes=_rtQuienes();
  var tab=function(m,lbl){var on=_rt.modo===m;return '<button onclick="rtModo(\''+m+'\')" style="padding:9px 16px;border-radius:9px;font-weight:800;font-size:14px;cursor:pointer;border:2px solid '+(on?'#0d9488':'#e5e7eb')+';background:'+(on?'#0d9488':'#fff')+';color:'+(on?'#fff':'#374151')+'">'+lbl+'</button>';};
  var h='<datalist id="rt-quienes">'+quienes.map(function(q){return '<option value="'+esc(q)+'"/>';}).join('')+'</datalist>';
  h+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">'+tab('ent','📦 Entregas')+tab('rec','↩️ Recogidas')+'</div>';
  h+='<div class="card" style="padding:12px 14px;margin-bottom:12px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">'
    +'<button class="btn btn-secondary btn-sm" onclick="rtDia(-1)">◀</button><input type="date" class="fi" value="'+_rt.desde+'" onchange="rtSetDesde(this.value)" style="width:auto"/><button class="btn btn-secondary btn-sm" onclick="rtDia(1)">▶</button>'
    +'<select class="fi" onchange="rtSetDias(this.value)" style="width:auto">'+[[1,'Solo ese día'],[2,'2 días'],[3,'3 días'],[7,'7 días']].map(function(o){return '<option value="'+o[0]+'"'+(_rt.dias===o[0]?' selected':'')+'>'+o[1]+'</option>';}).join('')+'</select>'
    +'<span style="font-size:13px;color:#6b7280">'+(ent?'Entregas = día de inicio de la reserva':'Recogidas = día de fin de la reserva')+'</span></div>';
  // lista
  h+='<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start"><div style="flex:3;min-width:300px">';
  h+='<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px"><div style="font-weight:800">'+lista.length+' '+(ent?'entrega':'recogida')+(lista.length!==1?'s':'')+'</div>'
    +'<div style="display:flex;gap:6px;flex-wrap:wrap">'+(Object.keys(_rt.sel).length?'<button class="btn btn-primary btn-sm" onclick="document.getElementById(\'rt-panel\').scrollIntoView({behavior:\'smooth\'})">🗺️ Ver ruta ('+Object.keys(_rt.sel).length+')</button>':'')+'<button class="btn btn-secondary btn-sm" onclick="rtSelTodas(true)">☑ Todas las pendientes</button><button class="btn btn-secondary btn-sm" onclick="rtSelTodas(false)">☐ Ninguna</button>'
    +quienes.filter(function(q){return lista.some(function(r){return (r[c]||{}).quien===q;});}).map(function(q){return '<button class="btn btn-secondary btn-sm" onclick="rtSelQuien(\''+esc(q).replace(/'/g,"\\'")+'\')">👤 '+esc(q)+'</button>';}).join('')+'</div></div>';
  if(!lista.length)h+='<div class="card" style="padding:28px;text-align:center;color:#6b7280">No hay '+(ent?'entregas':'recogidas')+' en estas fechas</div>';
  var diaAnt='';
  lista.forEach(function(r){
    var f=_rtFecha(r),p=r[c]||{},sel=!!_rt.sel[r.id],b=rtBicis(r),dir=rtDireccion(r);
    if(f!==diaAnt){diaAnt=f;h+='<div style="font-size:12px;font-weight:800;color:#6b7280;text-transform:uppercase;margin:10px 0 4px">📅 '+toD(f).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})+'</div>';}
    h+='<div class="card" style="padding:10px 12px;margin-bottom:8px;display:flex;gap:10px;align-items:flex-start;border:2px solid '+(p.hecha?'#22c55e':sel?'#0d9488':'#e5e7eb')+';background:'+(p.hecha?'#f0fdf4':'#fff')+'">'
      +'<input type="checkbox" '+(sel?'checked':'')+' onchange="rtToggle('+r.id+',this.checked)" style="width:22px;height:22px;margin-top:2px;flex-shrink:0;cursor:pointer" title="Incluir en la ruta"/>'
      +'<div style="flex:1;min-width:0">'
        +'<div style="display:flex;justify-content:space-between;gap:6px;flex-wrap:wrap"><div style="font-weight:800;font-size:15px;cursor:pointer" onclick="openEditRes('+r.id+')" title="Abrir reserva">'+esc(r.cliente)+(r.tel?' <span style="font-weight:600;color:#6b7280;font-size:12.5px">· <a href="tel:'+esc(r.tel)+'" onclick="event.stopPropagation()" style="color:inherit">📞 '+esc(r.tel)+'</a></span>':'')+'</div>'
        +(p.hecha?'<span style="color:#15803d;font-weight:900;font-size:13px">✅ Hecha</span>':'')+'</div>'
        +'<div style="font-size:13px;margin:3px 0">'+(ent?'🚚 ':'↩️ ')+mapsA(dir,'<span style="color:#d97706">⚠️ Sin dirección</span>')+(dir&&!rtGeo(dir)&&!rtGeo(rtLugar(r))?' <span style="font-size:11px;color:#d97706" title="No sé dónde está: ordénala a mano en la ruta">(sin ubicar)</span>':'')+'</div>'
        +'<div style="font-size:12.5px;color:#374151">'+b.html+'</div>'
        +'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:7px;align-items:center">'
          +'<input type="time" class="fi" value="'+esc(p.hora||'')+'" onchange="rtSet('+r.id+',\'hora\',this.value)" style="width:auto;padding:5px 8px" title="Hora"/>'
          +'<input class="fi" list="rt-quienes" value="'+esc(p.quien||'')+'" placeholder="¿Quién?" onchange="rtSet('+r.id+',\'quien\',this.value.trim())" style="width:130px;padding:5px 8px"/>'
          +'<button class="btn btn-sm '+(p.hecha?'btn-secondary':'btn-success')+'" onclick="rtSet('+r.id+',\'hecha\','+(!p.hecha)+')">'+(p.hecha?'↺ Deshacer':'✅ Hecha')+'</button>'
        +'</div></div></div>';
  });
  h+='</div>';
  // panel ruta
  var ps=_rtParadasOrdenadas(),nb=ps.reduce(function(s,p){return s+p.bicis;},0),km=rtKmTotal(ps),tr=rtTramos();
  h+='<div style="flex:2;min-width:280px;position:sticky;top:10px"><div id="rt-panel" class="card" style="padding:14px;border:2px solid #0d9488">'
    +'<div style="font-weight:900;font-size:16px;margin-bottom:8px">🗺️ Ruta de '+(ent?'entregas':'recogidas')+'</div>'
    +'<label style="font-size:11px;font-weight:800;color:#6b7280;text-transform:uppercase">Salida</label>'
    +'<input class="fi" value="'+esc(rtOrigen())+'" onchange="rtSetOrigen(this.value)" list="rt-origenes" style="margin:3px 0 6px"/><datalist id="rt-origenes"><option value="Mondoñedo, Lugo"/><option value="Santiago de Compostela"/></datalist>'
    +'<label style="font-size:13px;display:flex;gap:6px;align-items:center;margin-bottom:10px;cursor:pointer"><input type="checkbox" '+(rtVolver()?'checked':'')+' onchange="rtSetVolver(this.checked)"/> Volver al punto de salida</label>';
  if(!ps.length)h+='<div style="color:#6b7280;font-size:13px;padding:10px 0">Marca las reservas que van en esta ruta y se ordenan solas.</div>';
  else{
    h+='<div style="font-size:13px;margin-bottom:8px"><b>'+ps.length+'</b> parada'+(ps.length>1?'s':'')+' · <b>🚲 '+nb+'</b> bici'+(nb!==1?'s':'')+(km?' · ~'+km+' km':'')+'</div>';
    h+='<div style="font-size:12.5px;padding:6px 8px;background:#f0fdfa;border-radius:6px;margin-bottom:4px">🏠 '+esc(rtOrigen())+'</div>';
    ps.forEach(function(p,i){
      h+='<div style="display:flex;gap:6px;align-items:center;padding:6px 8px;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:4px;font-size:13px">'
        +'<span style="background:#0d9488;color:#fff;border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0">'+(i+1)+'</span>'
        +'<div style="flex:1;min-width:0"><div style="font-weight:700;overflow:hidden;text-overflow:ellipsis">'+esc(p.dir)+(p.geo?'':' <span style="color:#d97706;font-size:11px">(sin ubicar)</span>')+'</div><div style="font-size:11.5px;color:#6b7280">'+p.res.map(function(r){var x=r[c]||{};return esc(r.cliente)+(x.hora?' '+esc(x.hora):'');}).join(', ')+' · 🚲 '+p.bicis+'</div></div>'
        +'<button class="btn btn-secondary btn-sm" style="padding:2px 7px" onclick="rtMover(\''+p.key.replace(/'/g,"\\'")+'\',-1)" '+(i?'':'disabled')+'>↑</button>'
        +'<button class="btn btn-secondary btn-sm" style="padding:2px 7px" onclick="rtMover(\''+p.key.replace(/'/g,"\\'")+'\',1)" '+(i<ps.length-1?'':'disabled')+'>↓</button></div>';
    });
    if(rtVolver())h+='<div style="font-size:12.5px;padding:6px 8px;background:#f0fdfa;border-radius:6px;margin-bottom:8px">🏠 Vuelta a '+esc(rtOrigen())+'</div>';
    if(_rt.manual)h+='<button class="btn btn-secondary btn-sm" style="width:100%;margin-bottom:6px" onclick="rtAuto()">🔁 Ordenar automáticamente</button>';
    if(tr.length===1)h+='<button class="btn btn-primary" style="width:100%;margin:4px 0;font-size:15px;padding:11px" onclick="rtAbrirMaps(0)">🗺️ Abrir ruta en Google Maps</button>';
    else{h+='<div style="font-size:12px;color:#6b7280;margin:4px 0">Google Maps admite '+_rtMax()+' paradas intermedias por ruta en este dispositivo: la ruta se abre en '+tr.length+' tramos.</div>';
      tr.forEach(function(t,i){h+='<button class="btn btn-primary btn-sm" style="width:100%;margin:3px 0;white-space:normal;text-align:left;height:auto;line-height:1.3" onclick="rtAbrirMaps('+i+')">🗺️ Tramo '+(i+1)+': '+esc(t.desde)+' → '+esc(t.hasta)+'</button>';});}
    h+='<div style="display:flex;gap:6px;margin-top:8px"><input id="rt-quien-sel" class="fi" list="rt-quienes" placeholder="¿Quién hace la ruta?" style="flex:1;padding:6px 8px"/><button class="btn btn-secondary btn-sm" onclick="rtAsignarQuien()">👤 Asignar</button></div>'
      +'<button class="btn btn-secondary btn-sm" style="width:100%;margin-top:6px" onclick="rtImprimir()">🖨️ Imprimir hoja de ruta</button>'
      +'<div style="font-size:11px;color:#9ca3af;margin-top:8px">El orden es automático por cercanía. Google Maps calcula el recorrido real. Puedes moverlas con ↑ ↓.</div>';
  }
  h+='</div></div></div>';
  el.innerHTML=h;
}
