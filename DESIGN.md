# clip2md — Design System

Seit September 2026 Teil der **Klarbild-Familie** (Tokens aus `klarbild-oss/src/styles/tokens.css`).

- **Farbe:** warmes Papier `#EAEAE3`, Karte `#FBFBF7`, Linie `#D7D6CC`, Tinte `#16150F`, ein kräftiges Blau `#1B3BE0` (OKLCH 45% 0.23 267) für Primäraktion, Fokus, Logo. Dunkelmodus: blau getönte Neutrals, Blau aufgehellt.
- **Schrift:** Space Grotesk (UI, Überschriften), Space Mono (Editor, Dateiname, Mono-Labels in Versalien mit 0.18em Sperrung). Self-hosted, keine Google-Fonts.
- **Form:** Karten mit 4px Radius, Bedienelemente als Pills (999px). Kein Schatten außer 1px-Hauch und Toast/Sheet.
- **Logo:** Klemmbrett mit Pfeil nach unten (Zwischenablage → Datei) in Blau, Wortmarke „clip**2**md" mit blauer 2. App-Icon: cremefarbenes Klemmbrett auf blauem Quadrat.
- **Mobil:** Touch-Ziele ≥44px, Eingaben 16px (kein iOS-Zoom), `env(safe-area-inset-*)`, Einstellungen als Bottom-Sheet, Aktionsleiste als 5er-Raster mit Icon über Label, Speichern über Teilen-Menü.
- **Motion:** ease-out-quint, 120–240ms, nur Opacity/Transform; `prefers-reduced-motion` respektiert.

## Historie
Vorher: dunkles Theme mit Grün (v1), dann helles Editorial mit Geist und Zinnober/Blau (v2). Beides abgelöst.
