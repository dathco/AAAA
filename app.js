// ============================================================
// FocusFlight — Fokus-Timer im Flug-Look (vanilla JS)
// Alle Daten liegen lokal im localStorage, kein Server noetig.
// ============================================================

// ---------- Stammdaten ----------

// Flughaefen mit echten Koordinaten (fuer Karte & Distanz)
const AIRPORTS = [
  { code: "FRA", city: "Frankfurt",    lat: 50.03, lon: 8.57 },
  { code: "BER", city: "Berlin",       lat: 52.36, lon: 13.50 },
  { code: "MUC", city: "Muenchen",     lat: 48.35, lon: 11.78 },
  { code: "LHR", city: "London",       lat: 51.47, lon: -0.45 },
  { code: "CDG", city: "Paris",        lat: 49.01, lon: 2.55 },
  { code: "BCN", city: "Barcelona",    lat: 41.30, lon: 2.08 },
  { code: "IST", city: "Istanbul",     lat: 41.28, lon: 28.75 },
  { code: "JFK", city: "New York",     lat: 40.64, lon: -73.78 },
  { code: "LAX", city: "Los Angeles",  lat: 33.94, lon: -118.41 },
  { code: "GRU", city: "Sao Paulo",    lat: -23.43, lon: -46.47 },
  { code: "DXB", city: "Dubai",        lat: 25.25, lon: 55.36 },
  { code: "SIN", city: "Singapur",     lat: 1.36, lon: 103.99 },
  { code: "HND", city: "Tokio",        lat: 35.55, lon: 139.78 },
  { code: "SYD", city: "Sydney",       lat: -33.95, lon: 151.18 },
  { code: "CPT", city: "Kapstadt",     lat: -33.97, lon: 18.60 },
];

// Sitzklassen mit Meilen-Multiplikator
const SEAT_CLASSES = [
  { id: "economy",  icon: "💺", title: "Economy",  mult: 1,   sub: "Solider Fokus" },
  { id: "business", icon: "🥂", title: "Business", mult: 1.5, sub: "Mehr Komfort" },
  { id: "first",    icon: "👑", title: "First",    mult: 2,   sub: "Maximale Meilen" },
];

// Fokus-Arten (rein kosmetisch, fuers Logbuch)
const FOCUS_TYPES = [
  { id: "work",     icon: "💼", title: "Arbeit" },
  { id: "study",    icon: "📚", title: "Lernen" },
  { id: "reading",  icon: "📖", title: "Lesen" },
  { id: "creative", icon: "🎨", title: "Kreativ" },
];

const DURATIONS = [15, 25, 45, 60, 90, 120]; // Minuten

// Rang-Stufen nach Gesamtmeilen
const RANKS = [
  { min: 0,     name: "Economy Flyer" },
  { min: 500,   name: "Silver" },
  { min: 1500,  name: "Gold" },
  { min: 4000,  name: "Platinum" },
  { min: 10000, name: "Diamond" },
];

const STORAGE_KEY = "focusflight_v1";

// ---------- Zustand ----------

// Auswahl der aktuellen Buchung
const selection = {
  from: "FRA",
  to: "JFK",
  seat: "economy",
  focus: "work",
  duration: 25,
};

// Laufender Flug (Timer-Referenzen)
let activeFlight = null;
let tickHandle = null;
let flightPathLength = 0;

// Welcher Punkt wird beim naechsten Karten-Tipp gesetzt?
let pickMode = "from"; // "from" oder "to"

// ---------- Datenpersistenz ----------

// Liest gespeicherte Daten oder liefert Startzustand
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Konnte Daten nicht laden:", e);
  }
  return { flights: [], totalMiles: 0, active: null };
}

// Schreibt Daten zurueck in den localStorage
function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let store = loadData();

// ---------- Hilfsfunktionen ----------

const $ = (sel) => document.querySelector(sel);
const airportByCode = (code) => AIRPORTS.find((a) => a.code === code);
const seatById = (id) => SEAT_CLASSES.find((s) => s.id === id);
const focusById = (id) => FOCUS_TYPES.find((f) => f.id === id);

// Grosskreis-Distanz zwischen zwei Flughaefen (Haversine, in km)
function distanceKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

// Meilen einer Session = Minuten * Klassen-Multiplikator
function milesFor(durationMin, seatId) {
  return Math.round(durationMin * seatById(seatId).mult);
}

