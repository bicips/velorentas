// ══════════════════════════════════════════════════════════════
// Enviar WhatsApp / correo al cliente desde la reserva
// Abre WhatsApp (wa.me) o el correo (mailto) con el texto ya escrito.
// ══════════════════════════════════════════════════════════════
var _msg={datos:null,resId:null};

function telWhatsApp(t){
  var s=String(t||'').trim();if(!s)return '';
  var d=s.replace(/[^\d+]/g,'');
  if(d.indexOf('+')===0)d=d.slice(1);else if(d.indexOf('00')===0)d=d.slice(2);
  d=d.replace(/\D/g,'');
  if(d.length===9&&/^[6789]/.test(d))d='34'+d; // número español sin prefijo
  return d;
}
function _msgBicis(ls){
  var g={},orden=[];
  (ls||[]).forEach(function(l){if(!l||!l.tipo)return;var k=l.tipo+'|'+(l.talla||'');if(!g[k]){g[k]=0;orden.push(k);}g[k]+=(l.uds||1);});
  return orden.map(function(k){var p=k.split('|'),t=tipos[p[0]]||{label:p[0]};return (g[k]>1?g[k]+' × ':'')+t.label+' ('+p[1]+')';}).join(', ');
}
// Datos de la reserva: desde el formulario de Editar (aunque no esté guardada) o desde la reserva guardada
function _msgDatosForm(){
  var g=function(id){var e=document.getElementById(id);return e?String(e.value||'').trim():'';};
  var d={cliente:g('r-nom'),tel:g('r-tel'),email:g('r-email'),ini:g('r-ini'),fin:g('r-fin'),lugarIni:g('r-lugar-ini'),lugarFin:g('r-lugar-fin')||'Santiago de Compostela',
    dirEntrega:g('r-dir-entrega'),dirDevolucion:g('r-dir-devolucion'),total:parseFloat(g('r-total'))||0,bicis:_msgBicis(typeof lineas!=='undefined'?lineas:[])};
  var eid=g('r-eid');d.id=eid?parseInt(eid):null;return d;
}
function _msgDatosRes(r){
  return {id:r.id,cliente:r.cliente||'',tel:r.tel||'',email:r.email||'',ini:r.ini,fin:r.fin,lugarIni:r.lugarIni||'',lugarFin:r.lugarFin||'Santiago de Compostela',
    dirEntrega:r.dirEntrega||'',dirDevolucion:r.dirDevolucion||'',total:r.total||r.precio||0,bicis:_msgBicis(typeof _lineasRes==='function'?_lineasRes(r):(r.lineas||[]))};
}
function _fmtL(d,en){if(!d)return '-';return toD(d).toLocaleDateString(en?'en-GB':'es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'});}
function _nombrePila(n){return String(n||'').trim().split(/\s+/)[0]||'';}

