// Never place a tracking number or API key in this public file.
window.PARCEL_TRACKING={stage:'shanghai',state:'pending',sync:'not_configured',updatedAt:'',checkedAt:''};
async function refreshTracking(){
 if(location.protocol==='file:')return;
 try{
  const r=await fetch('tracking.json?t='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw Error();const data=await r.json();
  if(!['shanghai','domestic','transit','korea','delivery','delivered'].includes(data.stage))throw Error();
  window.PARCEL_TRACKING=data;
 }catch{window.PARCEL_TRACKING={...window.PARCEL_TRACKING,sync:'error'};}
 window.dispatchEvent(new Event('tracking-updated'));
}
refreshTracking();setInterval(refreshTracking,60*1000);

document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshTracking();});
