// ============================================================
// FocusFlight — Fokus-Timer im Flug-Look, Karte = MapLibre-Globus.
// Daten lokal im localStorage. app.js kennt nur GlobeMap (siehe map.js).
// ============================================================

// ---------- Zustand ----------
const selection = { from: "FRA", to: "LHR", seat: "economy", focus: "work", duration: 45 };
let pickMode = "from";        // naechster Karten-Tipp setzt Abflug oder Ziel
let activeFlight = null;       // laufender Flug
let tickHandle = null;
let flightProgress = 0;        // 0..1
let mapReady = false;
let wakeLock = null;           // haelt den Bildschirm waehrend des Flugs an

// ---------- Bildschirm wach halten (Wake Lock) ----------
async function requestWakeLock() {
  try { if ("wakeLock" in navigator) wakeLock = await navigator.wakeLock.request("screen"); }
  catch (e) { /* z.B. nicht erlaubt — kein Problem */ }
}
function releaseWakeLock() {
  try { if (wakeLock) wakeLock.release(); } catch (e) {}
  wakeLock = null;
}
// Nach App-Wechsel zurueck: Lock erneut anfordern, wenn ein Flug laeuft
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && activeFlight && !activeFlight.paused) requestWakeLock();
});

// ---------- Karten-Offline-Hinweis ----------
const showMapOffline = () => $("#map-offline").classList.add("show");
const hideMapOffline = () => $("#map-offline").classList.remove("show");

// ---------- Hilfsfunktionen ----------
const $ = (sel) => document.querySelector(sel);
const airportByCode = (c) => AIRPORTS.find((a) => a.code === c);
const seatById = (id) => SEAT_CLASSES.find((s) => s.id === id);
const focusById = (id) => FOCUS_TYPES.find((f) => f.id === id);
const coordOf = (c) => { const a = airportByCode(c); return [a.lon, a.lat]; };

const milesFor = (min, seatId) => Math.round(min * seatById(seatId).mult);
const reachKm = () => Math.round((selection.duration / 60) * AVG_SPEED_KMH);

function isReachable(code) {
  if (code === selection.from) return true;
  const f = airportByCode(selection.from), t = airportByCode(code);
  return distanceKm(f.lon, f.lat, t.lon, t.lat) <= reachKm();
}
function routeDistance() {
  const f = airportByCode(selection.from), t = airportByCode(selection.to);
  return distanceKm(f.lon, f.lat, t.lon, t.lat);
}
function rankFor(miles) {
  let cur = RANKS[0];
  for (const r of RANKS) if (miles >= r.min) cur = r;
  return cur;
}
function formatTime(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ---------- Persistenz ----------
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { console.warn("Laden fehlgeschlagen:", e); }
  return { flights: [], totalMiles: 0, active: null };
}
const saveData = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
let store = loadData();

// ---------- Screen-/Panel-Navigation ----------
function showScreen(name) {
  document.querySelectorAll(".overlay").forEach((o) => o.classList.remove("is-active"));
  if (name === "tickets") { $("#screen-tickets").classList.add("is-active"); renderTickets(); }
  if (name === "stats") { $("#screen-stats").classList.add("is-active"); renderStats(); }
  document.querySelectorAll(".tab").forEach((t) =>
    t.classList.toggle("is-active", t.dataset.screen === name));
}
function showPanel(name) {
  ["booking", "flight", "summary"].forEach((p) =>
    $("#panel-" + p).classList.toggle("is-active", p === name));
}
function showStep(name) {
  document.querySelectorAll("#panel-booking .step").forEach((s) =>
    s.classList.toggle("is-active", s.dataset.step === name));
}

