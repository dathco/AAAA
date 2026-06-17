// ============================================================
// Karten-Schicht auf Basis von MapLibre GL JS (gratis, ohne API-Key).
// Stil: OpenFreeMap "positron" (heller Apple-Look) + Globus-Projektion.
// Kapselt alles Karten-Spezifische, damit app.js davon nichts wissen muss.
// ============================================================

const GlobeMap = (() => {
  let map = null;
  let planeMarker = null;
  const airportEls = {}; // code -> DOM-Element des Pins

  const emptyFC = () => ({ type: "FeatureCollection", features: [] });
  const lineFeature = (coords) => ({
    type: "Feature",
    geometry: { type: "LineString", coordinates: coords },
    properties: {},
  });

  // Eine Linien-Quelle + zugehoerige Ebene anlegen
  function addLine(id, paint) {
    map.addSource(id, { type: "geojson", data: emptyFC() });
    map.addLayer({
      id,
      type: "line",
      source: id,
      layout: { "line-cap": "round", "line-join": "round" },
      paint,
    });
  }

  function setLine(id, coords) {
    const src = map.getSource(id);
    if (src) src.setData(coords && coords.length ? lineFeature(coords) : emptyFC());
  }

  // Karte initialisieren; onReady wird gerufen, sobald Stil + Ebenen stehen
  function init(onReady) {
    map = new maplibregl.Map({
      container: "map",
      style: "https://tiles.openfreemap.org/styles/positron",
      center: [10, 35],
      zoom: 1.6,
      attributionControl: { compact: true },
      dragRotate: true,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

    map.on("style.load", () => {
      map.setProjection({ type: "globe" }); // 3D-Globus aktivieren

      // Ebenen: Reichweiten-Ring (gold), Restroute (gestrichelt), geflogen (blau)
      addLine("reach", {
        "line-color": "#f5a623", "line-width": 2.5,
        "line-dasharray": [2, 2], "line-opacity": 0.9,
      });
      addLine("route-bg", {
        "line-color": "#2e7df0", "line-width": 2,
        "line-dasharray": [1.5, 2.5], "line-opacity": 0.5,
      });
      addLine("route", { "line-color": "#2e7df0", "line-width": 4 });

      onReady();
    });
  }

  // Alle Flughaefen als anklickbare Pins anlegen (einmalig)
  function addAirports(airports, onPick) {
    airports.forEach((a) => {
      const el = document.createElement("div");
      el.className = "pin";
      el.innerHTML = `<span class="pin-dot"></span><span class="pin-label">${a.code}</span>`;
      el.addEventListener("click", (e) => { e.stopPropagation(); onPick(a.code); });
      new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([a.lon, a.lat])
        .addTo(map);
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

  const setRoute = (coords) => setLine("route", coords);
  const setRouteBg = (coords) => setLine("route-bg", coords);
  const setReach = (coords) => setLine("reach", coords);

  // Sanft zu einer Position fliegen
  function flyTo(lon, lat, zoom) {
    map.easeTo({ center: [lon, lat], zoom: zoom != null ? zoom : map.getZoom(), duration: 800 });
  }

  // Flugzeug-Marker setzen/bewegen (bearing = Kurs in Grad)
  function showPlane(lon, lat, bearing) {
    if (!planeMarker) {
      const el = document.createElement("div");
      el.className = "plane-marker";
      el.textContent = "✈";
      planeMarker = new maplibregl.Marker({ element: el, rotationAlignment: "map" });
    }
    planeMarker.setLngLat([lon, lat]).setRotation((bearing || 0) - 45).addTo(map);
  }
  function hidePlane() { if (planeMarker) planeMarker.remove(); }

  return { init, addAirports, updateAirports, setRoute, setRouteBg, setReach, flyTo, showPlane, hidePlane,
           get raw() { return map; } };
})();
