# Illustration Generator - Design

Date: 2026-07-20
Status: approved (visual direction approved via mockup preview; scope expanded to whole course)

## Goal

Generate consistent, RTL-Hebrew, theme-aware SVG illustrations for lectures in
`docs/תכנות-בסיסי/`, inserted directly into the lecture markdown, viewable both
in Obsidian and on the MkDocs site.

## Architecture

Three parts:

1. **Spec format + renderer** (`scripts/illustrate/`)
   - An illustration is a JSON spec: logical components + connections, no pixel coordinates.
   - A stdlib-only Python 3.9 renderer computes layout and emits SVG.
   - The renderer owns all hard invariants once: RTL text with LTR code islands,
     right-to-left diagram flow, auto-sized boxes from text-width estimation,
     baked light/dark palette via `prefers-color-scheme` (derived from the site's
     Horizon tokens: navy `#0a1628`, blue `#4361ee`, pink accent), font stack
     `Heebo, system-ui fallbacks` (not embedded per-file to keep SVGs small).

2. **File conventions**
   - Specs: `docs/images/illustrations/specs/<slug>.json` (checked in, every
     illustration regeneratable/editable forever).
   - Rendered: `docs/images/illustrations/<slug>.svg`.
   - Slugs: ASCII, `<section>-<topic>-<name>` (e.g. `2-1-if-else-flow`).
   - Lectures reference them as standard markdown images with Hebrew alt text:
     `![תיאור](../../../images/illustrations/<slug>.svg)` - works in Obsidian and MkDocs.

3. **Batch sweep**
   - One agent per course section: reads each lecture, picks 1-3 spots where a
     visual genuinely teaches (may pick zero), writes specs, renders, checks the
     result visually (qlmanage WebKit thumbnail), inserts references into the markdown.
   - No staging step: insertions go straight into the lecture files (user decision).
     Delivery is via worktree branch + draft PR (background-job constraint); the
     user merges to see it in Obsidian.

## Components (v1)

box, diamond (decision), code (single- or multi-line chip, always LTR monospace),
table (cells, optional indices, optional highlight), text (caption/label),
arrow/connection (with optional label, side, loop-back). Layouts: `flow`
(vertical flowchart with side branches and loop-backs), `stack` (vertical
sequence), `row` (horizontal RTL sequence).

## Animation (user request: "gifs")

Animated SVG instead of GIF files - auto-plays and loops like a GIF but crisp,
small, theme-aware, and generated from the same spec:

- Optional `animation` block: a list of steps; each step activates components
  and/or connection edges and can set the visible value of a `dynamic` text node.
- Renderer compiles steps into CSS keyframes inside the SVG (opacity/stroke
  toggles, stacked text variants), looping forever with a short pause between cycles.
- `prefers-reduced-motion: reduce` shows the static final state.
- Primary targets: if/else branch walk, while-loop iteration with counter,
  for-loop walk across a list.

## Quality loop

Hebrew text width in SVG cannot be perfectly predicted, so:
- The renderer auto-sizes boxes with conservative per-script width tables plus slack.
- Generation loop: spec -> render -> qlmanage PNG -> agent looks at image -> fix -> re-render.
- Renderer fails loudly on invalid specs (unknown component refs, empty labels).

## Testing

- Unit tests for the renderer: geometry invariants (no overlapping boxes, arrows
  attach to shape edges, text fits inside its box with padding), spec validation
  errors, golden rendering of the three approved mockup specs.
- End: re-render all specs cleanly, verify every inserted reference resolves to
  an existing file, `mkdocs serve` smoke test.

## Content rules (from CLAUDE.md)

Hebrew RTL, no emojis, no em dash, Hebrew-first mixed lines, existing numbering
scheme untouched.