// Aktueller Rang anhand der Gesamtmeilen
function rankFor(miles) {
  let current = RANKS[0];
  for (const r of RANKS) if (miles >= r.min) current = r;
  return current;
}

// Sekunden huebsch als MM:SS formatieren
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Equirektangulare Projektion: lat/lon -> SVG-Koordinaten (viewBox 1000x500)
function project(airport) {
  const x = ((airport.lon + 180) / 360) * 1000;
  const y = ((90 - airport.lat) / 180) * 500;
  return { x, y };
}

// ---------- Navigation zwischen Screens ----------

function showScreen(name) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("is-active"));
  $("#screen-" + name).classList.add("is-active");
  document.querySelectorAll(".tab").forEach((t) =>
    t.classList.toggle("is-active", t.dataset.screen === name)
  );
  if (name === "tickets") renderTickets();
  if (name === "stats") renderStats();
}

function showStep(name) {
  document.querySelectorAll("#screen-booking .step").forEach((s) =>
    s.classList.toggle("is-active", s.dataset.step === name)
  );
}

// ---------- Buchungs-UI aufbauen ----------

// Fuellt die beiden Flughafen-Dropdowns
function fillAirportSelects() {
  const options = AIRPORTS.map(
    (a) => `<option value="${a.code}">${a.city} (${a.code})</option>`
  ).join("");
  $("#select-from").innerHTML = options;
  $("#select-to").innerHTML = options;
  $("#select-from").value = selection.from;
  $("#select-to").value = selection.to;
}

// Zeigt Distanz & grobe Flugrichtung in der Vorschau
function renderRoutePreview() {
  const from = airportByCode(selection.from);
  const to = airportByCode(selection.to);
  const dist = distanceKm(from, to);
  $("#route-preview").innerHTML = `
    <div><b>${from.code}</b>${from.city}</div>
    <div>✈<br><span>${dist.toLocaleString("de-DE")} km</span></div>
    <div><b>${to.code}</b>${to.city}</div>`;
}

// Setzt die eingebettete Weltkarte (WORLD_PATH) in alle Karten-Flaechen
function setLandPaths() {
  document.querySelectorAll(".map-land").forEach((p) => p.setAttribute("d", WORLD_PATH));
}

// Markierung eines Flughafens: Apple-Pin (gewaehlt) oder kleiner Punkt
function airportMarker(a) {
  const p = project(a);
  const role = a.code === selection.from ? "is-from" : a.code === selection.to ? "is-to" : "";
  if (role) {
    // Tropfenfoermiger Pin mit Spitze direkt auf dem Flughafen
    const x = p.x, y = p.y;
    const pin = `M ${x} ${y} L ${x - 6} ${y - 16} A 9 9 0 1 1 ${x + 6} ${y - 16} Z`;
    return `
      <g class="ap ${role}" data-code="${a.code}">
        <circle class="ap-hit" cx="${x}" cy="${y - 14}" r="24" />
        <path class="ap-pin" d="${pin}" />
        <circle class="ap-pin-dot" cx="${x}" cy="${y - 22}" r="3.4" />
        <text class="ap-code" x="${Math.min(x + 12, 952)}" y="${y - 19}">${a.code}</text>
      </g>`;
  }
  return `
    <g class="ap" data-code="${a.code}">
      <circle class="ap-hit" cx="${p.x}" cy="${p.y}" r="20" />
      <circle class="ap-dot" cx="${p.x}" cy="${p.y}" r="5" />
      <text class="ap-code" x="${Math.min(p.x + 8, 958)}" y="${p.y - 7}">${a.code}</text>
    </g>`;
}

// Zeichnet die anklickbare Buchungs-Karte (Route + Flughaefen)
function renderBookingMap() {
  // Gebogene Route zwischen aktueller Auswahl
  const p1 = project(airportByCode(selection.from));
  const p2 = project(airportByCode(selection.to));
  const cx = (p1.x + p2.x) / 2;
  const cy = (p1.y + p2.y) / 2 - Math.abs(p2.x - p1.x) * 0.18 - 40;
  const d = `M ${p1.x} ${p1.y} Q ${cx} ${cy} ${p2.x} ${p2.y}`;
  $("#booking-path-bg").setAttribute("d", d);
  $("#booking-path").setAttribute("d", d);

  // Alle Flughaefen als anklickbare Marker
  $("#booking-airports").innerHTML = AIRPORTS.map(airportMarker).join("");
}

