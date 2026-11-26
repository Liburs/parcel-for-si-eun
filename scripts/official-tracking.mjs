import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
export const number='EB872529602CN';
export const url='https://trace.epost.go.kr/xtts/servlet/kpl.tts.common.svl.SttSVL?POST_CODE='+number+'&target_command=kpl.tts.tt.epost.cmd.RetrieveEmsTraceEngCmd';
const labels={
 'Posting/Collection':['邮政已揽收','우체국 접수'],
 'Arrival at outward office of exchange':['到达出口交换局','발송 교환국 도착'],
 'Ready for dispatch':['准备发往目的地','목적지 발송 준비'],
 'Arrival at inward office of exchange':['到达进口交换局','도착 교환국 도착'],
 'Departure from inward office of exchange':['离开进口交换局','도착 교환국 출발'],
 'Arrival at Office of Exchange':['到达邮件处理中心','우편 처리 시설 도착'],
 'Departure from Office of Exchange':['离开邮件处理中心','우편 처리 시설 출발'],
 'Delivered':['已妥投','배달 완료'],
 'Delivery complete':['已妥投','배달 완료'],
 'Out for delivery':['正在派送','배달 중']
};
const clean=s=>s.replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
export function parseOfficial(html,previous={}){
 if(!html.includes(number))throw Error('Wrong parcel page');
 const table=[...html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)].map(x=>x[0]).find(x=>/<th[^>]*>\s*Date\s*<\/th>/i.test(x)&&x.includes('Post office/Airport'));
 if(!table)throw Error('Official event table missing');
 const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];let enteredKorea=false;
 const events=[];
 for(const row of table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
  const c=[...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(x=>clean(x[1]));if(c.length<3)continue;
  const m=c[0].match(/(\d{2}:\d{2})\s+(\d{1,2})-([A-Za-z]{3})-(\d{4})/);if(!m||!months.includes(m[3]))throw Error('Unrecognized official timestamp');
  if(/inward office/i.test(c[1])||/INTERNATIONAL POST OFFICE/i.test(c[2]))enteredKorea=true;
  const country=/^CN/.test(c[2])||/Posting\/Collection/i.test(c[1])?'CN':enteredKorea?'KR':'';
  const time=`${m[4]}-${String(months.indexOf(m[3])+1).padStart(2,'0')}-${m[2].padStart(2,'0')}T${m[1]}:00${country==='CN'?'+08:00':'+09:00'}`;
  const names=labels[c[1]],office=c[2]==='CNSHAD'?['上海出口交换局','상하이 발송 교환국']:c[2]==='INTERNATIONAL POST OFFICE'?['国际邮政交换局','국제우편 교환국']:c[2]==='Integrated Mail Center'?['邮件处理中心','우편 처리 시설']:null;
  events.push({time,timeLabel:c[0],description:names?.[0]||'承运商更新（展开查看原文）',descriptionKo:names?.[1]||'배송 기록 갱신 (원문 보기)',original:c[1],location:c[2],officeZh:office?.[0]||c[2],officeKo:office?.[1]||c[2],country,city:c[2]==='CNSHAD'?{zh:'上海',ko:'상하이',lat:31.2304,lng:121.4737}:null});
 }
 if(!events.length)throw Error('No verified scans');
 events.sort((a,b)=>Date.parse(b.time)-Date.parse(a.time));const latest=events[0];
 const delivered=/^(Delivered|Delivery complete)$/i.test(latest.original),delivery=/^Out for delivery$/i.test(latest.original);
 const stage=delivered?'delivered':delivery?'delivery':latest.country==='KR'?'korea':/Ready for dispatch/i.test(latest.original)?'transit':'domestic';
 return {number,carrier:'EMS',source:'Korea Post',sourceUrl:url,stage,state:delivered?'delivered':'in_transit',sync:'ok',checkedAt:new Date().toISOString(),updatedAt:latest.time,events,location:latest.city?{...latest.city,nameZh:latest.city.zh,nameKo:latest.city.ko,time:latest.time}:null};
}
function run(){const file='tracking.json',previous=JSON.parse(fs.readFileSync(file,'utf8'));try{const html=execFileSync('curl',['--fail','--silent','--show-error','--location','--max-time','40','--retry','1',url],{encoding:'utf8',maxBuffer:2e6});const data=parseOfficial(html,previous);fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');console.log(`Verified ${data.events.length} official scans; stage ${data.stage}`);}catch{fs.writeFileSync(file,JSON.stringify({...previous,sync:'error',attemptedAt:new Date().toISOString()},null,2)+'\n');console.error('Official query unavailable; preserved last verified scans.');}}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)run();
