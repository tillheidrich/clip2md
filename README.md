# clip2md — Paste to Markdown

Winziges, self-hosted Tool: langen Text (Reddit-Thread, Website, formatierter Content) reinpasten
→ ein Klick / `⌘/Strg+S` → als `.md` speichern. Dateiname wird automatisch aus Titel + Datum vorgeschlagen.

**Live:** https://clip2md.heidrich-digital.de

## Was es macht

- **Smart Paste:** Enthält die Zwischenablage formatiertes HTML (Copy aus dem Browser, z.B. Reddit
  `⌘A` → `⌘C`), wird es automatisch über [Turndown](https://github.com/mixmark-io/turndown)
  (+ GFM-Plugin für Tabellen/Strikethrough/Task-Lists) zu sauberem Markdown konvertiert.
  Reiner Text ohne HTML bleibt 1:1 erhalten.
- **Roh erzwingen:** `⌘/Strg+⇧+V` fügt beim nächsten Paste bewusst als Klartext ein (keine Konvertierung).
- **Auto-Dateiname:** aus der ersten Überschrift/Zeile + Datum, z.B. `2026-08-11-mein-thread.md`.
  Editierbar — sobald du selbst tippst, wird nicht mehr überschrieben.
- **Speichern:** Button oder `⌘/Strg+S` lädt die `.md` herunter (Browser-Download, kein Server-Roundtrip).
- **Kopieren / Leeren**, Wort- und Zeichenzähler.

Alles läuft **komplett clientseitig** — nichts wird an einen Server geschickt.

## Tech

- Statische `index.html` (inline CSS/JS, OKLCH-Design, Dark).
- Vendored: `vendor/turndown.js`, `vendor/turndown-plugin-gfm.js` (kein CDN, offline-fähig).
- Ausgeliefert via `nginx:alpine` (siehe `Dockerfile` + `nginx.conf`).

## Lokal starten

```bash
docker build -t clip2md .
docker run --rm -p 8080:80 clip2md
# → http://localhost:8080
```

Oder ganz ohne Docker: `index.html` einfach im Browser öffnen.

## Deployment

Deployt über **Coolify** (Dockerfile-Build) aus diesem Gitea-Repo, Domain via Cloudflare
auf `clip2md.heidrich-digital.de`. Details siehe Outline-Wiki (Tech & Stack → clip2md).

## Vendor-Libs aktualisieren

```bash
npm pack turndown turndown-plugin-gfm
# dist/turndown.js  → vendor/turndown.js
# dist/turndown-plugin-gfm.js → vendor/turndown-plugin-gfm.js
```

Lizenz: MIT (Turndown ebenfalls MIT).