// Hinweistext: was wird als naechstes ausgewaehlt?
function updateMapHint() {
  $("#map-hint").textContent =
    pickMode === "from"
      ? "Tippe einen Flughafen fuer den Abflug ✈"
      : "Jetzt das Ziel antippen 🎯";
}

// Karte, Dropdowns und Vorschau auf einen Stand bringen
function syncRouteUI() {
  $("#select-from").value = selection.from;
  $("#select-to").value = selection.to;
  renderBookingMap();
  renderRoutePreview();
  updateMapHint();
}

// Baut die Sitzklassen-Karten
function renderSeatGrid() {
  $("#seat-grid").innerHTML = SEAT_CLASSES.map(
    (s) => `
    <div class="pick-card ${s.id === selection.seat ? "is-selected" : ""}" data-seat="${s.id}">
      <div class="pc-icon">${s.icon}</div>
      <div class="pc-title">${s.title}</div>
      <div class="pc-sub">${s.sub}</div>
      <div class="pc-badge">×${s.mult} Meilen</div>
    </div>`
  ).join("");
}

// Baut die Fokus-Arten-Karten
function renderFocusGrid() {
  $("#focus-grid").innerHTML = FOCUS_TYPES.map(
    (f) => `
    <div class="pick-card ${f.id === selection.focus ? "is-selected" : ""}" data-focus="${f.id}">
      <div class="pc-icon">${f.icon}</div>
      <div class="pc-title">${f.title}</div>
    </div>`
  ).join("");
}

// Baut die Dauer-Chips
function renderDurationOptions() {
  $("#duration-options").innerHTML = DURATIONS.map(
    (d) => `
    <button class="dur-chip ${d === selection.duration ? "is-selected" : ""}" data-dur="${d}">
      ${d} min
    </button>`
  ).join("");
}

// Baut den Boarding-Pass aus der aktuellen Auswahl
function renderBoardingPass() {
  const from = airportByCode(selection.from);
  const to = airportByCode(selection.to);
  const seat = seatById(selection.seat);
  const focus = focusById(selection.focus);
  const miles = milesFor(selection.duration, selection.seat);
  $("#boarding-pass").innerHTML = `
    <div class="bp-top">
      <div class="bp-airports">
        <div><div class="bp-code">${from.code}</div><div class="bp-city">${from.city}</div></div>
        <div class="bp-plane">✈</div>
        <div><div class="bp-code">${to.code}</div><div class="bp-city">${to.city}</div></div>
      </div>
    </div>
    <div class="bp-grid">
      <div class="bp-item"><div class="bp-k">Klasse</div><div class="bp-v">${seat.title}</div></div>
      <div class="bp-item"><div class="bp-k">Fokus</div><div class="bp-v">${focus.icon} ${focus.title}</div></div>
      <div class="bp-item"><div class="bp-k">Dauer</div><div class="bp-v">${selection.duration} min</div></div>
      <div class="bp-item"><div class="bp-k">Distanz</div><div class="bp-v">${distanceKm(from, to).toLocaleString("de-DE")} km</div></div>
      <div class="bp-item"><div class="bp-k">Meilen</div><div class="bp-v">★ ${miles}</div></div>
      <div class="bp-item"><div class="bp-k">Gate</div><div class="bp-v">F${selection.duration}</div></div>
    </div>`;
}

// ---------- Karte fuer den Flug vorbereiten ----------

// Zeichnet Route, Punkte und positioniert das Flugzeug am Start
function setupMap() {
  const from = airportByCode(selection.from);
  const to = airportByCode(selection.to);
  const p1 = project(from);
  const p2 = project(to);

  // Gebogene Flugroute (Kontrollpunkt nach oben versetzt = Bogen)
  const cx = (p1.x + p2.x) / 2;
  const cy = (p1.y + p2.y) / 2 - Math.abs(p2.x - p1.x) * 0.18 - 40;
  const d = `M ${p1.x} ${p1.y} Q ${cx} ${cy} ${p2.x} ${p2.y}`;
  $("#flight-path").setAttribute("d", d);
  $("#flight-path-done").setAttribute("d", d);

  // Start-/Zielpunkte und Beschriftung
  $("#dot-from").setAttribute("cx", p1.x);
  $("#dot-from").setAttribute("cy", p1.y);
  $("#dot-to").setAttribute("cx", p2.x);
  $("#dot-to").setAttribute("cy", p2.y);
  placeLabel("#label-from", from.code, p1);
  placeLabel("#label-to", to.code, p2);

  // Gesamtlaenge der Route fuer die Flugzeug-Animation merken
  flightPathLength = $("#flight-path").getTotalLength();
  updatePlane(0);
}

