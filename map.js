// Real geographic basemap; parcel positions are approximate, not GPS tracking.
(() => {
 if(!window.L)return;
 const pick=(z,k)=>window.siteLanguage.pick(z,k);
 const origin=[31.2304,121.4737],destination=[36.8931,128.7324];
 const map=L.map('real-map',{scrollWheelZoom:false,minZoom:3,maxZoom:15}).setView([34,125],5);
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
 const icon=emoji=>L.divIcon({className:'parcel-pin',html:'<span>'+emoji+'</span>',iconSize:[42,42],iconAnchor:[21,21]});
 L.circleMarker(origin,{radius:6,color:'#bc6283',fillOpacity:1}).addTo(map).bindPopup(()=>pick('上海','상하이'));
 L.circleMarker(destination,{radius:6,color:'#bc6283',fillOpacity:1}).addTo(map).bindPopup(()=>pick('奉化郡<br>城市级目的地','봉화군<br>도시 단위 목적지'));
 const route=[];for(let i=0;i<=100;i++){const t=i/100;route.push([origin[0]+(destination[0]-origin[0])*t+2*Math.sin(Math.PI*t),origin[1]+(destination[1]-origin[1])*t]);}
 L.polyline(route,{color:'#d97c9c',weight:3,dashArray:'7 9'}).addTo(map).bindPopup(()=>pick('心意旅程示意线，非实际航线','마음을 잇는 선이며 실제 항로가 아니에요.'));
 const parcel=L.marker(origin,{icon:icon('📦')}).addTo(map);
 let last=origin;
 function fit(){map.invalidateSize();map.fitBounds([origin,destination],{padding:[45,60],maxZoom:6});}
 document.querySelector('#map-reset').onclick=fit;
 // Coordinates are approximate representative points for known broad stages.
 // Unknown domestic locations retain the last point instead of inventing a city.
 const places={shanghai:origin,domestic:[31.6,121.2],transit:[34.4,125.1],korea:[37.45,126.45],delivery:destination,delivered:destination};
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
   const p=config.location||event;
   const lat=Number(p&&p.lat),lng=Number(p&&p.lng);
   const valid=p&&Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=20&&lat<=55&&lng>=100&&lng<=140;
   last=valid?[lat,lng]:(places[config.stage]||last);
   parcel.setIcon(icon('📦')).setLatLng(last);
   parcel.bindPopup(()=>valid?pick('最新扫描城市：','최근 스캔 도시: ')+String(window.siteLanguage.language==='ko'?(p.nameKo||p.name_ko||(!/[\u4e00-\u9fff]/.test(p.name||'')?p.name:'')||'위치 확인됨'):(p.nameZh||p.name||'位置确认')).replace(/[<>&]/g,'')+'<br>'+pick('城市级近似位置，非 GPS','도시 단위의 대략적인 위치이며 GPS가 아니에요'):config.stage==='domestic'||config.stage==='transit'?pick('运输中，具体位置尚不确定','운송 중이며 정확한 위치는 아직 확인되지 않았어요'):pick('包裹阶段示意位置','배송 단계별 대략적인 위치'));
   requestAnimationFrame(()=>map.invalidateSize());
  },
  begin(){parcel.setIcon(icon('✈️'));fit();},
  progress(t){const i=Math.min(100,Math.round(t*100));parcel.setLatLng(route[i]);},
  finish(){parcel.setLatLng(destination).setIcon(icon('📦'));},
  resize(){requestAnimationFrame(()=>map.invalidateSize());}
 };
 new ResizeObserver(()=>map.invalidateSize()).observe(document.querySelector('#real-map'));
 fit();
})();