var MSG_PLANTILLAS=[
 {id:'libre',lbl:'✍️ Mensaje libre'},
 {id:'presupuesto',lbl:'⏳ Presupuesto'},
 {id:'confirmacion',lbl:'✅ Reserva confirmada'},
 {id:'entrega',lbl:'🚚 Aviso de entrega'},
 {id:'devolucion',lbl:'↩️ Aviso de recogida / devolución'},
 {id:'gracias',lbl:'🙏 Gracias / fin del Camino'}
];
function textoPlantilla(id,d,en){
  var emp=(typeof cfg!=='undefined'&&cfg.bizName)||'Bicips';
  var tel=(typeof cfg!=='undefined'&&cfg.phone)||'';
  var cur=(typeof cfg!=='undefined'&&cfg.currency)||'€';
  var hola=(en?'Hello ':'Hola ')+_nombrePila(d.cliente)+',';
  var dirE=typeof dirCompleta==='function'?dirCompleta(d.dirEntrega,d.lugarIni):(d.dirEntrega||d.lugarIni);
  var dirD=typeof dirCompleta==='function'?dirCompleta(d.dirDevolucion,d.lugarFin):(d.dirDevolucion||d.lugarFin);
  var firma='\n\n'+(en?'Best regards,':'Un saludo,')+'\n'+emp+(tel?'\n'+tel:'');
  var res=en
    ?'\n\n🚲 Bikes: '+(d.bicis||'-')+'\n📅 From '+_fmtL(d.ini,1)+' to '+_fmtL(d.fin,1)+'\n📍 Start: '+(d.lugarIni||'-')+'\n🏁 Finish: '+(d.lugarFin||'-')+(d.total?'\n💶 Total: '+d.total+' '+cur:'')
    :'\n\n🚲 Bicis: '+(d.bicis||'-')+'\n📅 Del '+_fmtL(d.ini)+' al '+_fmtL(d.fin)+'\n📍 Inicio: '+(d.lugarIni||'-')+'\n🏁 Final: '+(d.lugarFin||'-')+(d.total?'\n💶 Total: '+d.total+' '+cur:'');
  switch(id){
    case 'presupuesto':return en?hola+'\n\nThank you for your interest in cycling the Camino de Santiago with us. Here is your quote:'+res+'\n\nThe bikes are held for you for a limited time. Let us know if you want to confirm the booking.'+firma
                             :hola+'\n\nGracias por contar con nosotros para hacer el Camino de Santiago en bici. Te paso el presupuesto:'+res+'\n\nTe guardamos las bicis durante un tiempo limitado. Dinos si quieres confirmar la reserva.'+firma;
    case 'confirmacion':return en?hola+'\n\nYour booking is confirmed! ✅'+res+(dirE?'\n\n🚚 Delivery: '+dirE:'')+(dirD?'\n↩️ Return: '+dirD:'')+'\n\nIf anything changes, just write to us.'+firma
                              :hola+'\n\n¡Tu reserva está confirmada! ✅'+res+(dirE?'\n\n🚚 Entrega: '+dirE:'')+(dirD?'\n↩️ Devolución: '+dirD:'')+'\n\nSi cambia algo, escríbenos.'+firma;
    case 'entrega':return en?hola+'\n\nWe will deliver your bikes on '+_fmtL(d.ini,1)+(dirE?' at:\n📍 '+dirE:'')+'.\n\n🚲 '+(d.bicis||'')+'\n\nPlease confirm the address and let us know if you need anything else (pedals, saddle height…).'+firma
                         :hola+'\n\nTe entregamos las bicis el '+_fmtL(d.ini)+(dirE?' en:\n📍 '+dirE:'')+'.\n\n🚲 '+(d.bicis||'')+'\n\nConfírmanos la dirección y dinos si necesitas algo más (pedales, altura del sillín…).'+firma;
    case 'devolucion':return en?hola+'\n\nWe hope you are enjoying the Camino! 🚴 We will pick up the bikes on '+_fmtL(d.fin,1)+(dirD?' at:\n📍 '+dirD:'')+'.\n\nPlease remember to return all the accessories that came with the bikes.'+firma
                            :hola+'\n\n¡Esperamos que estés disfrutando del Camino! 🚴 Recogemos las bicis el '+_fmtL(d.fin)+(dirD?' en:\n📍 '+dirD:'')+'.\n\nRecuerda devolver todos los accesorios que iban con las bicis.'+firma;
    case 'gracias':return en?hola+'\n\nCongratulations on reaching Santiago! 🎉 Thank you for travelling with '+emp+'. We would love to hear how it went, and a review would help us a lot.'+firma
                         :hola+'\n\n¡Enhorabuena por llegar a Santiago! 🎉 Gracias por hacer el Camino con '+emp+'. Nos encantará saber qué tal fue, y una reseña nos ayudaría mucho.'+firma;
    default:return hola+'\n\n'+firma.trim();
  }
}
function asuntoPlantilla(id,d,en){
  var emp=(typeof cfg!=='undefined'&&cfg.bizName)||'Bicips';
  var m={presupuesto:en?'Your quote':'Tu presupuesto',confirmacion:en?'Booking confirmed':'Reserva confirmada',entrega:en?'Bike delivery':'Entrega de las bicis',devolucion:en?'Bike pick-up':'Recogida de las bicis',gracias:en?'Thank you!':'¡Gracias!'};
  return emp+' · '+(m[id]||(en?'Your bike rental':'Tu alquiler de bicis'))+(d.ini?' · '+fmtD(d.ini):'');
}

