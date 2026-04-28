# Erstes Projekt — Notizen-App

Ein winziges Lernprojekt: eine kleine Notizen-App im Browser.
Klein gehalten, damit du **alle Basics** (HTML, JS, Git, GitHub, Claude Code) an einem echten Beispiel lernen kannst.

## Lernziele

Nach diesem Projekt verstehst du:

1. Wie man ein **Repository** erstellt (lokal mit Git + remote auf GitHub)
2. Was **Commits** sind und wie man sie schreibt
3. Wie man eine `CLAUDE.md` für Claude Code nutzt
4. Wie man **Branches** für neue Features anlegt
5. Wie man ein simples **Frontend-Projekt** strukturiert
6. Wie man **Skills & Plugins** in Claude Code installiert

## Was das Projekt macht

Eine einzelne HTML-Seite, auf der du:
- Notizen mit Titel und Text anlegst
- Notizen als Liste siehst
- Notizen wieder löschen kannst
- Alles bleibt lokal im Browser gespeichert (`localStorage`)

## Schritt-für-Schritt-Anleitung

Folge `STEPS.md` — dort steht alles in der richtigen Reihenfolge.

## Übersicht der Dateien

```
erstes projekt/
├── README.md          ← Du bist hier
├── STEPS.md           ← Die Schritt-für-Schritt-Anleitung
├── RESOURCES.md       ← Übersichten & Links zu Skills/Plugins
├── CLAUDE.md          ← Kontext für Claude Code
├── .gitignore         ← Was Git ignorieren soll
├── index.html         ← Die App
├── style.css          ← Styling
└── app.js             ← Die Logik
```

## ⚠️ Wichtig: Leerzeichen im Ordnernamen

Dein Ordner heißt `erstes projekt` — mit einem Leerzeichen. Das ist im Terminal etwas knifflig.
Bei jedem `cd`-Befehl musst du den Pfad in Anführungszeichen setzen:

```bash
cd ~/Desktop/"erstes projekt"
# oder
cd "~/Desktop/erstes projekt"
# oder mit Backslash
cd ~/Desktop/erstes\ projekt
```

In `STEPS.md` ist das überall richtig gesetzt — einfach copy & paste.
