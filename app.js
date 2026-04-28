// =================================================================
// Notizen-App — Hauptlogik
// =================================================================
// Diese Datei macht 3 Dinge:
//   1. Notizen aus localStorage laden
//   2. Neue Notizen speichern, wenn das Formular abgeschickt wird
//   3. Notizen in der Liste anzeigen + löschen können
// =================================================================

// Schlüssel, unter dem wir die Daten im Browser speichern.
// localStorage ist wie ein winziges Notizbuch im Browser.
const STORAGE_KEY = "notes_app";
const THEME_KEY = "notes_theme";

// DOM-Elemente einmalig holen (DOM = "Document Object Model" = die Seite)
const form = document.getElementById("note-form");
const noteList = document.getElementById("note-list");
const emptyState = document.getElementById("empty-state");
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = themeToggle.querySelector(".theme-icon");

// =================================================================
// Theme-Logik (Dark Mode)
// =================================================================

/** Setzt das Theme und speichert die Wahl. */
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
  localStorage.setItem(THEME_KEY, theme);
}

/** Wechselt zwischen hell und dunkel. */
function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(current === "dark" ? "light" : "dark");
}

/** Initiales Theme: gespeicherte Wahl, sonst System-Präferenz. */
function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) {
    applyTheme(saved);
    return;
  }
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(prefersDark ? "dark" : "light");
}

themeToggle.addEventListener("click", toggleTheme);
initTheme();

// =================================================================
// 1. Daten lesen / schreiben
// =================================================================

/** Liest alle Notizen aus localStorage und gibt ein Array zurück. */
function loadNotes() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return []; // Wenn noch nichts gespeichert ist → leeres Array
  return JSON.parse(raw); // String → Array umwandeln
}

/** Speichert ein Array von Notizen in localStorage. */
function saveNotes(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

// =================================================================
// 2. Liste anzeigen
// =================================================================

/** Zeichnet die Liste neu — wird nach jeder Änderung aufgerufen. */
function renderNotes() {
  const notes = loadNotes();

  // Empty-State (Hinweis "noch nichts da") ein- oder ausblenden
  if (notes.length === 0) {
    emptyState.classList.remove("hidden");
    noteList.innerHTML = "";
    return;
  }
  emptyState.classList.add("hidden");

  // HTML für jede Notiz bauen
  noteList.innerHTML = notes
    .map(
      (note) => `
        <li class="note-item">
          <div class="note-header">
            <span class="note-title">${escapeHtml(note.title)}</span>
            <button class="delete-btn" data-id="${note.id}">Löschen</button>
          </div>
          <div class="note-content">${escapeHtml(note.content)}</div>
          <div class="note-date">${formatDate(note.createdAt)}</div>
        </li>
      `
    )
    .join("");

  // Eventlistener für die Löschen-Buttons
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => deleteNote(btn.dataset.id));
  });
}

// =================================================================
// 3. Aktionen
// =================================================================

/** Wird aufgerufen, wenn das Formular abgeschickt wird. */
function handleSubmit(event) {
  event.preventDefault(); // Verhindert, dass die Seite neu lädt

  // Werte aus dem Formular holen
  const newNote = {
    id: crypto.randomUUID(), // Eindeutige ID generieren
    title: document.getElementById("title").value.trim(),
    content: document.getElementById("content").value.trim(),
    createdAt: new Date().toISOString(),
  };

  // An die bestehenden Notizen anhängen und speichern
  const notes = loadNotes();
  notes.unshift(newNote); // unshift = vorne einfügen (neueste zuerst)
  saveNotes(notes);

  // Formular zurücksetzen und Liste neu zeichnen
  form.reset();
  renderNotes();
}

/** Löscht eine Notiz anhand ihrer ID. */
function deleteNote(id) {
  const notes = loadNotes().filter((n) => n.id !== id);
  saveNotes(notes);
  renderNotes();
}

// =================================================================
// Hilfsfunktionen
// =================================================================

/** Formatiert ein ISO-Datum zu "15.09.2024, 14:30". */
function formatDate(iso) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("de-DE");
  const time = d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  return `${date}, ${time}`;
}

/** Schützt vor XSS, indem HTML-Sonderzeichen escaped werden. */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// =================================================================
// Start
// =================================================================

form.addEventListener("submit", handleSubmit);
renderNotes(); // Initial einmal zeichnen