// ---------- Buchungs-UI ----------
function fillAirportSelects() {
  const opts = AIRPORTS.map((a) => `<option value="${a.code}">${a.city} (${a.code})</option>`).join("");
  $("#select-from").innerHTML = opts;
  $("#select-to").innerHTML = opts;
}
function renderRouteSummary() {
  const f = airportByCode(selection.from), t = airportByCode(selection.to);
  $("#route-summary").innerHTML =
    `<b>${f.code}</b> ${f.city} &nbsp;→&nbsp; <b>${t.code}</b> ${t.city} ` +
    `<span class="rs-dist">· ${routeDistance().toLocaleString("de-DE")} km</span>`;
}
function updateReachInfo() {
  const reach = reachKm();
  const count = AIRPORTS.filter((a) => a.code !== selection.from && isReachable(a.code)).length;
  $("#reach-info").innerHTML =
    `Reichweite <b>~${reach.toLocaleString("de-DE")} km</b> · ${count} erreichbar` +
    (isReachable(selection.to) ? "" : ` · <span class="reach-warn">Ziel zu weit</span>`);
}
function updateMapHint() {
  $("#map-hint").textContent = pickMode === "from"
    ? "Tippe einen Flughafen für den Abflug ✈"
    : "Jetzt das Ziel antippen 🎯";
}
function renderSeatGrid() {
  $("#seat-grid").innerHTML = SEAT_CLASSES.map((s) => `
    <div class="pick-card ${s.id === selection.seat ? "is-selected" : ""}" data-seat="${s.id}">
      <div class="pc-icon">${s.icon}</div><div class="pc-title">${s.title}</div>
      <div class="pc-sub">${s.sub}</div><div class="pc-badge">×${s.mult} Meilen</div>
    </div>`).join("");
}
function renderFocusGrid() {
  $("#focus-grid").innerHTML = FOCUS_TYPES.map((f) => `
    <div class="pick-card ${f.id === selection.focus ? "is-selected" : ""}" data-focus="${f.id}">
      <div class="pc-icon">${f.icon}</div><div class="pc-title">${f.title}</div>
    </div>`).join("");
}
function renderBoardingPass() {
  const f = airportByCode(selection.from), t = airportByCode(selection.to);
  const seat = seatById(selection.seat), focus = focusById(selection.focus);
  $("#boarding-pass").innerHTML = `
    <div class="bp-top">
      <div><div class="bp-code">${f.code}</div><div class="bp-city">${f.city}</div></div>
      <div class="bp-plane">✈</div>
      <div><div class="bp-code">${t.code}</div><div class="bp-city">${t.city}</div></div>
    </div>
    <div class="bp-grid">
      <div><span class="bp-k">Klasse</span><span class="bp-v">${seat.title}</span></div>
      <div><span class="bp-k">Fokus</span><span class="bp-v">${focus.icon} ${focus.title}</span></div>
      <div><span class="bp-k">Dauer</span><span class="bp-v">${selection.duration} min</span></div>
      <div><span class="bp-k">Distanz</span><span class="bp-v">${routeDistance().toLocaleString("de-DE")} km</span></div>
      <div><span class="bp-k">Meilen</span><span class="bp-v">★ ${milesFor(selection.duration, selection.seat)}</span></div>
    </div>`;
}

// Reichweiten-Ring, Route und Pins auf der Karte aktualisieren
function updateBookingOverlays() {
  if (!mapReady) return;
  GlobeMap.setReach(reachCircle(coordOf(selection.from), reachKm()) || []);
  GlobeMap.setRoute(greatCircleArc(coordOf(selection.from), coordOf(selection.to)));
  GlobeMap.setRouteBg([]);
  GlobeMap.updateAirports(selection.from, selection.to, isReachable);
}
// Alles in Schritt 1 auf einen Stand bringen
function syncRoute() {
  $("#select-from").value = selection.from;
  $("#select-to").value = selection.to;
  renderRouteSummary();
  updateReachInfo();
  updateMapHint();
  updateBookingOverlays();
}
function recenterToOrigin() {
  if (mapReady) GlobeMap.flyTo(...coordOf(selection.from), 2.4);
}

// Auswahl per Karten-Pin
function pickAirport(code) {
  if (pickMode === "from") {
    if (code === selection.to) selection.to = selection.from;
    selection.from = code;
    pickMode = "to";
    recenterToOrigin();
  } else {
    if (code === selection.from) selection.from = selection.to;
    selection.to = code;
    pickMode = "from";
  }
  syncRoute();
}

// ---------- Flug-Ablauf ----------
function startFlight() {
  if (selection.from === selection.to) { alert("Abflug und Ziel duerfen nicht gleich sein."); return; }
  const now = Date.now();
  activeFlight = {
    from: selection.from, to: selection.to, seat: selection.seat,
    focus: selection.focus, duration: selection.duration,
    endsAt: now + selection.duration * 60 * 1000, paused: false, pausedAt: null,
  };
  store.active = activeFlight; saveData();
  flightProgress = 0;
  enterFlightView();
  startTicking();
}
function enterFlightView() {
  showScreen("map");
  showPanel("flight");
  const f = airportByCode(activeFlight.from), t = airportByCode(activeFlight.to);
  $("#flight-route-line").textContent = `${f.city} → ${t.city}`;
  $("#flight-meta").textContent =
    `${seatById(activeFlight.seat).title} · ${focusById(activeFlight.focus).icon} ${focusById(activeFlight.focus).title}`;
  $("#pause-btn").textContent = activeFlight.paused ? "Weiter" : "Pause";
  if (mapReady) { GlobeMap.setReach([]); GlobeMap.flyTo(f.lon, f.lat, 3.2); }
  if (!activeFlight.paused) requestWakeLock();
}
function startTicking() { clearInterval(tickHandle); tick(); tickHandle = setInterval(tick, 1000); }