// Setzt ein Beschriftungs-Label leicht versetzt neben einen Punkt
function placeLabel(sel, text, pt) {
  const el = $(sel);
  el.textContent = text;
  el.setAttribute("x", Math.min(pt.x + 10, 940));
  el.setAttribute("y", pt.y - 12);
}

// Bewegt das Flugzeug entlang der Route (progress 0..1) und richtet es aus
function updatePlane(progress) {
  const path = $("#flight-path");
  const len = flightPathLength || path.getTotalLength();
  const pt = path.getPointAtLength(len * progress);
  // Tangente fuer die Drehung ueber einen leicht versetzten Punkt bestimmen
  const ahead = path.getPointAtLength(Math.min(len, len * progress + 1));
  const angle = (Math.atan2(ahead.y - pt.y, ahead.x - pt.x) * 180) / Math.PI;
  $("#plane-group").setAttribute(
    "transform",
    `translate(${pt.x}, ${pt.y}) rotate(${angle})`
  );
  // Bereits geflogenen Teil der Route einfaerben
  $("#flight-path-done").style.strokeDasharray = `${len * progress} ${len}`;
}

// ---------- Flug-Ablauf ----------

// Startet einen neuen Flug aus der aktuellen Auswahl
function startFlight() {
  const now = Date.now();
  activeFlight = {
    from: selection.from,
    to: selection.to,
    seat: selection.seat,
    focus: selection.focus,
    duration: selection.duration,
    startedAt: now,
    // Endzeitpunkt; Pausen verschieben ihn nach hinten
    endsAt: now + selection.duration * 60 * 1000,
    paused: false,
    pausedAt: null,
  };
  store.active = activeFlight;
  saveData(store);

  showScreen("flight");
  setupMap();
  $("#flight-route-line").textContent =
    `${airportByCode(selection.from).city} → ${airportByCode(selection.to).city}`;
  $("#flight-meta").textContent =
    `${seatById(selection.seat).title} · ${focusById(selection.focus).icon} ${focusById(selection.focus).title}`;
  $("#pause-btn").textContent = "Pause";
  startTicking();
}

// Startet den Sekundentakt
function startTicking() {
  clearInterval(tickHandle);
  tick();
  tickHandle = setInterval(tick, 1000);
}

// Ein Takt: Timer, Fortschritt und Flugzeug aktualisieren
function tick() {
  if (!activeFlight || activeFlight.paused) return;
  const now = Date.now();
  const totalMs = activeFlight.duration * 60 * 1000;
  const remainingMs = Math.max(0, activeFlight.endsAt - now);
  const progress = 1 - remainingMs / totalMs;

  $("#timer").textContent = formatTime(Math.ceil(remainingMs / 1000));
  $("#progress-fill").style.width = (progress * 100).toFixed(1) + "%";
  updatePlane(Math.min(1, progress));

  if (remainingMs <= 0) landFlight();
}

// Pause umschalten (verschiebt die Endzeit beim Fortsetzen)
function togglePause() {
  if (!activeFlight) return;
  if (activeFlight.paused) {
    // Fortsetzen: pausierte Dauer auf die Endzeit aufschlagen
    const pausedMs = Date.now() - activeFlight.pausedAt;
    activeFlight.endsAt += pausedMs;
    activeFlight.paused = false;
    activeFlight.pausedAt = null;
    $("#pause-btn").textContent = "Pause";
  } else {
    activeFlight.paused = true;
    activeFlight.pausedAt = Date.now();
    $("#pause-btn").textContent = "Weiter";
  }
  store.active = activeFlight;
  saveData(store);
}

// Notlandung: Flug abbrechen, keine Meilen
function abortFlight() {
  if (!confirm("Notlandung einleiten? Dieser Flug bringt keine Meilen.")) return;
  clearInterval(tickHandle);
  activeFlight = null;
  store.active = null;
  saveData(store);
  resetBookingFlow();
  showScreen("booking");
}

