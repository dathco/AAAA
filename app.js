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
// Fehlende Felder ergaenzen, damit aeltere/importierte Daten kompatibel sind
function normalize(data) {
  const d = data || {};
  d.flights = Array.isArray(d.flights) ? d.flights : [];
  d.totalMiles = d.totalMiles || 0;
  d.active = d.active || null;
  d.settings = Object.assign({ sound: true, dailyGoalMin: 60 }, d.settings || {});
  d.streak = Object.assign({ count: 0, lastDay: null }, d.streak || {});
  return d;
}
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (e) { console.warn("Laden fehlgeschlagen:", e); }
  return normalize(null);
}
const saveData = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
let store = loadData();

// ---------- Sounds (Web Audio, ohne Dateien) ----------
let audioCtx = null;
function ensureAudio() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch (e) {}
}
function beep(freq, start, dur, gain = 0.18) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = "sine"; o.frequency.value = freq;
  o.connect(g); g.connect(audioCtx.destination);
  const t = audioCtx.currentTime + start;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.start(t); o.stop(t + dur);
}
function playTakeoff() { if (!store.settings.sound) return; ensureAudio(); beep(330, 0, .3); beep(440, .18, .3); beep(660, .36, .5); }
function playLanding() { if (!store.settings.sound) return; ensureAudio(); beep(660, 0, .3); beep(440, .18, .3); beep(330, .36, .6); }

// ---------- Streak (Tage in Folge) ----------
const todayStr = () => new Date().toISOString().slice(0, 10);
function updateStreak() {
  const t = todayStr();
  if (store.streak.lastDay === t) return; // heute schon geflogen
  const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  store.streak.count = store.streak.lastDay === yest ? store.streak.count + 1 : 1;
  store.streak.lastDay = t;
}
const minutesToday = () =>
  store.flights.filter((f) => f.date.slice(0, 10) === todayStr()).reduce((s, f) => s + f.duration, 0);

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
  ensureAudio(); playTakeoff(); // Klick = erlaubte Audio-Geste
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
  updateStreak();
  store.active = null; activeFlight = null; saveData();
  renderHeader();
  playLanding();
  if (mapReady) GlobeMap.hidePlane();
  const newRank = rankFor(store.totalMiles);
  $("#summary-sub").textContent =
    `${airportByCode(f.from).city} → ${airportByCode(f.to).city} · ${f.duration} min ${focusById(f.focus).title}`;
  $("#summary-miles").textContent = `+ ${miles} Meilen ★`;
  $("#summary-rankup").textContent = newRank.name !== oldRank.name ? `🎉 Neuer Rang: ${newRank.name}!` : "";
  $("#flight-note").value = ""; // Notizfeld fuer den neuen Flug leeren
  showPanel("summary");
}

// Notiz des zuletzt gelandeten Flugs speichern
function saveFlightNote() {
  const note = $("#flight-note").value.trim();
  if (note && store.flights[0]) { store.flights[0].note = note; saveData(); }
}
function backToBooking() {
  saveFlightNote();
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
    const note = f.note ? `<div class="t-note">„${f.note}"</div>` : "";
    return `<div class="ticket">
      <div><div class="t-route">${f.from} → ${f.to}</div>
        <div class="t-meta">${d} · ${seatById(f.seat).title} · ${focusById(f.focus).icon} ${f.duration} min</div>${note}</div>
      <div class="t-miles">★ ${f.miles}</div></div>`;
  }).join("");
}
function renderDailyGoal() {
  const goal = store.settings.dailyGoalMin;
  const done = minutesToday();
  const pct = Math.min(100, goal ? (done / goal) * 100 : 0);
  $("#goal-label").textContent = `${done} / ${goal} min heute` +
    (store.streak.count ? ` · 🔥 ${store.streak.count} Tage` : "");
  $("#goal-fill").style.width = pct.toFixed(0) + "%";
  $("#goal-input").value = goal;
  $("#sound-toggle").checked = !!store.settings.sound;
}
function renderAchievements() {
  $("#ach-grid").innerHTML = ACHIEVEMENTS.map((a) => {
    const got = a.test(store);
    return `<div class="ach ${got ? "got" : ""}" title="${a.desc}">
      <div class="ach-icon">${a.icon}</div><div class="ach-title">${a.title}</div>
      <div class="ach-desc">${a.desc}</div></div>`;
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
  renderDailyGoal();
  renderAchievements();
}

// ---------- Export / Import ----------
function exportData() {
  const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "focusflight-backup.json"; a.click();
  URL.revokeObjectURL(url);
}
function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || !Array.isArray(data.flights)) throw new Error("ungueltig");
      store = normalize(data); saveData();
      renderHeader(); renderStats(); renderTickets();
      alert("Daten importiert ✅");
    } catch (e) { alert("Import fehlgeschlagen — keine gueltige Backup-Datei."); }
  };
  reader.readAsText(file);
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
    store = normalize(null); saveData();
    renderHeader(); renderStats(); renderTickets();
  });

  // Einstellungen
  $("#sound-toggle").addEventListener("change", (e) => { store.settings.sound = e.target.checked; saveData(); });
  $("#goal-input").addEventListener("change", (e) => {
    store.settings.dailyGoalMin = Math.max(15, Number(e.target.value) || 60);
    saveData(); renderDailyGoal();
  });
  $("#export-btn").addEventListener("click", exportData);
  $("#import-file").addEventListener("change", (e) => { if (e.target.files[0]) importData(e.target.files[0]); });

  // Notiz speichern, sobald man das Feld verlaesst
  $("#flight-note").addEventListener("blur", saveFlightNote);
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
