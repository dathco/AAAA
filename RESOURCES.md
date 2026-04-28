# Übersichten & Verzeichnisse — Wo finde ich was?

Alles, was du suchst, ist im Grunde an einem dieser Orte. Sortiert nach offiziell → Community → Lernen.

---

## 🟦 OFFIZIELLE QUELLEN VON ANTHROPIC

### 1. Anthropic Skills Repository (offiziell)
**https://github.com/anthropics/skills**

Hier liegen die offiziellen Skills (`docx`, `pdf`, `pptx`, `xlsx`, `frontend-design`, `skill-creator` …).
Jeder Unterordner hat eine `SKILL.md`, die genau erklärt, was der Skill kann.

**Probier das:** In Claude Code:
```
/plugin marketplace add anthropics/skills
/plugin install document-skills@anthropic-agent-skills
```

### 2. Claude Code Repository
**https://github.com/anthropics/claude-code**

Der Code von Claude Code selbst — und im Ordner `plugins/` offizielle Plugin-Beispiele.

### 3. Claude Cookbooks
**https://github.com/anthropics/claude-cookbooks**

Jupyter Notebooks mit fertigen Beispielen: RAG, Tool Use, Klassifikation, Summarization, Vision …
Top für "wie macht man eigentlich X mit der API".

### 4. Anthropic Courses
**https://github.com/anthropics/courses**

Komplette Kurse: Prompt Engineering, API Fundamentals, Tool Use, Real World Prompting.
Alles kostenlos und in deinem eigenen Tempo.

### 5. Prompt Engineering Tutorial
**https://github.com/anthropics/prompt-eng-interactive-tutorial**

Interaktives Tutorial — das beste, was es zum Thema "Wie schreibe ich gute Prompts" gibt.

### 6. Anthropic Docs
**https://docs.claude.com** und **https://code.claude.com/docs**

Die offiziellen Doku-Seiten. Gut zum Nachschlagen.

### 7. Plugin Marketplaces (von Anthropic)
- **https://github.com/anthropics/claude-plugins-official** — kuratierte offizielle Plugins
- **https://github.com/anthropics/claude-plugins-community** — Community-Plugins, von Anthropic gespiegelt

---

## 🟨 COMMUNITY-VERZEICHNISSE (kuratiert)

### 8. Awesome Claude Code
**https://github.com/hesreallyhim/awesome-claude-code**

Die größte kuratierte Liste: Skills, Hooks, Slash-Commands, Agent-Orchestratoren, Tools, Plugins.
Wenn du nur **eine** Liste lesen willst — diese.

### 9. Awesome Claude Skills
**https://github.com/travisvn/awesome-claude-skills**

Speziell auf Skills fokussiert. Erklärt Konzepte sehr gut.

### 10. Awesome Claude Code Plugins
**https://github.com/ccplugins/awesome-claude-code-plugins**

Slash Commands, Subagents, MCP-Server, Hooks — gebündelt.

### 11. Claude Skills Collection
**https://github.com/abubakarsiddik31/claude-skills-collection**

Mischung aus offiziellen und Community-Skills.

### 12. Build with Claude Marketplace
**https://buildwithclaude.com/**

Browserbare Suchmaschine für 506+ Erweiterungen. Filterbar nach Kategorie.

### 13. Claude Plugin Hub
**https://www.claudepluginhub.com/**

Verzeichnis von Plugin-Marketplaces (also Sammlungen von Sammlungen).

### 14. Superpowers
**https://github.com/obra/superpowers**

20+ Skills für Claude Code mit Fokus auf Test-Driven Development, Debugging, Collaboration.

---

## 🟩 ZUM LERNEN

### 15. The Odin Project
**https://www.theodinproject.com/**

Kostenlose Roadmap für Web-Dev von 0 auf "ich kann beruflich coden".
Behandelt Git, GitHub, HTML, CSS, JavaScript, React, Node.js usw.

### 16. freeCodeCamp
**https://www.freecodecamp.org/**

Ähnlich, mit interaktiven Übungen direkt im Browser.

