# FocusFlight (privat) — Kontext für Claude Code

## Was ist das?

Ein privater Nachbau der App **FocusFlight**: ein Fokus-/Pomodoro-Timer im
Flug-Look. Man "bucht einen Flug" (= eine Fokus-Session), wählt Route,
Sitzklasse und Dauer, schaut dem Flugzeug auf der Karte zu und sammelt
Meilen für die Produktivität. Premium-Spielereien (z. B. "aus dem Fenster
gucken") sind bewusst weggelassen.

## Tech-Stack

- Vanilla HTML / CSS / JavaScript (kein Build-Tool, kein Framework)
- `localStorage` für Datenpersistenz
- Keine externen Dependencies — läuft per Doppelklick im Browser

## Code-Konventionen

- Variablen- und Funktionsnamen auf Englisch
- Kommentare auf Deutsch (Lernkommentare)
- 2 Spaces für Einrückung
- Funktionen klein und fokussiert halten (eine Funktion = eine Aufgabe)
- Moderne JS-Features (const/let, arrow functions, template literals)

## Wichtige Dateien

- `index.html` — Struktur: Buchungs-Flow, Flug-Screen, Tickets, Statistik
- `style.css` — alles Visuelle (Airline-Optik, dunkles Theme)
- `app.js` — Logik: Buchung, Timer, Karte/Animation, Meilen, Persistenz

## Fachliche Eckpunkte

- **Route**: echte Flughäfen mit Koordinaten; Distanz via Haversine
- **Sitzklassen**: Economy ×1, Business ×1.5, First ×2 (Meilen-Multiplikator)
- **Meilen**: `Dauer (min) × Multiplikator`
- **Ränge**: nach Gesamtmeilen (Economy Flyer → Diamond)
- Laufender Flug wird im `localStorage` gehalten und nach Reload fortgesetzt

## Was Claude bevorzugt tun soll

- Erst die relevanten Dateien lesen, bevor Änderungen vorgeschlagen werden
- Bei Änderungen kurz erklären, **warum** so und nicht anders
- Antworten auf Deutsch, Code-Kommentare auf Deutsch

## Was Claude NICHT tun soll

- Keine Frameworks (React, Vue, …) — wir bleiben bewusst vanilla
- Keine Build-Tools (Webpack, Vite, …) — Datei muss per Doppelklick laufen
- Keine NPM-Dependencies installieren
