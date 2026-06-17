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

const STORAGE_KEY = "focusflight_v2";
