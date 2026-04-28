# 🎬 Was ich demonstriert habe

Ich habe in meiner Sandbox den **kompletten Workflow von Phase 1 bis 4** durchgespielt, damit du genau siehst, was dich erwartet, wenn du es selbst machst. Du bekommst:

1. Die fertige App mit eingebautem Dark-Mode-Feature
2. Eine echte Git-History (siehst du mit `git log`)
3. Diesen Walkthrough mit allen ausgeführten Befehlen und den echten Outputs

---

## Was ich nicht für dich tun konnte

❌ **Auf deinen Mac zugreifen** — ich kann deinen Schreibtisch-Ordner nicht anfassen.
❌ **Auf dein GitHub pushen** — dafür bräuchte ich deine Logins (gehört dir nicht in meine Hände).
❌ **Phase 5 für dich machen** — Skills/Plugins müssen in *deiner* Claude-Code-Installation sein.

✅ **Was du jetzt hast**: Eine fertig gebaute Version, an der du nachvollziehen kannst, wie eine echte Implementierung aussieht.

---

## Die ausgeführten Befehle und ihre echten Outputs

### Phase 1 — Repo initialisieren

```bash
git init
git add .
git commit -m "Initial commit: starter project with notes app"
```

**Output:**
```
Initialized empty Git repository in .git/
[main (root-commit) bbfb2b9] Initial commit: starter project with notes app
 8 files changed, 832 insertions(+)
 create mode 100644 .gitignore
 create mode 100644 CLAUDE.md
 ...
```

→ Git verfolgt jetzt den Ordner. Erster Schnappschuss gespeichert.

---

### Phase 4 — Feature-Branch und Implementierung

```bash
git checkout -b feature/dark-mode
```
**Output:** `Switched to a new branch 'feature/dark-mode'`

Dann habe ich 3 Dateien geändert:
- `index.html` — Toggle-Button hinzugefügt (5 Zeilen)
- `style.css` — komplett auf CSS-Variablen umgestellt + Dark-Theme definiert (155 Zeilen geändert)
- `app.js` — Theme-Logik mit localStorage und System-Präferenz-Detection (34 Zeilen)

```bash
git status
```
**Output:**
```
On branch feature/dark-mode
Changes not staged for commit:
	modified:   app.js
	modified:   index.html
	modified:   style.css
```

```bash
git diff --stat
```
**Output:**
```
 app.js     |  34 ++++++++++++++
 index.html |   5 ++
 style.css  | 155 ++++++++++++++++++++++-------
 3 files changed, 165 insertions(+), 29 deletions(-)
```

```bash
git add . && git commit -m "Add dark mode toggle with localStorage persistence"
```

---

### Phase 4 — Mergen (auf GitHub: "Merge pull request")

```bash
git checkout main
git merge --no-ff feature/dark-mode -m "Merge feature/dark-mode into main"
git branch -d feature/dark-mode
```

**Resultat: `git log --oneline --graph --all`**
```
*   fa90ddc Merge feature/dark-mode into main
|\
| * 84fdeaa Add dark mode toggle with localStorage persistence
|/
* bbfb2b9 Initial commit: starter project with notes app
```

So sieht eine "saubere" Git-History aus: ein Hauptstrang `main`, ein abzweigender Feature-Branch, der zurück gemerged wurde.

---

## Was im Code passiert ist (wichtig fürs Lernen!)

### 1. CSS-Variablen statt fester Farben
**Vorher:** Farben waren hart verdrahtet (`color: #1e293b;`).
**Nachher:** Alles über Variablen: `color: var(--heading);`. Im Dark Mode wird einfach der Wert der Variablen ausgetauscht — die ganze Seite passt sich an.

```css
:root { --bg: #f8fafc; --heading: #1e293b; }
[data-theme="dark"] { --bg: #0f172a; --heading: #f8fafc; }
```

Das ist ein **professionelles Pattern**, das in fast jeder modernen App so gemacht wird.

### 2. Theme-Persistenz mit localStorage
```js
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
}
```

Beim Klick auf den Button wird das `data-theme`-Attribut auf dem `<html>`-Element gesetzt. Das CSS reagiert sofort. Gleichzeitig wird die Wahl gespeichert — beim nächsten Besuch ist sie wieder da.

### 3. System-Präferenz erkennen
```js
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
```

Wenn der Nutzer das erste Mal kommt und macOS auf Dark Mode steht, startet die App automatisch dunkel. Kleine Geste, große Wirkung.

---

## Wie du das jetzt nutzt

### Option A: Selbst nochmal nachbauen (empfohlen zum Lernen!)
1. Lösch die "v2"-Dateien wieder
2. Starte mit der ursprünglichen Starter-Version
3. Geh `STEPS.md` durch — du hast jetzt einen "Spickzettel", wie das Endergebnis aussehen soll

### Option B: Den Code als Lernreferenz nutzen
1. Vergleich `style.css` (Original) mit der neuen Version → Aha, *so* macht man das mit CSS-Variablen
2. Schau dir `app.js` an, vor allem die Theme-Logik oben
3. Probier die App im Browser aus — Toggle klicken, Seite neu laden, schauen ob's bleibt

### Option C: Beides kombinieren (mein Tipp)
1. Lies dir den neuen Code **einmal komplett durch** (15 Min)
2. Lösch ihn dann
3. Versuch das Feature **selbst** nachzubauen, ohne hinzuschauen
4. Wenn du irgendwo hängst — rüberschauen, weiterprobieren

So lernst du am meisten.

---

## Was als Nächstes sinnvoll wäre

Wenn du Lust hast, weiter zu üben — hier ein paar Feature-Ideen vom einfachen zum schwereren:

1. **Such-Feld** über der Notizen-Liste, das die Liste live filtert (einfach)
2. **Notizen bearbeiten** statt nur löschen (mittel — UX überlegen)
3. **Tags/Kategorien** für Notizen, mit Filterung (mittel-schwer)
4. **Export als JSON** und Import zurück (mittel — file API)
5. **Auf GitHub Pages deployen**, damit die App online erreichbar ist (einfach, ~5 Min)

Für jedes davon: neuen Branch, mit Claude Code zusammen bauen, committen, mergen. Du beherrschst jetzt den Loop.
