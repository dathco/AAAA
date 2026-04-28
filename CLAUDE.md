# Erstes Projekt — Kontext für Claude Code

## Was ist das?

Ein Lern-Projekt: eine kleine Notizen-App im Browser. Bewusst klein gehalten —
das Ziel ist, Git, GitHub und Claude Code im Workflow zu lernen.

## Tech-Stack

- Vanilla HTML / CSS / JavaScript (kein Build-Tool, kein Framework)
- `localStorage` für Datenpersistenz
- Keine externen Dependencies

## Code-Konventionen

- Variablen- und Funktionsnamen auf Englisch
- Kommentare auf Deutsch (Lernkommentare)
- 2 Spaces für Einrückung
- Funktionen klein und fokussiert halten (eine Funktion = eine Aufgabe)
- Nutze moderne JS-Features (const/let, arrow functions, template literals)

## Wichtige Dateien

- `index.html` — Haupteinstieg, Struktur der Seite
- `style.css` — alles Visuelle
- `app.js` — Logik (Notizen speichern, anzeigen, löschen)

## Was Claude bevorzugt tun soll

- Erst die relevanten Dateien lesen, bevor Änderungen vorgeschlagen werden
- Bei Änderungen kurz erklären, **warum** so und nicht anders
- Konzepte kurz erklären, wenn etwas Neues vorkommt (Lernkontext)
- Antworten auf Deutsch, Code-Kommentare auf Deutsch

## Was Claude NICHT tun soll

- Keine Frameworks (React, Vue, etc.) einbauen — wir bleiben bewusst vanilla
- Keine Build-Tools hinzufügen (Webpack, Vite, …) — die Datei muss per Doppelklick im Browser laufen
- Keine NPM-Dependencies installieren
- Nicht eigenmächtig Dateien committen — der Nutzer macht das selbst zum Üben
