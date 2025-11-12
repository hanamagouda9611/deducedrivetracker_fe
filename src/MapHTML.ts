const MapHTML = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
html, body, #mapContainer, #map { height: 100%; margin: 0; padding: 0; background: transparent; overflow: hidden; }
#mapContainer { width:100%; height:100%; transform-origin: 50% 50%; transition: transform 300ms ease; }
.leaflet-control-attribution, .leaflet-control-scale { display: none !important; }

#north-arrow { position: absolute; top: 10px; right: 10px; width: 44px; height: 44px; background: rgba(255,255,255,0.9); border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.25); background-image: url('https://img.icons8.com/ios-filled/50/compass.png'); background-size: 60%; background-repeat: no-repeat; background-position: center; transform-origin: center; z-index: 9999; transition: transform 150ms linear, border 0.3s ease; border: 2px solid #000; display:flex; align-items:center; justify-content:center; }

#map-toggle { position: absolute; top: 60px; right: 10px; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; z-index: 9999; }
.round-btn { width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.2); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; border: 1.5px solid rgba(255,255,255,0.4); cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: all 0.2s ease; }
.round-btn:hover { transform: scale(1.05); background: rgba(255,255,255,0.3); }
#map-options { display: none; flex-direction: column; gap: 10px; }
#map-options.show { display: flex; }
.map-option-btn { display: flex; flex-direction: row; align-items: center; justify-content: space-between; gap: 10px; width: auto; background: rgba(255,255,255,0.2); backdrop-filter: blur(8px); border: 1.5px solid rgba(255,255,255,0.4); border-radius: 22px; padding: 6px 12px 6px 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); cursor: pointer; transition: all 0.2s ease; }
.map-option-btn:hover { transform: scale(1.05); background: rgba(255,255,255,0.3); }
.map-label { font-size: 13px; font-weight: 600; color: #000; opacity: 0; white-space: nowrap; transition: opacity 0.3s ease; }
#map-options.show .map-label { opacity: 1; }
.map-icon { width: 32px; height: 32px; border-radius: 50%; background-size: cover; background-position: center; }
.osm-icon { background-image: url('https://img.icons8.com/?size=100&id=rMF7T4f4fwKw&format=png&color=000000'); }
.satellite-icon { background-image: url('https://img.icons8.com/color/48/earth-planet.png'); }
.dark-icon { background-image: url('https://img.icons8.com/fluency/48/moon.png'); }

.marker-root { width: 42px; height: 42px; display:flex; align-items:center; justify-content:center; will-change: transform; }
.blinking-dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid rgba(0,123,255,0.6); background: #007bff; box-shadow: 0 0 8px rgba(0,123,255,0.2); animation: blink 2s infinite; position: relative; }
.marker-pointer { position: absolute; width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-bottom: 14px solid #003f8a; transform-origin: 50% 75%; top: -10px; opacity: 0.95; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3)); }
@keyframes blink { 0%,50%,100%{opacity:1;} 25%,75%{opacity:0.35;} }

.leaflet-control-zoom, .leaflet-bar { background: rgba(255,255,255,0.2); backdrop-filter: blur(8px); border: 1.5px solid rgba(255,255,255,0.4); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }

#retain-btn { position: absolute; bottom: 30px; right: 10px; z-index: 9999; width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.9); border: 1.5px solid rgba(0,0,0,0.08); display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow: 0 6px 14px rgba(0,0,0,0.12); }
#retain-btn img { width: 24px; height: 24px; }
</style>
</head>
<body>
<div id="mapContainer"><div id="map"></div></div>
<div id="north-arrow" title="North"></div>

<div id="map-toggle">
  <button id="main-map-btn" class="round-btn"><div class="map-icon osm-icon" id="main-map-icon"></div></button>
  <div id="map-options">
    <button class="map-option-btn" data-map="osm"><span class="map-label">OSM</span><div class="map-icon osm-icon"></div></button>
    <button class="map-option-btn" data-map="satellite"><span class="map-label">Satellite</span><div class="map-icon satellite-icon"></div></button>
    <button class="map-option-btn" data-map="dark"><span class="map-label">Dark</span><div class="map-icon dark-icon"></div></button>
  </div>
</div>

<button id="retain-btn" title="Go to Current Location">
   <img src="https://cdn-icons-png.flaticon.com/512/1828/1828178.png" style="width:24px;height:24px;" />
</button>

<script>
const map = L.map('map', { zoomControl: true, attributionControl: false }).setView([12.9716,77.5946], 16);

const baseLayers = {
  osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution:'© OpenStreetMap contributors' }),
  satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution:'© ESRI' }),
  dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution:'© CARTO' })
};
let selectedMap='osm';
baseLayers[selectedMap].addTo(map);