function tick() {
  if (!activeFlight || activeFlight.paused) return;
  const totalMs = activeFlight.duration * 60 * 1000;
  const remaining = Math.max(0, activeFlight.endsAt - Date.now());
  flightProgress = Math.min(1, 1 - remaining / totalMs);

  $("#timer").textContent = formatTime(Math.ceil(remaining / 1000));
  $("#progress-fill").style.width = (flightProgress * 100).toFixed(1) + "%";

  if (mapReady) {
    const A = coordOf(activeFlight.from), B = coordOf(activeFlight.to);
    const full = greatCircleArc(A, B, 80);
    const k = Math.max(1, Math.floor(flightProgress * 80));
    const cur = greatCirclePoint(A, B, flightProgress);
    GlobeMap.setRouteBg(full);
    GlobeMap.setRoute(full.slice(0, k + 1).concat([cur]));
    const ahead = greatCirclePoint(A, B, Math.min(1, flightProgress + 0.01));
    GlobeMap.showPlane(cur[0], cur[1], bearingDeg(cur, ahead));
    GlobeMap.flyTo(cur[0], cur[1]);
  }
  if (remaining <= 0) landFlight();
}
function togglePause() {
  if (!activeFlight) return;
  if (activeFlight.paused) {
    activeFlight.endsAt += Date.now() - activeFlight.pausedAt;
    activeFlight.paused = false; activeFlight.pausedAt = null;
    $("#pause-btn").textContent = "Pause";
    requestWakeLock();
  } else {
    activeFlight.paused = true; activeFlight.pausedAt = Date.now();
    $("#pause-btn").textContent = "Weiter";
    releaseWakeLock();
  }
  store.active = activeFlight; saveData();
}
function abortFlight() {
  if (!confirm("Notlandung einleiten? Dieser Flug bringt keine Meilen.")) return;
  clearInterval(tickHandle);
  releaseWakeLock();
  activeFlight = null; store.active = null; saveData();
  backToBooking();
}
function landFlight() {
  clearInterval(tickHandle);
  releaseWakeLock();
  const f = activeFlight;
  const miles = milesFor(f.duration, f.seat);
  const oldRank = rankFor(store.totalMiles);
  store.flights.unshift({
    id: Date.now(), date: new Date().toISOString(),
    from: f.from, to: f.to, seat: f.seat, focus: f.focus, duration: f.duration, miles,
  });
  store.totalMiles += miles;
  store.active = null; activeFlight = null; saveData();
  renderHeader();
  if (mapReady) GlobeMap.hidePlane();
  const newRank = rankFor(store.totalMiles);
  $("#summary-sub").textContent =
    `${airportByCode(f.from).city} → ${airportByCode(f.to).city} · ${f.duration} min ${focusById(f.focus).title}`;
  $("#summary-miles").textContent = `+ ${miles} Meilen ★`;
  $("#summary-rankup").textContent = newRank.name !== oldRank.name ? `🎉 Neuer Rang: ${newRank.name}!` : "";
  showPanel("summary");
}
function backToBooking() {
  pickMode = "from";
  if (mapReady) GlobeMap.hidePlane();
  showScreen("map");
  showPanel("booking");
  showStep("route");
  syncRoute();
  recenterToOrigin();
}

// Laufenden Flug nach Reload fortsetzen (wird erst bei fertiger Karte gerufen)
function resumeIfActive() {
  if (!store.active) return;
  activeFlight = store.active;
  const totalMs = activeFlight.duration * 60 * 1000;
  const remaining = Math.max(0, activeFlight.endsAt - Date.now());
  if (!activeFlight.paused && remaining <= 0) { landFlight(); return; }
  flightProgress = Math.min(1, 1 - remaining / totalMs);
  enterFlightView();
  startTicking();
}

// ---------- Tickets & Statistik ----------
function renderTickets() {
  const list = $("#ticket-list");
  if (!store.flights.length) {
    $("#tickets-sub").textContent = "";
    list.innerHTML = `<div class="empty-state">Noch keine Fluege. Buche deinen ersten Fokus-Flug! ✈</div>`;
    return;
  }
  $("#tickets-sub").textContent = `${store.flights.length} abgeschlossene Fluege`;
  list.innerHTML = store.flights.map((f) => {
    const d = new Date(f.date).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
    return `<div class="ticket">
      <div><div class="t-route">${f.from} → ${f.to}</div>
        <div class="t-meta">${d} · ${seatById(f.seat).title} · ${focusById(f.focus).icon} ${f.duration} min</div></div>
      <div class="t-miles">★ ${f.miles}</div></div>`;
  }).join("");
}
function renderStats() {
  const totalMin = store.flights.reduce((s, f) => s + f.duration, 0);
  const rank = rankFor(store.totalMiles);
  $("#stats-grid").innerHTML = `
    <div class="stat-card"><div class="s-val">${store.flights.length}</div><div class="s-label">Fluege</div></div>
    <div class="stat-card"><div class="s-val">${store.totalMiles}</div><div class="s-label">Meilen</div></div>
    <div class="stat-card"><div class="s-val">${(totalMin / 60).toFixed(1)} h</div><div class="s-label">Fokuszeit</div></div>
    <div class="stat-card"><div class="s-val">${rank.name}</div><div class="s-label">Rang</div></div>`;
  const counts = {};
  store.flights.forEach((f) => { const k = `${f.from} → ${f.to}`; counts[k] = (counts[k] || 0) + 1; });
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  $("#route-stats").innerHTML = rows.length
    ? rows.map(([r, n]) => `<div class="route-stat-row"><span>${r}</span><span>${n}×</span></div>`).join("")
    : `<div class="empty-state">Noch keine Routen geflogen.</div>`;
}
function renderHeader() {
  $("#miles-total").textContent = store.totalMiles;
  $("#rank-badge").textContent = rankFor(store.totalMiles).name;
}

