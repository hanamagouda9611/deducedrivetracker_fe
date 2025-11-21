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
.terrain-icon { background-image: url('https://img.icons8.com/color/48/mountain.png'); }

.marker-root { width: 42px; height: 42px; display:flex; align-items:center; justify-content:center; will-change: transform; }
.blinking-dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid rgba(0,123,255,0.6); background: #007bff; box-shadow: 0 0 8px rgba(0,123,255,0.2); animation: blink 2s infinite; position: relative; }
.marker-pointer {
  position: absolute;
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 18px solid #003f8a;
  transform-origin: 50% 90%;   /* correct rotation pivot */
  top: -6px;                   /* small upward shift */
  left: 50%;
  transform: translateX(-50%);
  opacity: 0.95;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
}
@keyframes blink { 0%,50%,100%{opacity:1;} 25%,75%{opacity:0.35;} }

.start-marker { width: 20px; height: 20px; background: #28a745; border: 3px solid #fff; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
.end-marker { width: 20px; height: 20px; background: #dc3545; border: 3px solid #fff; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }

.leaflet-control-zoom, .leaflet-bar { background: rgba(255,255,255,0.2); backdrop-filter: blur(8px); border: 1.5px solid rgba(255,255,255,0.4); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }

#retain-btn { position: absolute; bottom: 30px; right: 10px; z-index: 9999; width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.9); border: 1.5px solid rgba(0,0,0,0.08); display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow: 0 6px 14px rgba(0,0,0,0.12); transition: all 0.2s ease; }
#retain-btn:hover { transform: scale(1.05); }
#retain-btn img { width: 24px; height: 24px; }

.leaflet-popup-content-wrapper { background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
.leaflet-popup-content { margin: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
.popup-title { font-size: 14px; font-weight: 700; color: #007aff; margin-bottom: 8px; }
.popup-detail { font-size: 12px; color: #333; margin: 4px 0; }
.popup-detail strong { color: #000; }
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
    <button class="map-option-btn" data-map="terrain"><span class="map-label">Terrain</span><div class="map-icon terrain-icon"></div></button>
  </div>
</div>

<button id="retain-btn" title="Go to Current Location">
   <img src="https://cdn-icons-png.flaticon.com/512/1828/1828178.png" />
</button>

<script>
const map = L.map('map', { zoomControl: true, attributionControl: false }).setView([12.9716,77.5946], 16);

const baseLayers = {
  osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution:'© OpenStreetMap' }),
  satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution:'© ESRI' }),
  dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution:'© CARTO' }),
  terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { attribution:'© OpenTopoMap' })
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
let currentPolyline = null;
let historicalPolylines = [];
let startMarker = null;
let endMarker = null;

function updateMapBorders(mapType){
  let borderColor='#000';
  if(mapType==='dark') borderColor='#fff';
  else if(mapType==='satellite') borderColor='#007bff';
  else if(mapType==='terrain') borderColor='#228b22';
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

function createBikerIcon(headingDeg = 0) {
  const wrapper = document.createElement('div');
  wrapper.className = 'marker-root';
  wrapper.style.position = "relative";
  wrapper.style.width = "42px";
  wrapper.style.height = "52px"; // increased height so arrow stays above the dot

  const pointer = document.createElement('div');
  pointer.className = 'marker-pointer';
  pointer.style.position = "absolute";
  pointer.style.top = "-6px";                 // 🔥 arrow moved UP (in front)
  pointer.style.left = "50%";
  pointer.style.transform = 'translateX(-50%) rotate(' + headingDeg + 'deg)';
  pointer.style.transformOrigin = "50% 80%";  // 🔥 cleaner rotation

  const dot = document.createElement('div');
  dot.className = 'blinking-dot';
  dot.style.position = "absolute";
  dot.style.bottom = "0px";                  // dot stays at bottom
  dot.style.left = "50%";
  dot.style.transform = "translateX(-50%)";

  wrapper.appendChild(pointer);
  wrapper.appendChild(dot);

  return L.divIcon({
    className: '',
    html: wrapper.outerHTML,
    iconSize: [42, 52],   // updated height
    iconAnchor: [21, 45]  // ensures arrow points correctly on map
  });
}



function setMarkerHeading(marker, bearingDeg) {
  try {
    const el = marker.getElement ? marker.getElement() : marker._icon;
    if (!el) return;

    const pointer = el.querySelector(".marker-pointer");
    if (pointer) {
      // combine BOTH rotations (map + driving direction)
      const finalDeg = bearingDeg + mapRotationDeg;

      pointer.style.transform =
        "translateX(-50%) rotate(" + finalDeg + "deg)";
      pointer.style.transformOrigin = "50% 80%";
    }
  } catch (e) {
    console.warn("Rotation error:", e);
  }
}


function computeBearing(lat1, lon1, lat2, lon2){ 
  const toRad=Math.PI/180, toDeg=180/Math.PI; 
  const φ1=lat1*toRad, φ2=lat2*toRad, Δλ=(lon2-lon1)*toRad; 
  const y=Math.sin(Δλ)*Math.cos(φ2); 
  const x=Math.cos(φ1)*Math.sin(φ2)-Math.sin(φ1)*Math.cos(φ2)*Math.cos(Δλ); 
  const θ=Math.atan2(y,x); 
  return ((θ*toDeg)+360)%360; 
}

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

function handleInit(payload){
  const startLatLng = payload?.currentLocation ? [payload.currentLocation.lat,payload.currentLocation.lng] : [12.9716,77.5946];
  if(bikerMarker) bikerMarker.setLatLng(startLatLng);
  else bikerMarker=L.marker(startLatLng,{icon:createBikerIcon(0)}).addTo(map);

  if(bufferCircle) bufferCircle.setLatLng(startLatLng).setRadius(payload?.buffRadius||100);
  else bufferCircle=L.circle(startLatLng,{ radius: payload?.buffRadius||100, color:'rgba(33,174,230,0.35)', fillColor:'rgba(33,174,230,0.35)', fillOpacity:0.4, weight:1 }).addTo(map);

  map.panTo(startLatLng);
}

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
  
  animateMarker(bikerMarker, [from.lat, from.lng], to);
  setMarkerHeading(bikerMarker,bearing);
  bufferCircle.setLatLng(to);
  
  if(currentPolyline) {
    const latlngs = currentPolyline.getLatLngs();
    latlngs.push(to);
    currentPolyline.setLatLngs(latlngs);
  }
  
  map.panTo(to,{animate:true});
}

function handleStartLive(payload) {
  if(currentPolyline) map.removeLayer(currentPolyline);
  if(startMarker) map.removeLayer(startMarker);
  if(endMarker) map.removeLayer(endMarker);
  
  const startPos = payload?.startLocation || (bikerMarker ? bikerMarker.getLatLng() : [12.9716,77.5946]);
  
  startMarker = L.marker(startPos, {
    icon: L.divIcon({
      className: '',
      html: '<div class="start-marker"></div>',
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    })
  }).addTo(map).bindPopup('<strong>Start Point</strong>');
  
  currentPolyline = L.polyline([startPos], {
    color: '#007bff',
    weight: 4,
    opacity: 0.8,
    smoothFactor: 1
  }).addTo(map);
}

function handleStopLive(payload) {
  if(currentPolyline && payload?.endLocation) {
    endMarker = L.marker(payload.endLocation, {
      icon: L.divIcon({
        className: '',
        html: '<div class="end-marker"></div>',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      })
    }).addTo(map).bindPopup('<strong>End Point</strong>');
  }
}

function handleDisplayHistorical(payload) {
  historicalPolylines.forEach(p => map.removeLayer(p));
  historicalPolylines = [];
  
  if(!payload?.tracks || !Array.isArray(payload.tracks)) return;
  
  payload.tracks.forEach(track => {
    if(!track.points || track.points.length < 2) return;
    
    const latlngs = track.points.map(p => [p.lat, p.lng]);
    const polyline = L.polyline(latlngs, {
      color: track.color || '#ff6b6b',
      weight: 3,
      opacity: 0.7,
      smoothFactor: 1
    }).addTo(map);
    
    const popupContent = \`
      <div class="popup-title">Drive Details</div>
      <div class="popup-detail"><strong>Date:</strong> \${track.date || 'N/A'}</div>
      <div class="popup-detail"><strong>Distance:</strong> \${track.distance || 'N/A'} km</div>
      <div class="popup-detail"><strong>Avg Speed:</strong> \${track.avgSpeed || 'N/A'} km/h</div>
      <div class="popup-detail"><strong>Duration:</strong> \${track.duration || 'N/A'}</div>
    \`;
    
    polyline.bindPopup(popupContent);
    polyline.on('click', function() {
      map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    });
    
    historicalPolylines.push(polyline);
    
    if(track.points[0]) {
      L.marker([track.points[0].lat, track.points[0].lng], {
        icon: L.divIcon({
          className: '',
          html: '<div class="start-marker"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).addTo(map);
    }
    
    if(track.points[track.points.length - 1]) {
      L.marker([track.points[track.points.length - 1].lat, track.points[track.points.length - 1].lng], {
        icon: L.divIcon({
          className: '',
          html: '<div class="end-marker"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).addTo(map);
    }
  });
  
  if(historicalPolylines.length > 0) {
    const group = L.featureGroup(historicalPolylines);
    map.fitBounds(group.getBounds(), { padding: [50, 50] });
  }
}

function handleHighlightTrack(payload) {
  if(!payload?.trackId) return;
  
  const polyline = historicalPolylines.find(p => p.options.trackId === payload.trackId);
  if(polyline) {
    polyline.setStyle({ color: '#ffc107', weight: 5, opacity: 1 });
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    polyline.openPopup();
    
    setTimeout(() => {
      polyline.setStyle({ color: '#ff6b6b', weight: 3, opacity: 0.7 });
    }, 3000);
  }
}

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

function handleMessage(msg){
  const {type,payload}=msg||{};
  if(type==='init') handleInit(payload);
  else if(type==='coord') handleCoord(payload);
  else if(type==='modeChange') payload.isDarkMode?updateMainMapButton('dark'):updateMainMapButton('osm');
  else if(type==='startLive') handleStartLive(payload);
  else if(type==='stopLive') handleStopLive(payload);
  else if(type==='displayHistorical') handleDisplayHistorical(payload);
  else if(type==='highlightTrack') handleHighlightTrack(payload);
  else if(type==='setRotation' && typeof payload?.deg==='number'){ 
    mapRotationDeg=payload.deg; 
    mapContainer.style.transform='rotate('+mapRotationDeg+'deg)'; 
    northArrow.style.transform='rotate('+(-mapRotationDeg)+'deg)'; 
  }
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