const mainBtnIcon=document.getElementById('main-map-icon');
const mainBtn=document.getElementById('main-map-btn');
const mapOptions=document.getElementById('map-options');
const northArrow=document.getElementById('north-arrow');
const retainBtn=document.getElementById('retain-btn');
const mapContainer = document.getElementById('mapContainer');

let bikerMarker=null;
let bufferCircle=null;
let mapRotationDeg = 0;

// --- Helper functions ---
function updateMapBorders(mapType){
  let borderColor='#000';
  if(mapType==='dark') borderColor='#fff';
  else if(mapType==='satellite') borderColor='#007bff';
  northArrow.style.border='2px solid '+borderColor;
  mainBtn.style.border='2px solid '+borderColor;
  retainBtn.style.border='2px solid '+borderColor;
}

function updateMainMapButton(mapType){
  selectedMap=mapType;
  Object.values(baseLayers).forEach(l=>map.removeLayer(l));
  baseLayers[mapType].addTo(map);
  mainBtnIcon.className='map-icon '+mapType+'-icon';
  updateMapBorders(mapType);
}
document.querySelectorAll('#map-options button').forEach(btn=>{
  btn.addEventListener('click', e=>{
    updateMainMapButton(e.currentTarget.dataset.map);
    mapOptions.classList.remove('show');
  });
});
mainBtn.addEventListener('click', ()=>mapOptions.classList.toggle('show'));

function createBikerIcon(headingDeg=0){
  const wrapper=document.createElement('div'); wrapper.className='marker-root';
  const pointer=document.createElement('div'); pointer.className='marker-pointer'; pointer.style.transform='rotate('+headingDeg+'deg)';
  const dot=document.createElement('div'); dot.className='blinking-dot';
  wrapper.appendChild(pointer); wrapper.appendChild(dot);
  return L.divIcon({ className:'', html:wrapper.outerHTML, iconSize:[42,42], iconAnchor:[21,21] });
}
function setMarkerHeading(marker, deg){
  try{ const icon = marker.getElement ? marker.getElement() : marker._icon; if(!icon) return; const pointer=icon.querySelector('.marker-pointer'); if(pointer) pointer.style.transform='rotate('+deg+'deg)'; } catch{}
}
function computeBearing(lat1, lon1, lat2, lon2){ const toRad=Math.PI/180, toDeg=180/Math.PI; const φ1=lat1*toRad, φ2=lat2*toRad, Δλ=(lon2-lon1)*toRad; const y=Math.sin(Δλ)*Math.cos(φ2); const x=Math.cos(φ1)*Math.sin(φ2)-Math.sin(φ1)*Math.cos(φ2)*Math.cos(Δλ); const θ=Math.atan2(y,x); return ((θ*toDeg)+360)%360; }
function animateMarker(marker, fromLatLng, toLatLng, duration=700){
  const start=performance.now();
  const [fromLat, fromLng]=fromLatLng;
  const [toLat, toLng]=toLatLng;
  function frame(now){
    const t=Math.min(1,(now-start)/duration);
    const eased=t<0.5?2*t*t:-1+(4-2*t)*t;
    const curLat=fromLat+(toLat-fromLat)*eased;
    const curLng=fromLng+(toLng-fromLng)*eased;
    marker.setLatLng([curLat,curLng]);
    if(t<1) requestAnimationFrame(frame);
    else marker.setLatLng([toLat,toLng]);
  }
  requestAnimationFrame(frame);
}

