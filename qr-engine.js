// QR SCAN ENGINE v3 — robusto para file:// y móvil
// Siempre convierte a canvas antes de escanear

function qrScanFromFileEvent(event, onSuccess, onFail, onLoading){
  var file=event.target.files&&event.target.files[0];
  if(!file)return;
  if(onLoading)onLoading();
  event.target.value=''; // reset input immediately

  var reader=new FileReader();
  reader.onload=function(ev){
    var img=new Image();
    img.onload=function(){
      // Always draw to canvas first — ensures pixels are accessible cross-origin
      var MAX=1600;
      var scale=Math.min(1, MAX/Math.max(img.naturalWidth||img.width, img.naturalHeight||img.height));
      var cw=Math.round((img.naturalWidth||img.width)*scale);
      var ch=Math.round((img.naturalHeight||img.height)*scale);
      var canvas=document.createElement('canvas');
      canvas.width=cw; canvas.height=ch;
      var ctx=canvas.getContext('2d');
      ctx.drawImage(img,0,0,cw,ch);
      scanCanvas(canvas, cw, ch, onSuccess, onFail);
    };
    img.onerror=function(){onFail('No se pudo leer la imagen.');};
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
}

function scanCanvas(canvas, w, h, onSuccess, onFail){
  // Method 1: BarcodeDetector on canvas (works in Android Chrome)
  if(window.BarcodeDetector){
    try{
      var det=new BarcodeDetector({formats:['qr_code']});
      det.detect(canvas).then(function(codes){
        if(codes&&codes.length){onSuccess(codes[0].rawValue);}
        else{scanWithJsQR(canvas,w,h,onSuccess,onFail);}
      }).catch(function(){scanWithJsQR(canvas,w,h,onSuccess,onFail);});
      return;
    }catch(e){/* fall through */}
  }
  // Method 2: jsQR
  scanWithJsQR(canvas,w,h,onSuccess,onFail);
}

function scanWithJsQR(canvas, w, h, onSuccess, onFail){
  if(typeof jsQR==='undefined'){
    onFail('Librería QR no disponible — necesitas internet la primera vez que abres la app.');
    return;
  }
  var ctx=canvas.getContext('2d');

  // Try original, then half size, then quarter size, then with contrast boost
  var attempts=[
    function(){return {d:ctx.getImageData(0,0,w,h),w:w,h:h};},
    function(){
      var c2=document.createElement('canvas');c2.width=Math.round(w/2);c2.height=Math.round(h/2);
      c2.getContext('2d').drawImage(canvas,0,0,c2.width,c2.height);
      return {d:c2.getContext('2d').getImageData(0,0,c2.width,c2.height),w:c2.width,h:c2.height};
    },
    function(){
      // Boost contrast
      var c2=document.createElement('canvas');c2.width=w;c2.height=h;
      var ctx2=c2.getContext('2d');ctx2.drawImage(canvas,0,0,w,h);
      var id=ctx2.getImageData(0,0,w,h);
      for(var i=0;i<id.data.length;i+=4){
        var gray=0.299*id.data[i]+0.587*id.data[i+1]+0.114*id.data[i+2];
        var v=gray>128?255:0; // threshold
        id.data[i]=id.data[i+1]=id.data[i+2]=v;
      }
      ctx2.putImageData(id,0,0);
      return {d:ctx2.getImageData(0,0,w,h),w:w,h:h};
    }
  ];

  var modes=['attemptBoth','dontInvert','onlyInvert'];
  for(var ai=0;ai<attempts.length;ai++){
    try{
      var a=attempts[ai]();
      for(var mi=0;mi<modes.length;mi++){
        try{
          var code=jsQR(a.d.data,a.w,a.h,{inversionAttempts:modes[mi]});
          if(code&&code.data){onSuccess(code.data);return;}
        }catch(e){}
      }
    }catch(e){}
  }
  onFail('No se detectó QR. Consejos: más luz, encuadra solo el QR, acércate más.');
}
