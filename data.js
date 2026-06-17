// ============================================================
// Stammdaten der App (Flughaefen, Sitzklassen, Fokus-Arten, Raenge).
// ============================================================

// Flughaefen mit echten Koordinaten ([lon, lat] fuer Karte/Distanz)
const AIRPORTS = [
  { code: "FRA", city: "Frankfurt",   lon: 8.57,    lat: 50.03 },
  { code: "BER", city: "Berlin",      lon: 13.50,   lat: 52.36 },
  { code: "MUC", city: "Muenchen",    lon: 11.78,   lat: 48.35 },
  { code: "LHR", city: "London",      lon: -0.45,   lat: 51.47 },
  { code: "CDG", city: "Paris",       lon: 2.55,    lat: 49.01 },
  { code: "BCN", city: "Barcelona",   lon: 2.08,    lat: 41.30 },
  { code: "IST", city: "Istanbul",    lon: 28.75,   lat: 41.28 },
  { code: "JFK", city: "New York",    lon: -73.78,  lat: 40.64 },
  { code: "LAX", city: "Los Angeles", lon: -118.41, lat: 33.94 },
  { code: "GRU", city: "Sao Paulo",   lon: -46.47,  lat: -23.43 },
  { code: "DXB", city: "Dubai",       lon: 55.36,   lat: 25.25 },
  { code: "SIN", city: "Singapur",    lon: 103.99,  lat: 1.36 },
  { code: "HND", city: "Tokio",       lon: 139.78,  lat: 35.55 },
  { code: "SYD", city: "Sydney",      lon: 151.18,  lat: -33.95 },
  { code: "CPT", city: "Kapstadt",    lon: 18.60,   lat: -33.97 },
  { code: "MAD", city: "Madrid",      lon: -3.56,   lat: 40.47 },
  { code: "AMS", city: "Amsterdam",   lon: 4.76,    lat: 52.31 },
  { code: "FCO", city: "Rom",         lon: 12.24,   lat: 41.80 },
  { code: "KEF", city: "Reykjavik",   lon: -22.61,  lat: 63.99 },
  { code: "SFO", city: "San Francisco", lon: -122.38, lat: 37.62 },
  { code: "ORD", city: "Chicago",     lon: -87.90,  lat: 41.97 },
  { code: "YYZ", city: "Toronto",     lon: -79.63,  lat: 43.68 },
  { code: "MEX", city: "Mexiko-Stadt", lon: -99.07, lat: 19.44 },
  { code: "GIG", city: "Rio",         lon: -43.25,  lat: -22.81 },
  { code: "CAI", city: "Kairo",       lon: 31.41,   lat: 30.12 },
  { code: "DEL", city: "Delhi",       lon: 77.10,   lat: 28.56 },
  { code: "BKK", city: "Bangkok",     lon: 100.75,  lat: 13.69 },
  { code: "ICN", city: "Seoul",       lon: 126.44,  lat: 37.46 },
  { code: "AKL", city: "Auckland",    lon: 174.79,  lat: -36.99 },
];

// Sitzklassen mit Meilen-Multiplikator
const SEAT_CLASSES = [
  { id: "economy",  icon: "💺", title: "Economy",  mult: 1,   sub: "Solider Fokus" },
  { id: "business", icon: "🥂", title: "Business", mult: 1.5, sub: "Mehr Komfort" },
  { id: "first",    icon: "👑", title: "First",    mult: 2,   sub: "Maximale Meilen" },
];

// Fokus-Arten (kosmetisch, fuers Logbuch)
const FOCUS_TYPES = [
  { id: "work",     icon: "💼", title: "Arbeit" },
  { id: "study",    icon: "📚", title: "Lernen" },
  { id: "reading",  icon: "📖", title: "Lesen" },
  { id: "creative", icon: "🎨", title: "Kreativ" },
];

// Rang-Stufen nach Gesamtmeilen
const RANKS = [
  { min: 0,     name: "Economy Flyer" },
  { min: 500,   name: "Silver" },
  { min: 1500,  name: "Gold" },
  { min: 4000,  name: "Platinum" },
  { min: 10000, name: "Diamond" },
];

// Reisetempo (km/h): wandelt Fokus-Dauer in Flug-Reichweite um
const AVG_SPEED_KMH = 900;

// Erfolge/Abzeichen — test(store) entscheidet, ob freigeschaltet
const ACHIEVEMENTS = [
  { id: "first",       icon: "🛫", title: "Erstflug",      desc: "Ersten Flug abschliessen", test: (s) => s.flights.length >= 1 },
  { id: "collector",   icon: "🎟️", title: "Sammler",       desc: "10 Fluege",                test: (s) => s.flights.length >= 10 },
  { id: "marathon",    icon: "⏱️", title: "Langstrecke",    desc: "Ein Flug ≥ 120 min",       test: (s) => s.flights.some((f) => f.duration >= 120) },
  { id: "explorer",    icon: "🧭", title: "Entdecker",      desc: "5 verschiedene Ziele",     test: (s) => new Set(s.flights.map((f) => f.to)).size >= 5 },
  { id: "globetrotter",icon: "🌍", title: "Weltenbummler",  desc: "2.000 Meilen",             test: (s) => s.totalMiles >= 2000 },
  { id: "streak7",     icon: "🔥", title: "Woche dabei",    desc: "7 Tage in Folge",          test: (s) => (s.streak && s.streak.count >= 7) },
  { id: "diamond",     icon: "💎", title: "Diamond",        desc: "10.000 Meilen",            test: (s) => s.totalMiles >= 10000 },
];

const STORAGE_KEY = "focusflight_v2";

// Kostenlose Kartenstile (OpenFreeMap, kein API-Key)
const MAP_STYLES = {
  positron: "https://tiles.openfreemap.org/styles/positron",
  bright:   "https://tiles.openfreemap.org/styles/bright",
  liberty:  "https://tiles.openfreemap.org/styles/liberty",
};
const MAP_STYLE_LABELS = { positron: "Hell", bright: "Bunt", liberty: "Detail" };


