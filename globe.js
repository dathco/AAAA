// ============================================================
// 3D-Globus per orthografischer Projektion (reines Vanilla-JS).
// Keine Bibliothek, keine Karten-Tiles — die Weltkarte (WORLD_LAND)
// wird bei jeder Drehung neu auf die Kugel gerechnet.
// ============================================================

const DEG = Math.PI / 180;

// Projiziert einen Erdpunkt (lon/lat) auf eine Kugel, die auf
// (cLon, cLat) zentriert ist. visible=false => Punkt liegt hinten.
function orthoProject(lon, lat, cLon, cLat, R) {
  const dl = (lon - cLon) * DEG;
  const la = lat * DEG;
  const cl = cLat * DEG;
  const cosc = Math.sin(cl) * Math.sin(la) + Math.cos(cl) * Math.cos(la) * Math.cos(dl);
  const x = R * Math.cos(la) * Math.sin(dl);
  const y = R * (Math.cos(cl) * Math.sin(la) - Math.sin(cl) * Math.cos(la) * Math.cos(dl));
  return { x, y, visible: cosc >= 0 };
}

// Einen Punkt auf dem Grosskreis zwischen a und b im Anteil t (0..1)
function greatCirclePoint(a, b, t) {
  const toXYZ = (lon, lat) => {
    const l = lon * DEG, p = lat * DEG;
    return [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)];
  };
  const A = toXYZ(a.lon, a.lat);
  const B = toXYZ(b.lon, b.lat);
  let dot = A[0] * B[0] + A[1] * B[1] + A[2] * B[2];
  dot = Math.max(-1, Math.min(1, dot));
  const om = Math.acos(dot);
  let x, y, z;
  if (om < 1e-6) {
    [x, y, z] = A;
  } else {
    const s1 = Math.sin((1 - t) * om) / Math.sin(om);
    const s2 = Math.sin(t * om) / Math.sin(om);
    x = s1 * A[0] + s2 * B[0];
    y = s1 * A[1] + s2 * B[1];
    z = s1 * A[2] + s2 * B[2];
  }
  return { lon: Math.atan2(y, x) / DEG, lat: Math.asin(Math.max(-1, Math.min(1, z))) / DEG };
}

// Liste von [lon,lat]-Stuetzpunkten entlang des Grosskreises a -> b
function greatCircleArc(a, b, n = 60) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const p = greatCirclePoint(a, b, i / n);
    pts.push([p.lon, p.lat]);
  }
  return pts;
}

// Erzeugt einen interaktiven Globus an einer SVG-Flaeche.
// config: { landEl, center:{lon,lat}, radius, cx, cy, target (svg/Element fuer Drag),
//           interactive, onRender(api) }
function createGlobe(config) {
  const { landEl, radius, cx, cy } = config;
  const state = { lon: config.center.lon, lat: config.center.lat };
  let renderScheduled = false;
  let dragged = false; // wurde zuletzt gedreht (statt getippt)?

  // Erdpunkt -> Bildschirmkoordinaten relativ zum Kugelmittelpunkt
  function project(lon, lat) {
    const p = orthoProject(lon, lat, state.lon, state.lat, radius);
    return { x: cx + p.x, y: cy - p.y, visible: p.visible };
  }

  // Baut einen SVG-Pfad aus [lon,lat]-Punkten; unsichtbare Teile werden getrennt
  function buildPath(points) {
    let d = "";
    let drawing = false;
    for (const [lon, lat] of points) {
      const p = project(lon, lat);
      if (p.visible) {
        d += (drawing ? "L" : "M") + p.x.toFixed(1) + " " + p.y.toFixed(1);
        drawing = true;
      } else {
        drawing = false;
      }
    }
    return d;
  }

  // Komplette Landmasse projizieren
  function buildLand() {
    let d = "";
    for (const ring of WORLD_LAND) d += buildPath(ring);
    return d;
  }

  function render() {
    landEl.setAttribute("d", buildLand());
    if (config.onRender) config.onRender(api);
  }

  // Render per requestAnimationFrame buendeln (fluessiges Drehen)
  function scheduleRender() {
    if (renderScheduled) return;
    renderScheduled = true;
    requestAnimationFrame(() => {
      renderScheduled = false;
      render();
    });
  }

  function setCenter(lon, lat) {
    state.lon = lon;
    state.lat = Math.max(-85, Math.min(85, lat));
  }

  // ----- Drag-Steuerung (Maus + Touch via Pointer Events) -----
  // Bewusst ohne setPointerCapture, damit Antippen der Pins (click) weiter funktioniert.
  if (config.interactive && config.target) {
    const el = config.target;
    let dragging = false;
    let startX = 0, startY = 0, startLon = 0, startLat = 0;
    const SENS = 0.25; // Grad pro Pixel

    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 4) dragged = true;
      setCenter(startLon - dx * SENS, startLat + dy * SENS);
      scheduleRender();
    };
    const onUp = () => {
      dragging = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    el.addEventListener("pointerdown", (e) => {
      dragging = true;
      dragged = false;
      startX = e.clientX;
      startY = e.clientY;
      startLon = state.lon;
      startLat = state.lat;
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    });
  }

  const api = {
    project,
    buildPath,
    render,
    setCenter,
    radius,
    cx,
    cy,
    get center() { return { lon: state.lon, lat: state.lat }; },
    get dragged() { return dragged; },
  };
  return api;
}
