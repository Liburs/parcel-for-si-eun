// Real geographic basemap; parcel positions are approximate, not GPS tracking.
(() => {
 if(!window.L)return;
 const pick=(z,k)=>window.siteLanguage.pick(z,k);
 const origin=[31.2304,121.4737],destination=[36.8931,128.7324];
 const map=L.map('real-map',{scrollWheelZoom:false,minZoom:3,maxZoom:15}).setView([34,125],5);
 map.attributionControl.setPrefix(false);
 const attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';
 const warning=document.querySelector('#map-network');
 // 底图依次尝试：OSM 官方 → OSM.de → CARTO 淡色底图。全部失败时保留路线示意并提示。
 const tileSources=[
  {url:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',attribution},
  {url:'https://tile.openstreetmap.de/{z}/{x}/{y}.png',attribution},
  {url:'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',attribution:attribution+' &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>'}
 ];
 let tileSource=0,tileLayer=null,tileTimer=0;
 function startTiles(){
  if(tileLayer){map.removeLayer(tileLayer);tileLayer=null;}
  clearTimeout(tileTimer);
  const source=tileSources[tileSource];
  const layer=L.tileLayer(source.url,{maxZoom:19,attribution:source.attribution}).addTo(map);
  tileLayer=layer;
  let loaded=0,errors=0;
  const advance=()=>{
   if(layer!==tileLayer)return;
   if(tileSource+1<tileSources.length){tileSource++;startTiles();}
   else if(warning)warning.hidden=false;
  };
  layer.on('tileload',()=>{if(layer!==tileLayer)return;loaded++;if(warning)warning.hidden=true;});
  // 只要成功过一张瓦片就留在当前源，避免偶发重置导致整层被替换；完全加载不到时才切换。
  layer.on('tileerror',()=>{if(layer!==tileLayer)return;errors++;if(!loaded&&errors>=4)advance();});
  layer.on('load',()=>{if(layer!==tileLayer)return;if(!loaded)advance();else if(warning)warning.hidden=true;});
  tileTimer=setTimeout(()=>{if(layer===tileLayer&&!loaded)advance();},9000);
 }
 startTiles();

 // 可爱化：起点 / 终点小圆牌 + 永久地名标签 + 会呼吸的包裹图钉。
 const pinIcon=(emoji,cls)=>L.divIcon({className:'map-pin '+(cls||''),html:'<span>'+emoji+'</span>',iconSize:[40,40],iconAnchor:[20,20]});
 const startPin=L.marker(origin,{icon:pinIcon('🏠','map-pin-home'),zIndexOffset:300,keyboard:false}).addTo(map);
 const endPin=L.marker(destination,{icon:pinIcon('💝','map-pin-end'),zIndexOffset:300,keyboard:false}).addTo(map);
 const startLabel=()=>pick('上海 · SHANGHAI','상하이 · SHANGHAI');
 const endLabel=()=>pick('奉化 · BONGHWA','봉화 · BONGHWA');
 startPin.bindTooltip(startLabel,{permanent:true,direction:'top',offset:[0,-19],className:'map-name',opacity:1});
 endPin.bindTooltip(endLabel,{permanent:true,direction:'bottom',offset:[0,19],className:'map-name',opacity:1});

 // 一层柔光 + 一层会流动的粉色虚线，像手账上的邮路。
 const route=[];for(let i=0;i<=120;i++){const t=i/120;route.push([origin[0]+(destination[0]-origin[0])*t+2*Math.sin(Math.PI*t),origin[1]+(destination[1]-origin[1])*t]);}
 L.polyline(route,{color:'#ffffff',weight:10,opacity:.9,lineCap:'round',lineJoin:'round',interactive:false}).addTo(map);
 L.polyline(route,{color:'#e88ba9',weight:3,dashArray:'1 10',lineCap:'round',className:'journey-route',interactive:false}).addTo(map);

 const icon=emoji=>L.divIcon({className:'parcel-pin',html:'<span>'+emoji+'</span><i class="parcel-halo"></i>',iconSize:[42,42],iconAnchor:[21,21]});
 const parcel=L.marker(origin,{icon:icon('📦'),zIndexOffset:900,riseOnHover:true,keyboard:false}).addTo(map);
 let last=origin,animation=0;const scanPath=L.polyline([],{color:'#b75a7d',weight:4,opacity:.85}).addTo(map);function movePin(next){cancelAnimationFrame(animation);const from=parcel.getLatLng(),start=performance.now();if(matchMedia('(prefers-reduced-motion: reduce)').matches){parcel.setLatLng(next);return;}function step(now){const f=Math.min(1,(now-start)/1100),ease=f*f*(3-2*f);parcel.setLatLng([from.lat+(next[0]-from.lat)*ease,from.lng+(next[1]-from.lng)*ease]);if(f<1)animation=requestAnimationFrame(step);}animation=requestAnimationFrame(step);}

 window.addEventListener('site-language-changed',()=>{
  startPin.setTooltipContent(startLabel());
  endPin.setTooltipContent(endLabel());
 });

 function fit(){map.invalidateSize();map.fitBounds([origin,destination],{padding:[45,60],maxZoom:6});}
 document.querySelector('#map-reset').onclick=fit;

 // Coordinates are approximate representative points for known broad stages.
 // Unknown domestic locations retain the last point instead of inventing a city.
 const places={shanghai:origin,domestic:[31.6,121.2],transit:[34.4,125.1],korea:[36.5,127.8],delivery:destination,delivered:destination};
 const stageNames={shanghai:['上海','상하이'],domestic:['中国境内运输','중국 내 운송'],transit:['国际运输中','국제 운송 중'],korea:['已到韩国','한국 도착'],delivery:['前往奉化','봉화로 이동 중'],delivered:['已送达','배송 완료']};
 window.parcelMap={
  tracking(config){
   // 优先用最新一条带坐标的扫描记录，其次 location，最后按阶段取示意位置。
   const events=Array.isArray(config.events)?config.events:[];
   let event=null;
   for(const item of events){
    const city=item&&item.city;if(!city)continue;
    const lat=Number(city.lat??item.lat),lng=Number(city.lng??item.lng);
    if(!Number.isFinite(lat)||!Number.isFinite(lng))continue;
    if(!event||(Date.parse(item.time)||0)>(Date.parse(event.time)||0))event={...city,lat,lng,nameZh:city.zh,nameKo:city.ko,time:item.time};
   }
   const p=config.source==='Korea Post'?config.location:event&&(!config.location||Date.parse(event.time)>Date.parse(config.location.time||0))?event:config.location||event;
   const lat=Number(p&&p.lat),lng=Number(p&&p.lng);
   const valid=p&&Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=20&&lat<=55&&lng>=100&&lng<=140;
   last=valid?[lat,lng]:(places[config.stage]||last);
   parcel.setOpacity(valid?1:.35);parcel.setIcon(icon(config.stage==='delivered'?'💝':'📦'));if(valid||config.stage==='korea')movePin(last);const points=events.filter(e=>e.city&&Number.isFinite(e.city.lat)&&Number.isFinite(e.city.lng)).slice().reverse().map(e=>[e.city.lat,e.city.lng]);scanPath.setLatLngs(points);
   parcel.bindPopup(()=>{
    const name=valid?String(window.siteLanguage.language==='ko'?(p.nameKo||p.name_ko||(!/[\u4e00-\u9fff]/.test(p.name||'')?p.name:'')||'위치 확인됨'):(p.nameZh||p.name||'位置确认')).replace(/[<>&]/g,''):'';
    const stage=stageNames[config.stage]?stageNames[config.stage]:stageNames.shanghai;
    if(valid)return '<strong>'+pick('最新扫描位置','최근 스캔 위치')+'</strong><br>'+name+'<br><small>'+pick('城市级近似位置，非 GPS','도시 단위의 대략적인 위치이며 GPS가 아니에요')+'</small>';
    return '<strong>'+pick('具体城市尚未确认 · 区域示意','정확한 도시는 미확인 · 지역 표시')+'</strong><br><small>'+(config.stage==='domestic'||config.stage==='transit'?pick('运输中，具体位置尚不确定','운송 중이며 정확한 위치는 아직 확인되지 않았어요'):pick('包裹阶段示意位置','배송 단계별 대략적인 위치'))+'</small>';
   });
   requestAnimationFrame(()=>map.invalidateSize());
  },
  begin(){cancelAnimationFrame(animation);parcel.setOpacity(1);parcel.setIcon(icon('✈️'));fit();},
  progress(t){const i=Math.min(120,Math.round(t*120));parcel.setLatLng(route[i]);},
  finish(){parcel.setLatLng(destination).setIcon(icon('💝'));},
  resize(){requestAnimationFrame(()=>map.invalidateSize());}
 };
 new ResizeObserver(()=>map.invalidateSize()).observe(document.querySelector('#real-map'));
 fit();
})();
