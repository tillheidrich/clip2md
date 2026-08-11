# clip2md — Design System

Register: **product**. Color strategy: **Restrained** (tinted neutrals + one accent ≤10%).
Theme: **dark**. Scene: Nutzer legt spätabends oder tagsüber am Monitor schnell einen langen
Thread ab; eine ruhige, dunkle, blendfreie Fläche hält den Fokus auf dem Text, nicht auf dem UI.

## Color (OKLCH)

Neutrals sind zur Marken-Hue (kühles Blau-Grau, ~265) getönt — nie reines `#000`/`#fff`.

| Token | OKLCH | Rolle |
| --- | --- | --- |
| `--bg` | `0.17 0.014 265` | App-Hintergrund (tief) |
| `--surface` | `0.215 0.016 265` | Editor-Fläche |
| `--raised` | `0.255 0.018 265` | Bars, Buttons |
| `--line` | `0.32 0.02 265` | Ruhige Rahmen |
| `--line-strong`| `0.42 0.024 265` | Aktive Rahmen |
| `--text` | `0.95 0.006 265` | Primärtext |
| `--muted` | `0.68 0.012 265` | Sekundärtext, Labels |
| `--faint` | `0.5 0.012 265` | Tertiär, Legende |
| `--accent` | `0.74 0.15 152` | Grün — Primäraktion, Fokus, „konvertiert" |
| `--accent-ink` | `0.22 0.05 152` | Text auf Accent |
| `--danger` | `0.66 0.16 25` | Fehler-Toast, destruktiv |

Accent trägt <10% der Fläche: Save-Button, Fokus-Ring, „konvertiert"-Badge. Sonst Neutrals.

## Typography

- **Sans (UI-Chrome):** Inter / system-ui. Labels, Buttons, Legende.
- **Mono (Daten):** ui-monospace / JetBrains Mono. Editor, Dateiname, Zähler — alles, was „Inhalt" ist.
- Scale mit ≥1.25-Kontrast: 11 (legende) · 12.5 (meta) · 14 (body/editor) · 15 (buttons) · 18 (wordmark).
- Editor-Zeilenhöhe 1.65, `tab-size: 2`, Body-Zeilen bleiben durch die Mono-Fläche natürlich lesbar.

## Elevation & Layout

- Drei Ebenen: `bg` (App) → `surface` (Editor, das Herzstück, bekommt den Raum) → `raised` (Bars/Buttons).
- Keine Cards, keine Schatten außer einem weichen Toast-Drop. Trennung über 1px-Linien und Ton, nicht Boxen.
- Spacing-Rhythmus variiert bewusst: großzügig um den Editor, kompakt in der Toolbar.
- Radius 10–12px, konsistent.

## Motion

- Ease-out-quint (`cubic-bezier(0.22, 1, 0.36, 1)`), 120–240ms. Kein Bounce.
- Nur Opacity/Transform animieren. Toast slidet ein, Button-Press senkt 1px, „konvertiert"-Badge pulst einmal kurz, auto-aktualisierter Dateiname flasht dezent.
- `prefers-reduced-motion`: alle nicht-essenziellen Transitions aus.

## Accessibility

- `:focus-visible` Ring in Accent, überall. Touch-Ziele ≥40px.
- Toasts über `aria-live="polite"`. Editor & Felder korrekt gelabelt.
- Kontrast: Text/`bg` und Accent-Ink/Accent über WCAG AA.
