// Real geographic basemap; parcel positions are approximate, not GPS tracking.
(() => {
 if(!window.L)return;
 const pick=(z,k)=>window.siteLanguage.pick(z,k);
 const origin=[31.2304,121.4737],destination=[36.8931,128.7324];
 const map=L.map('real-map',{scrollWheelZoom:false,minZoom:3,maxZoom:15}).setView([34,125],5);
 const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'}).addTo(map);
 const warning=document.querySelector('#map-network');
 tiles.on('tileerror',()=>{warning.hidden=false;});
 tiles.on('load',()=>{const broken=document.querySelector('#real-map .leaflet-tile:not(.leaflet-tile-loaded)');if(!broken)warning.hidden=true;});
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
 const places={shanghai:origin,korea:[37.45,126.45],delivery:destination,delivered:destination};
 window.parcelMap={
  tracking(config){const p=config.location;const valid=p&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&p.lat>=20&&p.lat<=55&&p.lng>=100&&p.lng<=140;last=valid?[p.lat,p.lng]:(['transit','domestic'].includes(config.stage)?last:places[config.stage]||last);parcel.setIcon(icon('📦')).setLatLng(last);parcel.bindPopup(()=>valid?pick('最新扫描城市：','최근 스캔 도시: ')+String(window.siteLanguage.language==='ko'?(p.nameKo||p.name_ko||(!/[\u4e00-\u9fff]/.test(p.name||'')?p.name:'위치 확인됨')):(p.nameZh||p.name||'')).replace(/[<>&]/g,'')+'<br>'+pick('城市级近似位置，非 GPS','도시 단위의 대략적인 위치이며 GPS가 아니에요'):config.stage==='domestic'||config.stage==='transit'?pick('运输中，具体位置尚不确定','운송 중이며 정확한 위치는 아직 확인되지 않았어요'):pick('包裹阶段示意位置','배송 단계별 대략적인 위치'));requestAnimationFrame(()=>map.invalidateSize());},
  begin(){parcel.setIcon(icon('✈️'));fit();},
  progress(t){const i=Math.min(100,Math.round(t*100));parcel.setLatLng(route[i]);},
  finish(){parcel.setLatLng(destination).setIcon(icon('📦'));},
  resize(){requestAnimationFrame(()=>map.invalidateSize());}
 };
 new ResizeObserver(()=>map.invalidateSize()).observe(document.querySelector('#real-map'));
 fit();
})();