// ---------- Events ----------
function wireEvents() {
  document.querySelectorAll(".tab").forEach((t) =>
    t.addEventListener("click", () => showScreen(t.dataset.screen)));

  // Schritt 1: Dauer-Regler
  $("#duration-range").addEventListener("input", (e) => {
    selection.duration = Number(e.target.value);
    $("#duration-value").textContent = `${selection.duration} min`;
    updateReachInfo();
    updateBookingOverlays();
  });
  // Schritt 1: Dropdowns + Tausch
  $("#select-from").addEventListener("change", (e) => {
    const v = e.target.value;
    if (v === selection.to) selection.to = selection.from;
    selection.from = v; recenterToOrigin(); syncRoute();
  });
  $("#select-to").addEventListener("change", (e) => {
    const v = e.target.value;
    if (v === selection.from) selection.from = selection.to;
    selection.to = v; syncRoute();
  });
  $("#swap-btn").addEventListener("click", () => {
    [selection.from, selection.to] = [selection.to, selection.from];
    recenterToOrigin(); syncRoute();
  });
  $("#to-seat-btn").addEventListener("click", () => {
    if (selection.from === selection.to) { alert("Abflug und Ziel duerfen nicht gleich sein."); return; }
    renderSeatGrid(); showStep("seat");
  });

  // Schritt 2: Sitzklasse
  $("#seat-grid").addEventListener("click", (e) => {
    const c = e.target.closest("[data-seat]"); if (!c) return;
    selection.seat = c.dataset.seat; renderSeatGrid();
  });
  $("#to-focus-btn").addEventListener("click", () => { renderFocusGrid(); showStep("focus"); });

  // Schritt 3: Fokus-Art
  $("#focus-grid").addEventListener("click", (e) => {
    const c = e.target.closest("[data-focus]"); if (!c) return;
    selection.focus = c.dataset.focus; renderFocusGrid();
  });
  $("#to-confirm-btn").addEventListener("click", () => { renderBoardingPass(); showStep("confirm"); });

  document.querySelectorAll("[data-goto]").forEach((b) =>
    b.addEventListener("click", () => showStep(b.dataset.goto)));

  $("#depart-btn").addEventListener("click", startFlight);
  $("#pause-btn").addEventListener("click", togglePause);
  $("#abort-btn").addEventListener("click", abortFlight);
  $("#summary-done-btn").addEventListener("click", backToBooking);

  $("#reset-btn").addEventListener("click", () => {
    if (!confirm("Wirklich alle Fluege, Meilen und Tickets loeschen?")) return;
    store = { flights: [], totalMiles: 0, active: null }; saveData();
    renderHeader(); renderStats(); renderTickets();
  });
}

// ---------- Start ----------
function init() {
  fillAirportSelects();
  $("#duration-range").value = selection.duration;
  $("#duration-value").textContent = `${selection.duration} min`;
  renderHeader();
  wireEvents();
  showScreen("map");
  showPanel("booking");
  syncRoute(); // baut die textuellen Teile schon ohne Karte
  startMap();

  // Service Worker registrieren (macht die App installierbar) — nur ueber https
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
}

// Karte starten; bei fehlendem Netz/CDN freundlich degradieren
function startMap() {
  if (typeof maplibregl === "undefined") { showMapOffline(); return; }
  let ready = false;
  const timeout = setTimeout(() => { if (!ready) showMapOffline(); }, 9000);
  GlobeMap.init(() => {
    ready = true;
    clearTimeout(timeout);
    hideMapOffline();
    mapReady = true;
    GlobeMap.addAirports(AIRPORTS, pickAirport);
    updateBookingOverlays();
    GlobeMap.flyTo(...coordOf(selection.from), 2.4);
    resumeIfActive();
  });
}

init();
