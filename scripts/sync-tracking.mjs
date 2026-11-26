import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
export const number='EB872529602CN';
const cities=[['上海','상하이',31.2304,121.4737,/上海|shanghai/i],['北京','베이징',39.9042,116.4074,/北京|beijing/i],['广州','광저우',23.1291,113.2644,/广州|guangzhou/i],['仁川','인천',37.4563,126.7052,/仁川|incheon|인천/i],['首尔','서울',37.5665,126.978,/首尔|seoul|서울/i],['奉化','봉화',36.8931,128.7324,/奉化|bonghwa|봉화/i]];
export function normalize(body,previous={}){
 const accepted=body?.data?.accepted?.filter(x=>x.number===number&&x.track_info)||[];
 if(body.code!==0||!accepted.length)throw Error('Tracking provider did not return this parcel');
 const rows=accepted.flatMap(x=>{const i=x.track_info;return [i.latest_event,...(i.tracking?.providers||[]).flatMap(p=>p.events||[])].filter(Boolean);});
 const events=[...new Map(rows.map(e=>{
  const text=String(e.description||''),where=String(e.location||e.address?.city||''),country=e.address?.country||'';
  const match=cities.find(c=>c[4].test(where));
  const raw=e.address?.coordinates;let city=match?{zh:match[0],ko:match[1],lat:match[2],lng:match[3]}:null;
  if(!city&&raw?.latitude!=null&&raw?.longitude!=null){const lat=Number(raw.latitude),lng=Number(raw.longitude);if(lat>=20&&lat<=55&&lng>=100&&lng<=140)city={zh:where,ko:where,lat:Math.round(lat*100)/100,lng:Math.round(lng*100)/100};}
  const time=e.time_iso||e.time_utc||'',translation=e.description_translation;
  return [time+'|'+where+'|'+text,{time,description:text,descriptionKo:translation?.lang==='ko'?translation.description:null,location:where,country,city,status:e.stage||''}];
 })).values()].sort((a,b)=>(Date.parse(b.time)||0)-(Date.parse(a.time)||0));
 const latest=events[0],status=accepted[0].track_info.latest_status?.status||'NotFound';
 let stage=previous.stage||'shanghai',state='in_transit';
 if(status==='Delivered'){stage='delivered';state='delivered';}
 else if(status==='OutForDelivery'){stage='delivery';}
 else if(status==='AvailableForPickup'){stage='delivery';state='pickup';}
 else if(['Exception','DeliveryFailure','Expired'].includes(status))state='attention';
 else if(status==='NotFound'||!latest)state='awaiting_data';
 else if(status==='InfoReceived')state='label_created';
 else if(latest.country==='KR')stage='korea';
 else if(latest.country==='CN')stage='domestic';
 else state='location_unknown';
 const located=events.find(e=>e.city);
 return {number,carrier:'EMS',source:'17TRACK',stage,state,sync:'ok',checkedAt:new Date().toISOString(),updatedAt:latest?.time||'',events,location:located?{...located.city,nameZh:located.city.zh,nameKo:located.city.ko,time:located.time}:null};
}
async function main(){
 const file='tracking.json',previous=JSON.parse(fs.readFileSync(file,'utf8')),token=process.env.TRACK17_TOKEN;
 if(!token){console.log('TRACK17_TOKEN is not configured; preserving the last verified data.');return;}
 async function request(endpoint){const r=await fetch('https://api.17track.net/track/v2.4/'+endpoint,{method:'POST',headers:{'17token':token,'Content-Type':'application/json'},body:JSON.stringify([{number}]),signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error('Provider HTTP '+r.status);return r.json();}
 try{
  let body=await request('gettrackinfo');
  if(body.data?.rejected?.some(x=>x.error?.code===-18019902)){await request('register');console.log('Registered parcel; the provider may need several minutes.');body=await request('gettrackinfo');}
  fs.writeFileSync(file,JSON.stringify(normalize(body,previous),null,2)+'\n');
 }catch{fs.writeFileSync(file,JSON.stringify({...previous,sync:'error',attemptedAt:new Date().toISOString()},null,2)+'\n');console.error('Tracking unavailable; last verified events preserved.');}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