// --- Handle init ---
function handleInit(payload){
  const startLatLng = payload?.currentLocation ? [payload.currentLocation.lat,payload.currentLocation.lng] : [12.9716,77.5946];
  if(bikerMarker) bikerMarker.setLatLng(startLatLng);
  else bikerMarker=L.marker(startLatLng,{icon:createBikerIcon(0)}).addTo(map);

  if(bufferCircle) bufferCircle.setLatLng(startLatLng).setRadius(payload?.buffRadius||100);
  else bufferCircle=L.circle(startLatLng,{ radius: payload?.buffRadius||100, color:'rgba(33,174,230,0.35)', fillColor:'rgba(33,174,230,0.35)', fillOpacity:0.4, weight:1 }).addTo(map);

  map.panTo(startLatLng);
}

// --- Handle coord updates ---
function handleCoord(payload){
  if(!payload) return;
  const lat=payload.lat, lng=payload.lng;
  if(!bikerMarker){
    bikerMarker=L.marker([lat,lng],{icon:createBikerIcon(0)}).addTo(map);
    bufferCircle=L.circle([lat,lng],{ radius:100, color:'rgba(33,174,230,0.35)', fillColor:'rgba(33,174,230,0.35)', fillOpacity:0.4, weight:1 }).addTo(map);
    map.panTo([lat,lng]);
    return;
  }
  const from=bikerMarker.getLatLng();
  const to=[lat,lng];
  const bearing=computeBearing(from.lat, from.lng, lat, lng);
  bikerMarker.__lastHeading=bearing;
  animateMarker(bikerMarker,[from.lat,from.lng],to);
  setMarkerHeading(bikerMarker,bearing);
  bufferCircle.setLatLng(to);
  map.panTo(to,{animate:true});
}

// --- Device orientation ---
function handleDeviceOrientation(e){
  const alpha=e.webkitCompassHeading!==undefined?e.webkitCompassHeading:e.alpha!==undefined?e.alpha:null;
  if(alpha==null) return;
  mapRotationDeg=-alpha;
  mapContainer.style.transform='rotate('+mapRotationDeg+'deg)';
  northArrow.style.transform='rotate('+(-mapRotationDeg)+'deg)';
}
if(window.DeviceOrientationEvent){
  window.addEventListener('deviceorientationabsolute',handleDeviceOrientation,true);
  window.addEventListener('deviceorientation',handleDeviceOrientation,true);
}

// --- Retain button ---
retainBtn.addEventListener('click',()=>{
  if(!navigator.geolocation){ console.warn("Geolocation not supported"); return; }
  navigator.geolocation.getCurrentPosition(
    (pos)=>{
      const lat=pos.coords.latitude;
      const lng=pos.coords.longitude;
      if(bikerMarker) bikerMarker.setLatLng([lat,lng]);
      if(bufferCircle) bufferCircle.setLatLng([lat,lng]);
      map.setView([lat,lng],18,{animate:true});
    },
    (err)=>console.error("Error getting location:",err),
    { enableHighAccuracy:true, timeout:10000, maximumAge:0 }
  );
});

// --- Message bridge ---
function handleMessage(msg){
  const {type,payload}=msg||{};
  if(type==='init') handleInit(payload);
  else if(type==='coord') handleCoord(payload);
  else if(type==='modeChange') payload.isDarkMode?updateMainMapButton('dark'):updateMainMapButton('osm');
  else if(type==='startLive'){}
  else if(type==='stopLive'){}
  else if(type==='setRotation' && typeof payload?.deg==='number'){ mapRotationDeg=payload.deg; mapContainer.style.transform='rotate('+mapRotationDeg+'deg)'; northArrow.style.transform='rotate('+(-mapRotationDeg)+'deg)'; }
}
document.addEventListener('message',e=>{ try{ handleMessage(JSON.parse(e.data)); } catch{} });
window.addEventListener('message',e=>{ try{ handleMessage(JSON.parse(e.data)); } catch{} });

setTimeout(()=>{
  if(window.ReactNativeWebView && window.ReactNativeWebView.postMessage){
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'mapReady'}));
  }
},500);
</script>
</body>
</html>
`;

export default MapHTML;