// Erfolgreiche Landung: Ticket speichern, Meilen gutschreiben
function landFlight() {
  clearInterval(tickHandle);
  const f = activeFlight;
  const miles = milesFor(f.duration, f.seat);
  const oldRank = rankFor(store.totalMiles);

  // Ticket ins Logbuch schreiben
  store.flights.unshift({
    id: Date.now(),
    date: new Date().toISOString(),
    from: f.from,
    to: f.to,
    seat: f.seat,
    focus: f.focus,
    duration: f.duration,
    miles,
  });
  store.totalMiles += miles;
  store.active = null;
  activeFlight = null;
  saveData(store);

  const newRank = rankFor(store.totalMiles);
  renderHeader();
  showSummary(f, miles, oldRank, newRank);
}

// Ankunfts-Screen mit Ergebnis anzeigen
function showSummary(flight, miles, oldRank, newRank) {
  const from = airportByCode(flight.from);
  const to = airportByCode(flight.to);
  $("#summary-sub").textContent =
    `${from.city} → ${to.city} · ${flight.duration} min ${focusById(flight.focus).title}`;
  $("#summary-miles").textContent = `+ ${miles} Meilen ★`;
  $("#summary-rankup").textContent =
    newRank.name !== oldRank.name ? `🎉 Neuer Rang: ${newRank.name}!` : "";
  showScreen("summary");
}

// ---------- Wiederaufnahme nach Reload ----------

// Pruefen, ob noch ein Flug laeuft, und ggf. fortsetzen
function resumeIfActive() {
  if (!store.active) return;
  activeFlight = store.active;
  // War der Flug waehrend der Abwesenheit faellig? Dann direkt landen.
  if (!activeFlight.paused && Date.now() >= activeFlight.endsAt) {
    landFlight();
    return;
  }
  showScreen("flight");
  setupMap();
  $("#flight-route-line").textContent =
    `${airportByCode(activeFlight.from).city} → ${airportByCode(activeFlight.to).city}`;
  $("#flight-meta").textContent =
    `${seatById(activeFlight.seat).title} · ${focusById(activeFlight.focus).icon} ${focusById(activeFlight.focus).title}`;
  $("#pause-btn").textContent = activeFlight.paused ? "Weiter" : "Pause";
  startTicking();
}

// ---------- Tickets & Statistik ----------

function renderTickets() {
  const list = $("#ticket-list");
  if (store.flights.length === 0) {
    $("#tickets-sub").textContent = "";
    list.innerHTML = `<div class="empty-state">Noch keine Fluege. Buche deinen ersten Fokus-Flug! ✈</div>`;
    return;
  }
  $("#tickets-sub").textContent = `${store.flights.length} abgeschlossene Fluege`;
  list.innerHTML = store.flights
    .map((f) => {
      const from = airportByCode(f.from);
      const to = airportByCode(f.to);
      const d = new Date(f.date).toLocaleDateString("de-DE", {
        day: "2-digit", month: "short", year: "numeric",
      });
      return `
      <div class="ticket">
        <div>
          <div class="t-route">${from.code} → ${to.code}</div>
          <div class="t-meta">${d} · ${seatById(f.seat).title} · ${focusById(f.focus).icon} ${f.duration} min</div>
        </div>
        <div class="t-miles">★ ${f.miles}</div>
      </div>`;
    })
    .join("");
}