### 17. MDN Web Docs
**https://developer.mozilla.org/**

Die Bibel für HTML, CSS, JavaScript. Bei Unklarheiten: hier nachschauen.

### 18. GitHub Skills
**https://skills.github.com/**

Offizielle Lerneinheiten direkt von GitHub — du lernst Git/GitHub, indem du echte Pull Requests in Übungs-Repos machst.

### 19. Learn Git Branching
**https://learngitbranching.js.org/**

Die beste interaktive Git-Visualisierung. Du siehst beim Üben live, was Commits, Branches, Merges machen.

---

## 🟥 KONZEPTE — schnelle Übersicht

| Begriff | Was ist es? | Wofür gut? |
|---|---|---|
| **Skill** | Ordner mit `SKILL.md` + Anweisungen, Claude lädt sie bei Bedarf | Wiederholbare spezialisierte Aufgaben (PDF erstellen, Tests schreiben) |
| **Slash Command** | `.md`-Datei in `~/.claude/commands/`, ausgeführt mit `/befehl` | Schnelle, häufig genutzte Befehle ("/review", "/deploy") |
| **Subagent** | Spezialisierter Agent mit eigenem Kontext, du rufst ihn mit `@name` | Komplexe Workflows wie Code-Review, Architektur-Planung |
| **Hook** | Automatische Aktion bei einem Event (Session-Start, vor/nach Tool-Use) | Logging, Sicherheits-Checks, Initial-Setup |
| **MCP Server** | Brücke zu externen Diensten (GitHub, Linear, Slack, …) | Claude kann auf deine Daten in anderen Apps zugreifen |
| **Plugin** | Bündel aus mehreren der obigen Bausteine | Komplette Workflows als ein Paket |
| **Marketplace** | Git-Repo mit `marketplace.json` und mehreren Plugins | Verteilung von Plugin-Sammlungen |

---

## 🟪 KONKRETE ERSTE EXPERIMENTE

Wenn du mit Phase 1–4 fertig bist, probier in dieser Reihenfolge:

### Experiment 1: Offizielle Skills installieren
```
/plugin marketplace add anthropics/skills
/plugin install example-skills@anthropic-agent-skills
```
Dann: "Erstelle mir ein Word-Dokument mit einer Übersicht meines Projekts."
→ Der `docx`-Skill sollte automatisch greifen.

### Experiment 2: Eigenen Slash Command bauen
Erstelle `~/.claude/commands/review.md`:
```markdown
---
description: Code-Review für die aktuelle Datei machen
---
Schau dir die zuletzt geänderten Dateien an und gib mir Feedback zu:
1. Code-Qualität
2. Mögliche Bugs
3. Vorschläge zur Verbesserung
Sei direkt und ehrlich.
```
Dann in Claude Code: `/review`

### Experiment 3: Eigenen Skill erstellen
Es gibt einen offiziellen `skill-creator` — er führt dich interaktiv durch den Prozess.
Installier ihn und sag: "Hilf mir, einen Skill für [eine wiederholende Aufgabe] zu bauen."

### Experiment 4: Awesome-Liste durchstöbern
Geh zu **https://github.com/hesreallyhim/awesome-claude-code** und such dir 1–2 Skills/Plugins, die spannend klingen. Installier sie. Probier sie aus.

### Experiment 5: GitHub Skills durchspielen
**https://skills.github.com/** — wähl "Introduction to GitHub". 30 Minuten, lerne alles über Pull Requests, Issues, Branches direkt am echten System.

---

## ⚠️ Sicherheitshinweis

Skills und Plugins können Code auf deinem Rechner ausführen. Installiere nur aus Quellen, denen du vertraust:
- ✅ Anything in `anthropics/...` ist offiziell
- ✅ "awesome-..."-Listen sind kuratiert
- ⚠️ Random GitHub-Repos: erst `SKILL.md` durchlesen, dann installieren

Wenn ein Plugin Hooks oder Bash-Befehle nutzt (was viele tun), schau dir den Code vorher an. Lies die `README.md`. Wenn dir was komisch vorkommt → nicht installieren.