function abrirMensaje(canal,resId){
  var d;
  if(resId!=null){var r=reservas.find(function(x){return String(x.id)===String(resId);});if(!r)return;d=_msgDatosRes(r);}
  else d=_msgDatosForm();
  _msg.datos=d;_msg.resId=d.id;
  var est=resId!=null?(reservas.find(function(x){return String(x.id)===String(resId);})||{}).estado:((document.getElementById('r-estado')||{}).value);
  var pl=est==='pendiente'?'presupuesto':['confirmada','proxima_entrega','en_preparacion','preparada'].indexOf(est)>=0?'confirmacion':['transito_furgo','transito_carlos','transito_seur'].indexOf(est)>=0?'entrega':['entregada','alquiler','pendiente_recoger'].indexOf(est)>=0?'devolucion':['recogida','finalizada'].indexOf(est)>=0?'gracias':'libre';
  var v=document.getElementById('m-mensaje');
  if(!v){v=document.createElement('div');v.id='m-mensaje';document.body.appendChild(v);}
  v.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:99990;display:flex;align-items:center;justify-content:center;padding:14px';
  var tel=telWhatsApp(d.tel);
  v.innerHTML='<div style="background:#fff;border-radius:14px;width:560px;max-width:100%;max-height:94vh;overflow:auto;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.35)">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><div style="font-size:17px;font-weight:800">💬 Mensaje para '+esc(d.cliente||'el cliente')+'</div><button onclick="cerrarMensaje()" style="border:none;background:#f3f4f6;border-radius:8px;width:32px;height:32px;cursor:pointer;font-size:16px">✕</button></div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">'
      +'<select id="msg-pl" class="fi" style="flex:1;min-width:200px" onchange="msgRellenar()">'+MSG_PLANTILLAS.map(function(p){return '<option value="'+p.id+'"'+(p.id===pl?' selected':'')+'>'+p.lbl+'</option>';}).join('')+'</select>'
      +'<select id="msg-idioma" class="fi" style="width:auto" onchange="msgRellenar()"><option value="es">🇪🇸 Español</option><option value="en">🇬🇧 English</option></select>'
    +'</div>'
    +'<div id="msg-asunto-w" style="margin-bottom:8px"><label style="font-size:11px;font-weight:800;color:#6b7280;text-transform:uppercase">Asunto (correo)</label><input id="msg-asunto" class="fi" style="width:100%;margin-top:3px"/></div>'
    +'<textarea id="msg-texto" class="fi" style="width:100%;min-height:230px;font-size:14px;line-height:1.45;resize:vertical"></textarea>'
    +'<div style="font-size:12px;color:#6b7280;margin:6px 0 12px">Puedes cambiar el texto antes de enviarlo.</div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
      +'<button onclick="enviarWhatsApp()" '+(tel?'':'disabled title="Falta el teléfono"')+' style="flex:1;min-width:150px;padding:12px;background:'+(tel?'#25d366':'#d1d5db')+';color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:800;cursor:'+(tel?'pointer':'not-allowed')+'">💬 WhatsApp'+(tel?'':' (sin teléfono)')+'</button>'
      +'<button onclick="enviarEmail()" '+(d.email?'':'disabled title="Falta el email"')+' style="flex:1;min-width:150px;padding:12px;background:'+(d.email?'#2563eb':'#d1d5db')+';color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:800;cursor:'+(d.email?'pointer':'not-allowed')+'">✉️ Email'+(d.email?'':' (sin email)')+'</button>'
      +'<button onclick="copiarMensaje()" style="padding:12px 14px;background:#fff;color:#374151;border:1px solid #d1d5db;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">📋 Copiar</button>'
    +'</div>'
    +(tel?'<div style="font-size:11.5px;color:#9ca3af;margin-top:8px">WhatsApp: +'+esc(tel)+(d.email?' · Email: '+esc(d.email):'')+'</div>':'')
    +'</div>';
  v.onclick=function(ev){if(ev.target===v)cerrarMensaje();};
  msgRellenar();
}
function msgRellenar(){
  var id=document.getElementById('msg-pl').value,en=document.getElementById('msg-idioma').value==='en';
  document.getElementById('msg-texto').value=textoPlantilla(id,_msg.datos,en);
  document.getElementById('msg-asunto').value=asuntoPlantilla(id,_msg.datos,en);
}
function cerrarMensaje(){var v=document.getElementById('m-mensaje');if(v)v.remove();}
function _msgRegistrar(canal){
  // Deja constancia en la reserva (si ya está guardada) de qué se envió y cuándo
  if(_msg.resId==null)return;
  var r=reservas.find(function(x){return String(x.id)===String(_msg.resId);});if(!r)return;
  var pl=document.getElementById('msg-pl');
  r.mensajes=(r.mensajes||[]).concat([{ts:new Date().toISOString(),canal:canal,plantilla:pl?pl.value:''}]).slice(-30);
  if(typeof DB!=='undefined'&&DB.saveReserva)DB.saveReserva(r).catch(function(e){console.error('mensajes',e);});
}
function enviarWhatsApp(){
  var tel=telWhatsApp(_msg.datos.tel);if(!tel){toast('Falta el teléfono del cliente');return;}
  var txt=document.getElementById('msg-texto').value;
  window.open('https://wa.me/'+tel+'?text='+encodeURIComponent(txt),'_blank','noopener');
  _msgRegistrar('whatsapp');toast('💬 Abriendo WhatsApp…');
}
function enviarEmail(){
  var em=_msg.datos.email;if(!em){toast('Falta el email del cliente');return;}
  var txt=document.getElementById('msg-texto').value,as=document.getElementById('msg-asunto').value;
  window.location.href='mailto:'+encodeURIComponent(em).replace(/%40/g,'@')+'?subject='+encodeURIComponent(as)+'&body='+encodeURIComponent(txt);
  _msgRegistrar('email');toast('✉️ Abriendo el correo…');
}
function copiarMensaje(){
  var t=document.getElementById('msg-texto');
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t.value).then(function(){toast('📋 Texto copiado');},function(){t.select();document.execCommand('copy');toast('📋 Texto copiado');});
  else{t.select();document.execCommand('copy');toast('📋 Texto copiado');}
}
