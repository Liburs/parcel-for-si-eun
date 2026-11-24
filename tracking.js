// Never place a tracking number or API key in this public file.
window.PARCEL_TRACKING={stage:'shanghai',state:'pending',sync:'not_configured',updatedAt:'',checkedAt:''};
async function refreshTracking(){
 if(location.protocol==='file:')return;
 // AbortController 比 AbortSignal.timeout 兼容更多旧版浏览器（例如旧 iOS Safari）。
 const controller=typeof AbortController==='function'?new AbortController():null;
 const timer=controller?setTimeout(()=>controller.abort(),10000):0;
 try{
  const r=await fetch('tracking.json?t='+Date.now(),{cache:'no-store',signal:controller?controller.signal:undefined});
  if(!r.ok)throw Error();const data=await r.json();
  if(!['shanghai','domestic','transit','korea','delivery','delivered'].includes(data.stage))throw Error();
  window.PARCEL_TRACKING=data;
 }catch{window.PARCEL_TRACKING={...window.PARCEL_TRACKING,sync:'error'};}
 clearTimeout(timer);
 window.dispatchEvent(new Event('tracking-updated'));
}
refreshTracking();setInterval(refreshTracking,60*1000);

document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshTracking();});
