// ============================================================
// Karten-Schicht auf Basis von MapLibre GL JS (gratis, ohne API-Key).
// Stile von OpenFreeMap (heller Apple-Look) + Globus-Projektion.
// Kapselt alles Karten-Spezifische, damit app.js davon nichts wissen muss.
// ============================================================

const GlobeMap = (() => {
  let map = null;
  let planeMarker = null;
  let started = false;     // onReady nur einmal ausloesen
  let redraw = null;       // App-Callback, um Overlays neu zu zeichnen
  const airportEls = {};   // code -> DOM-Element des Pins

  const emptyFC = () => ({ type: "FeatureCollection", features: [] });
  const lineFeature = (coords) => ({
    type: "Feature", geometry: { type: "LineString", coordinates: coords }, properties: {},
  });

  // Linien-Quelle + Ebene anlegen (idempotent: nach Stilwechsel erneut noetig)
  function addLine(id, paint) {
    if (map.getSource(id)) return;
    map.addSource(id, { type: "geojson", data: emptyFC() });
    map.addLayer({ id, type: "line", source: id, layout: { "line-cap": "round", "line-join": "round" }, paint });
  }
  function addOverlayLayers() {
    addLine("reach", { "line-color": "#f5a623", "line-width": 2.5, "line-dasharray": [2, 2], "line-opacity": 0.9 });
    addLine("route-bg", { "line-color": "#2e7df0", "line-width": 2, "line-dasharray": [1.5, 2.5], "line-opacity": 0.5 });
    addLine("route", { "line-color": "#2e7df0", "line-width": 4 });
  }
  function setLine(id, coords) {
    const src = map.getSource(id);
    if (src) src.setData(coords && coords.length ? lineFeature(coords) : emptyFC());
  }

  // Karte initialisieren; onReady wird gerufen, sobald Stil + Ebenen stehen
  function init(styleUrl, onReady, onError) {
    map = new maplibregl.Map({
      container: "map", style: styleUrl,
      center: [10, 35], zoom: 1.6,
      attributionControl: { compact: true }, dragRotate: true,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");
    if (onError) map.on("error", onError);

    // Feuert beim ersten Laden UND nach jedem Stilwechsel
    map.on("style.load", () => {
      map.setProjection({ type: "globe" });
      addOverlayLayers();
      if (redraw) redraw();
      if (!started) { started = true; onReady(); }
    });
  }

  // Kartenstil wechseln (Pins/Flugzeug bleiben, Ebenen werden neu aufgebaut)
  function setStyleUrl(url) { map.setStyle(url); }
  const setRedraw = (fn) => { redraw = fn; };

  // Alle Flughaefen als anklickbare Pins anlegen (einmalig)
  function addAirports(airports, onPick) {
    airports.forEach((a) => {
      const el = document.createElement("div");
      el.className = "pin";
      el.innerHTML = `<span class="pin-dot"></span><span class="pin-label">${a.code}</span>`;
      el.addEventListener("click", (e) => { e.stopPropagation(); onPick(a.code); });
      new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([a.lon, a.lat]).addTo(map);
      airportEls[a.code] = el;
    });
  }
  // Rollen/Erreichbarkeit der Pins aktualisieren
  function updateAirports(fromCode, toCode, isReachable) {
    Object.keys(airportEls).forEach((code) => {
      const el = airportEls[code];
      el.classList.toggle("is-from", code === fromCode);
      el.classList.toggle("is-to", code === toCode);
      el.classList.toggle("out", code !== fromCode && code !== toCode && !isReachable(code));
    });
  }

  const setRoute = (c) => setLine("route", c);
  const setRouteBg = (c) => setLine("route-bg", c);
  const setReach = (c) => setLine("reach", c);

  function flyTo(lon, lat, zoom) {
    map.easeTo({ center: [lon, lat], zoom: zoom != null ? zoom : map.getZoom(), duration: 800 });
  }
  function showPlane(lon, lat, bearing) {
    if (!planeMarker) {
      const el = document.createElement("div");
      el.className = "plane-marker"; el.textContent = "✈";
      planeMarker = new maplibregl.Marker({ element: el, rotationAlignment: "map" });
    }
    planeMarker.setLngLat([lon, lat]).setRotation((bearing || 0) - 45).addTo(map);
  }
  function hidePlane() { if (planeMarker) planeMarker.remove(); }

  return {
    init, setStyleUrl, setRedraw, addAirports, updateAirports,
    setRoute, setRouteBg, setReach, flyTo, showPlane, hidePlane,
    get raw() { return map; },
  };
})();
