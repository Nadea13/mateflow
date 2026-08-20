# Mateflow Design System & Guidelines (Operate Mode)

## Philosophy
Every pixel serves operational velocity. An ERP/Backoffice interface must minimize cognitive load, maximize information density without clutter, and maintain instant legibility.

## Layout & Spatial System
- **App Shell:** Fixed Left Navigation (w-64) + Sticky Blur TopBar + Fluid Content Container with `max-w-7xl` centered constraint.
- **Rhythm:** Standard 4px grid (`gap-4`, `gap-6`, `p-6`, `p-8`).
- **Surface Layering:** Single-level container depth (no cards nested in cards). Clean 1px stroke borders over high-contrast canvas.

## Typography Scale
- Headings: `font-semibold` / `font-bold` tracking-tight, no unnecessary kickers.
- Metrics & Financial figures: `font-mono` with tabular numbers (`tabular-nums`) for perfect decimal alignment.
- Labels & Subtext: `text-xs font-medium text-muted-foreground` with deliberate contrast (> 4.5:1).

## Interactive Feedback
- Hover transitions: `duration-150 ease-out` with subtle background tinting.
- Active states: Explicit Solid Primary with high-contrast foreground.
- Micro-badges: Tinted background pill with 1px border matching accent hue.