function renderStats() {
  const flights = store.flights;
  const totalMin = flights.reduce((sum, f) => sum + f.duration, 0);
  const hours = (totalMin / 60).toFixed(1);
  const rank = rankFor(store.totalMiles);

  $("#stats-grid").innerHTML = `
    <div class="stat-card"><div class="s-val">${flights.length}</div><div class="s-label">Fluege</div></div>
    <div class="stat-card"><div class="s-val">${store.totalMiles}</div><div class="s-label">Meilen</div></div>
    <div class="stat-card"><div class="s-val">${hours} h</div><div class="s-label">Fokuszeit</div></div>
    <div class="stat-card"><div class="s-val">${rank.name}</div><div class="s-label">Rang</div></div>`;

  // Routen zaehlen und absteigend nach Haeufigkeit sortieren
  const counts = {};
  for (const f of flights) {
    const key = `${f.from} → ${f.to}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  $("#route-stats").innerHTML =
    rows.length === 0
      ? `<div class="empty-state">Noch keine Routen geflogen.</div>`
      : rows
          .map(([route, n]) => `<div class="route-stat-row"><span>${route}</span><span>${n}×</span></div>`)
          .join("");
}

// ---------- Kopfzeile ----------

function renderHeader() {
  $("#miles-total").textContent = store.totalMiles;
  $("#rank-badge").textContent = rankFor(store.totalMiles).name;
}

// ---------- Buchungs-Flow zuruecksetzen ----------

function resetBookingFlow() {
  pickMode = "from";
  showStep("route");
  syncRouteUI();
}

// ---------- Event-Verdrahtung ----------

function wireEvents() {
  // Tab-Navigation
  document.querySelectorAll(".tab").forEach((t) =>
    t.addEventListener("click", () => showScreen(t.dataset.screen))
  );

  // Schritt 1: Flughafen auf der Karte antippen (Delegation)
  $("#booking-airports").addEventListener("click", (e) => {
    const g = e.target.closest(".ap");
    if (!g) return;
    const code = g.dataset.code;
    if (pickMode === "from") {
      // Bei Konflikt mit dem Ziel beide tauschen, statt zu blockieren
      if (code === selection.to) selection.to = selection.from;
      selection.from = code;
      pickMode = "to";
    } else {
      if (code === selection.from) selection.from = selection.to;
      selection.to = code;
      pickMode = "from";
    }
    syncRouteUI();
  });

  // Schritt 1: Dropdowns als praezise Alternative (mit Tausch bei Konflikt)
  $("#select-from").addEventListener("change", (e) => {
    const v = e.target.value;
    if (v === selection.to) selection.to = selection.from;
    selection.from = v;
    syncRouteUI();
  });
  $("#select-to").addEventListener("change", (e) => {
    const v = e.target.value;
    if (v === selection.from) selection.from = selection.to;
    selection.to = v;
    syncRouteUI();
  });
  $("#swap-btn").addEventListener("click", () => {
    [selection.from, selection.to] = [selection.to, selection.from];
    syncRouteUI();
  });
  $("#to-seat-btn").addEventListener("click", () => {
    if (selection.from === selection.to) {
      alert("Abflug und Ziel duerfen nicht gleich sein.");
      return;
    }
    renderSeatGrid();
    showStep("seat");
  });

  // Schritt 2: Sitzklasse (Delegation)
  $("#seat-grid").addEventListener("click", (e) => {
    const card = e.target.closest("[data-seat]");
    if (!card) return;
    selection.seat = card.dataset.seat;
    renderSeatGrid();
  });
  $("#to-focus-btn").addEventListener("click", () => {
    renderFocusGrid();
    renderDurationOptions();
    showStep("focus");
  });

  // Schritt 3: Fokus & Dauer (Delegation)
  $("#focus-grid").addEventListener("click", (e) => {
    const card = e.target.closest("[data-focus]");
    if (!card) return;
    selection.focus = card.dataset.focus;
    renderFocusGrid();
  });
  $("#duration-options").addEventListener("click", (e) => {
    const chip = e.target.closest("[data-dur]");
    if (!chip) return;
    selection.duration = Number(chip.dataset.dur);
    renderDurationOptions();
  });
  $("#to-confirm-btn").addEventListener("click", () => {
    renderBoardingPass();
    showStep("confirm");
  });

  // Zurueck-Buttons in den Schritten
  document.querySelectorAll("[data-goto]").forEach((b) =>
    b.addEventListener("click", () => showStep(b.dataset.goto))
  );

  // Abheben
  $("#depart-btn").addEventListener("click", startFlight);

  // Flug-Steuerung
  $("#pause-btn").addEventListener("click", togglePause);
  $("#abort-btn").addEventListener("click", abortFlight);

  // Ankunft -> neuer Flug
  $("#summary-done-btn").addEventListener("click", () => {
    resetBookingFlow();
    showScreen("booking");
  });

  // Statistik: alles zuruecksetzen
  $("#reset-btn").addEventListener("click", () => {
    if (!confirm("Wirklich alle Fluege, Meilen und Tickets loeschen?")) return;
    store = { flights: [], totalMiles: 0, active: null };
    saveData(store);
    renderHeader();
    renderStats();
    renderTickets();
  });
}

// ---------- Start ----------

function init() {
  setLandPaths(); // eingebettete Weltkarte in beide Karten setzen
  fillAirportSelects();
  syncRouteUI(); // Karte, Dropdowns und Vorschau aufbauen
  renderHeader();
  wireEvents();
  resumeIfActive(); // laufenden Flug ggf. fortsetzen
}

init();
