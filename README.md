# ✈ FocusFlight (privat)

Ein privater Nachbau der App **FocusFlight** — ein Fokus-Timer im Flug-Look.
Statt einer nüchternen Stoppuhr "buchst" du einen Flug: Route wählen, Sitz
buchen, abheben und fokussiert arbeiten, während dein Flugzeug über die Karte
zieht. Für abgeschlossene Sessions gibt es Meilen, Tickets und Ränge.

## Features

- **Buchungs-Flow** in 4 Schritten: Route → Sitz → Fokus & Dauer → Boarding-Pass
- **Route einsehen**: Weltkarte mit gebogener Flugroute und animiertem Flugzeug
- **Sitz buchen**: Economy (×1), Business (×1.5), First (×2 Meilen)
- **Fokus-Timer**: Dauer 15–120 min mit Fortschrittsbalken
- **Pause** & **Notlandung** (Abbruch ohne Meilen)
- **Meilen & Ränge**: Economy Flyer → Silver → Gold → Platinum → Diamond
- **Tickets / Logbuch**: alle abgeschlossenen Flüge
- **Statistik**: Flüge, Meilen, Fokuszeit, beliebteste Routen
- **Reload-sicher**: ein laufender Flug wird nach Neuladen fortgesetzt

Alle Daten bleiben lokal im Browser (`localStorage`) — kein Server, kein Account.

## Starten

Einfach `index.html` per Doppelklick im Browser öffnen. Kein Build, keine
Installation.

## Tech

Vanilla HTML / CSS / JavaScript. Keine Frameworks, keine Dependencies.

## Nicht enthalten

Bewusst weggelassene Premium-Spielereien wie die "aus dem Fenster gucken"-Ansicht.
