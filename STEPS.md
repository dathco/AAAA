# Schritt-für-Schritt — Erstes Projekt

Geplante Zeit: **60–90 Minuten**. Mach Pausen, übereile nichts.

> 💡 Dein Ordner liegt auf dem Schreibtisch und heißt `erstes projekt`.
> Das Leerzeichen im Namen → bei jedem Terminal-Befehl Anführungszeichen verwenden.

---

## Phase 1 — Projekt einrichten (10 Min)

### 1. In den Ordner wechseln

Öffne das Terminal (Spotlight: `Cmd + Leertaste` → "Terminal") und tippe:

```bash
cd ~/Desktop/"erstes projekt"
```

Prüfe mit `ls`, dass alle Dateien da sind:

```bash
ls -la
```

Du solltest `README.md`, `STEPS.md`, `index.html` usw. sehen.

### 2. Prüfen ob Git installiert ist

```bash
git --version
```

Falls "command not found": `brew install git`.

### 3. Git einmalig konfigurieren (falls noch nie gemacht)

```bash
git config --global user.name "David"
git config --global user.email "deine@email.de"
```

(Die E-Mail sollte später zu deinem GitHub-Account passen.)

### 4. Den Ordner zu einem Git-Repository machen

```bash
git init
git add .
git commit -m "Initial commit"
```

**Was ist hier passiert?**
- `git init` → "Hey Git, beobachte ab jetzt diesen Ordner."
- `git add .` → "Nimm alle Dateien in den Stagebereich" (Vorbereitung für den Commit).
- `git commit -m "..."` → "Speichere einen Schnappschuss mit dieser Nachricht."

Mit `git log` siehst du jetzt deinen ersten Commit. Drücke `q` zum Verlassen.

---

## Phase 2 — Auf GitHub hochladen (10 Min)

### 1. GitHub-Account anlegen

Falls noch nicht: github.com → "Sign up". Kostenlos.

### 2. Neues Repo auf GitHub erstellen

- Klick oben rechts aufs `+` → **New repository**
- Name: `erstes-projekt` (Achtung: GitHub mag keine Leerzeichen — Bindestrich nutzen)
- **Public** lassen
- **Wichtig:** Kein "Initialize with README" anhaken — der Ordner hat schon eine!
- Klick "Create repository"

### 3. Lokalen Ordner mit GitHub verbinden

GitHub zeigt dir nach dem Erstellen Befehle. Du brauchst diese hier (im Terminal, im Projektordner):

```bash
git remote add origin https://github.com/DEIN-NAME/erstes-projekt.git
git branch -M main
git push -u origin main
```

GitHub fragt nach Login. Falls Probleme: **Personal Access Token** statt Passwort nutzen. Oder die GitHub CLI installieren — viel einfacher:

```bash
brew install gh
gh auth login
```

Dann erneut `git push -u origin main`.

Lade die GitHub-Seite neu — dein Code ist online! 🎉

---

## Phase 3 — Die App ausprobieren (5 Min)

Im Finder: Doppelklick auf `index.html`. Sie öffnet sich im Browser.
- Trage eine Test-Notiz ein
- Lade die Seite neu — die Notiz bleibt da (dank `localStorage`)
- Lösche die Notiz

---

## Phase 4 — Erste Änderung mit Claude Code (15 Min)

### 1. Claude Code im Projektordner starten

```bash
cd ~/Desktop/"erstes projekt"
claude
```

Claude Code liest automatisch deine `CLAUDE.md`.

### 2. Branch für ein neues Feature anlegen

```bash
git checkout -b feature/dark-mode
```

**Warum ein Branch?** So kannst du am neuen Feature arbeiten, ohne `main` (deine "stabile" Version) zu zerstören. Wenn das Feature klappt → mergen. Wenn nicht → einfach den Branch wegwerfen.

### 3. Mit Claude Code chatten

Probier diesen Prompt:

```
Schau dir index.html, style.css und app.js an.
Füge bitte einen Dark-Mode-Toggle oben rechts hinzu, der die Auswahl
in localStorage speichert (also auch nach Reload erhalten bleibt).
Halte den Stil minimal und passend zum bestehenden Design.
```

Claude wird die Dateien lesen und Änderungen vorschlagen oder direkt vornehmen.

### 4. Änderungen anschauen

```bash
git status     # welche Dateien wurden geändert?
git diff       # was genau wurde geändert?
```

`git diff` ist dein bester Freund — du siehst Zeile für Zeile, was anders ist. Drücke `q` zum Verlassen.

### 5. Wenn dir die Änderungen gefallen → committen

```bash
git add .
git commit -m "Add dark mode toggle with localStorage"
git push origin feature/dark-mode
```

### 6. Pull Request auf GitHub erstellen

Geh auf deine GitHub-Repo-Seite. Du siehst einen gelben Banner: "Compare & pull request" — klick drauf, schreib eine kurze Beschreibung, "Create pull request".

In echten Teams würden jetzt Kollegen reviewen. Da du allein arbeitest: klick einfach "Merge pull request" → "Confirm merge".

### 7. Lokal aufräumen

```bash
git checkout main
git pull origin main             # holt die gemergten Änderungen
git branch -d feature/dark-mode  # alten Branch löschen
```

**Glückwunsch — du hast den kompletten Profi-Workflow durchgespielt!** 🎉

---

## Phase 5 — Skills & Plugins ausprobieren (20 Min)

Folge `RESOURCES.md` für die nächsten Experimente. Dort findest du:
- Alle offiziellen & Community-Verzeichnisse
- Konzept-Tabelle (Skill / Slash Command / Subagent / Hook / MCP / Plugin)
- 5 konkrete erste Experimente zum Ausprobieren

---

## Was du jetzt kannst

✅ Repos lokal anlegen mit `git init`
✅ Auf GitHub hochladen mit `git push`
✅ Branches erstellen und mergen
✅ Mit Claude Code in einem echten Projekt arbeiten
✅ Pull Requests verstehen
✅ Eine `CLAUDE.md` strukturieren

## Mögliche nächste Schritte

1. Mehr Features bauen: Such-Funktion, Tags, Export als JSON
2. Das Projekt online deployen (GitHub Pages — kostenlos, in 2 Minuten)
3. Ein zweites kleines Projekt anlegen, um den Workflow zu wiederholen
