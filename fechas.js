// ══════════════════════════════════════════════════════════════
// Un solo calendario para elegir inicio y fin de la reserva.
// 1.er toque = fecha de inicio, 2.º toque = fecha de fin. Se marcan las dos
// y los días entre medias. Rellena los campos r-ini y r-fin (ocultos).
// ══════════════════════════════════════════════════════════════
var _rg={mes:null,abierto:false,hover:null,eligiendoFin:false};
var _RG_MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function _rgVal(id){var e=document.getElementById(id);return e?e.value:'';}
function _rgSet(id,v){var e=document.getElementById(id);if(e)e.value=v||'';}
function _rgFmt(d){if(!d)return '';return toD(d).toLocaleDateString('es-ES',{weekday:'short',day:'numeric',month:'short',year:'numeric'});}
function _rgAviso(){try{calcDays();calcPrice();renderLineas();}catch(e){console.error(e);}}

function rangoPintar(){
  var box=document.getElementById('r-rango');if(!box)return;
  var ini=_rgVal('r-ini'),fin=_rgVal('r-fin');
  var txt=document.getElementById('r-rango-txt');
  if(txt){
    if(ini&&fin)txt.innerHTML='<b>'+_rgFmt(ini)+'</b>  →  <b>'+_rgFmt(fin)+'</b> <span style="color:#0f766e;font-weight:800">· '+(diffD(ini,fin)+1)+' días</span>';
    else if(ini)txt.innerHTML='<b>'+_rgFmt(ini)+'</b>  →  <span style="color:#d97706">elige la fecha de fin</span>';
    else txt.innerHTML='<span style="color:#9ca3af">Elige la fecha de inicio y la de fin</span>';
  }
  var cal=document.getElementById('r-rango-cal');if(!cal)return;
  cal.style.display=_rg.abierto?'block':'none';
  if(!_rg.abierto)return;
  if(!_rg.mes){var b=toD(ini||todayS());_rg.mes=new Date(b.getFullYear(),b.getMonth(),1);}
  var nMeses=(window.matchMedia&&window.matchMedia('(max-width: 820px)').matches)?1:2;
  var hoy=todayS(),finVis=fin||(_rg.eligiendoFin&&_rg.hover&&ini&&_rg.hover>=ini?_rg.hover:'');
  var h='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'
    +'<button type="button" onclick="rangoMes(-1)" style="border:1px solid #e5e7eb;background:#fff;border-radius:8px;width:34px;height:32px;cursor:pointer;font-size:15px">◀</button>'
    +'<div style="font-size:12.5px;color:#6b7280;font-weight:700">'+(_rg.eligiendoFin?'Ahora toca la fecha de <b style="color:#0f766e">FIN</b>':'Toca la fecha de <b style="color:#0f766e">INICIO</b>')+'</div>'
    +'<button type="button" onclick="rangoMes(1)" style="border:1px solid #e5e7eb;background:#fff;border-radius:8px;width:34px;height:32px;cursor:pointer;font-size:15px">▶</button></div>'
    +'<div style="display:flex;gap:18px;flex-wrap:wrap">';
  for(var m=0;m<nMeses;m++){
    var p=new Date(_rg.mes.getFullYear(),_rg.mes.getMonth()+m,1),y=p.getFullYear(),mo=p.getMonth();
    var dias=new Date(y,mo+1,0).getDate(),off=(p.getDay()+6)%7;
    h+='<div style="flex:1;min-width:250px"><div style="text-align:center;font-weight:800;margin-bottom:6px;text-transform:capitalize">'+_RG_MESES[mo]+' '+y+'</div>'
      +'<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center;font-size:11px;color:#9ca3af;font-weight:700;margin-bottom:2px">'+['L','M','X','J','V','S','D'].map(function(x){return '<div>'+x+'</div>';}).join('')+'</div>'
      +'<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px">';
    for(var i=0;i<off;i++)h+='<div></div>';
    for(var d=1;d<=dias;d++){
      var ds=y+'-'+String(mo+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
      var esIni=ds===ini,esFin=ds===finVis,dentro=ini&&finVis&&ds>ini&&ds<finVis,pasado=ds<hoy;
      var bg=esIni||esFin?'#0d9488':dentro?'#ccfbf1':'#fff',col=esIni||esFin?'#fff':pasado?'#c0c4cc':'#111827';
      h+='<button type="button" onclick="rangoClic(\''+ds+'\')" onmouseenter="rangoHover(\''+ds+'\')" style="height:36px;border-radius:'+(esIni&&esFin?'8px':esIni?'8px 0 0 8px':esFin?'0 8px 8px 0':dentro?'0':'8px')+';border:'+(ds===hoy?'2px solid #f59e0b':'1px solid '+(dentro?'#ccfbf1':'#f3f4f6'))+';background:'+bg+';color:'+col+';font-weight:'+(esIni||esFin?'900':'600')+';font-size:13.5px;cursor:pointer;padding:0">'+d+'</button>';
    }
    h+='</div></div>';
  }
  h+='</div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:12px;color:#6b7280"><span>🟧 hoy · el día de inicio y el de fin cuentan como días de alquiler</span>'
    +'<button type="button" onclick="rangoCerrar()" style="border:1px solid #e5e7eb;background:#fff;border-radius:8px;padding:6px 12px;font-weight:700;cursor:pointer">Cerrar</button></div>';
  cal.innerHTML=h;
}
function rangoAbrir(){_rg.abierto=!_rg.abierto;_rg.eligiendoFin=false;_rg.hover=null;var ini=_rgVal('r-ini');var b=toD(ini||todayS());_rg.mes=new Date(b.getFullYear(),b.getMonth(),1);rangoPintar();}
function rangoCerrar(){_rg.abierto=false;_rg.eligiendoFin=false;rangoPintar();}
function rangoMes(n){_rg.mes=new Date(_rg.mes.getFullYear(),_rg.mes.getMonth()+n,1);rangoPintar();}
function rangoHover(ds){if(!_rg.eligiendoFin||_rg.hover===ds)return;_rg.hover=ds;rangoPintar();}
function rangoClic(ds){
  var ini=_rgVal('r-ini');
  if(!_rg.eligiendoFin||!ini||ds<ini){ // primer toque (o fecha anterior al inicio): nuevo inicio
    _rgSet('r-ini',ds);_rgSet('r-fin','');_rg.eligiendoFin=true;_rg.hover=null;rangoPintar();_rgAviso();return;
  }
  _rgSet('r-fin',ds);_rg.eligiendoFin=false;_rg.abierto=false;_rg.hover=null;rangoPintar();_rgAviso();
}
// Al abrir una reserva (nueva o para editar) se pinta el rango que trae
(function(){
  var ini=function(){
    ['openEditRes','openNewRes'].forEach(function(fn){if(typeof window[fn]==='function'&&!window[fn]._rg){var o=window[fn];window[fn]=function(){var r=o.apply(this,arguments);_rg.abierto=false;_rg.eligiendoFin=false;_rg.mes=null;try{rangoPintar();}catch(e){}return r;};window[fn]._rg=1;}});
    rangoPintar();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(ini,0);});else setTimeout(ini,0);
})();
