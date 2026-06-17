# ✈ FocusFlight (privat) — mit echter Karte

Ein privater Nachbau der App **FocusFlight**: ein Fokus-Timer im Flug-Look.
Du „buchst einen Flug" (= eine Fokus-Session), wählst Route, Sitzklasse und
Dauer, schaust deinem Flugzeug auf einem **drehbaren 3D-Globus** zu und
sammelst Meilen für deine Produktivität.

## Karte

- **MapLibre GL JS** (gratis, ohne API-Key) mit **Globus-Projektion**
- Kartenstil **OpenFreeMap „positron"** (heller Apple-Look) — kein Account nötig
- Benötigt **Internet** (Karten-Tiles werden online geladen)

## Features

- Buchungs-Flow: Route → Sitz → Fokus-Art → Boarding-Pass
- Flughäfen direkt auf dem Globus antippen (grün = Abflug, rot = Ziel)
- **Dauer-Regler** zeigt den **Reichweiten-Ring** — nicht erreichbare Flughäfen ausgegraut
- Fokus-Timer mit Flugzeug-Animation entlang der Großkreis-Route, Kamera folgt
- Pause & „Notlandung"; laufender Flug überlebt einen Reload
- Meilen & Ränge (Economy Flyer → Diamond), Tickets/Logbuch, Statistik
- Daten lokal im Browser (`localStorage`) — kein Server, kein Account

## Dateien

- `index.html` — Struktur (Karte, Bottom-Sheet, Overlays)
- `style.css` — App-Look (dunkles Theme, Bottom-Sheet, Pins)
- `geo.js` — Geo-Mathematik (Distanz, Großkreis, Reichweiten-Ring, Kurs)
- `data.js` — Flughäfen, Sitzklassen, Fokus-Arten, Ränge
- `map.js` — MapLibre-Karte (Globus, Pins, Route, Reichweite, Flugzeug)
- `app.js` — Buchung, Timer, Meilen, Persistenz

## Starten

`index.html` im Browser öffnen (mit Internetverbindung). Für die Installation
auf dem iPad: über GitHub Pages veröffentlichen und „Zum Home-Bildschirm".
