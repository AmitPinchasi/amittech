# Illustration Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A stdlib-Python spec-to-SVG renderer plus a batch sweep that inserts generated illustrations (static and animated) into every section of docs/תכנות-בסיסי.

**Architecture:** JSON specs describe logical components/connections; `scripts/illustrate/` renders them to theme-aware RTL SVG with optional CSS-keyframe animation. Section-level subagents read lectures, author specs, render, visually QA via qlmanage, and insert markdown references.

**Tech Stack:** Python 3.9 stdlib only (json, xml.sax.saxutils, argparse, pathlib), qlmanage for QA thumbnails, existing MkDocs site for smoke test.

## Global Constraints

- Python 3.9, no third-party imports anywhere in `scripts/illustrate/`.
- All lecture-facing text: Hebrew, RTL, no emojis, no em dash (hyphen only), Hebrew-first mixed lines.
- Code inside illustrations: always LTR monospace.
- Palette (light/dark via `prefers-color-scheme` + baked CSS): ink `#0a1628`/`#edf3fc`, card `#ffffff`/`#0e1f38`, surface-chip `#eef1f6`/`#152a49`, border `#c3cddc`/`#385582`, accent `#4361ee`/`#7b90f5`, accent-tint `#eef1fe`/`#1a2c55`, pink `#e0175d`/`#ff5c93`, edge `#64748b`/`#8296b3`, muted `#718096`/`#8296b3`.
- Font stack: `'Heebo','Segoe UI',system-ui,sans-serif`; code: `ui-monospace,'SF Mono',Menlo,monospace`.
- Specs at `docs/images/illustrations/specs/<slug>.json`, SVGs at `docs/images/illustrations/<slug>.svg`, slugs ASCII kebab `<section>-<topic>-<name>`.
- Never modify the course numbering/hierarchy; only insert image lines + surrounding blank lines into lecture `.md` files.
- Commit after each task.

---

### Task 1: Text metrics and theme CSS

**Files:**
- Create: `scripts/illustrate/metrics.py`, `scripts/illustrate/theme.py`, `scripts/illustrate/__init__.py`
- Test: `scripts/illustrate/tests/test_metrics.py`

**Interfaces:**
- Produces: `metrics.text_width(s: str, size: float, mono: bool = False) -> float` (conservative estimate, +12% slack), `theme.base_css(animated: bool) -> str` (returns `<style>` body with light palette, dark `@media` block, class defs `.n-box .n-dia .n-hl .n-cell .n-code-bg .t .t-b .code .lbl .small .idx .edge .arrhead`, and when `animated`, `prefers-reduced-motion` block).

- [ ] Failing tests: Hebrew wider-per-char than Latin at same size; mono width = n_chars * 0.62 * size * slack; empty string -> 0; css contains `prefers-color-scheme: dark` and all class names.
- [ ] Implement: per-script char-width tables (Hebrew 0.58em, Latin lower 0.50em, upper/digits 0.62em, space 0.30em, punctuation 0.30em), slack factor 1.12.
- [ ] Tests pass; commit `feat(illustrate): text metrics and theme css`.

### Task 2: Components and sizing

**Files:**
- Create: `scripts/illustrate/components.py`
- Test: `scripts/illustrate/tests/test_components.py`

**Interfaces:**
- Consumes: `metrics.text_width`.
- Produces: `size_component(comp: dict) -> (w, h)` and `emit_component(comp, x, y, w, h) -> str` for types `box`, `code` (label or `lines`), `diamond`, `table` (cells/indices/highlight), `text`, `dynamic` (stacked value variants). Constants: `PAD_X=22, PAD_Y=14, FONT=15, CODE_FONT=13, MIN_W=96`. Diamond sized so inscribed text fits at half-width. All emitters return SVG fragments using classes from theme.py, id attribute `el-<comp id>` on the group.
- [ ] Failing tests: box width >= text width + 2*PAD_X; diamond width >= 2*text width; table width = cells * cell_w + gaps; unknown type raises `SpecError`.
- [ ] Implement; tests pass; commit `feat(illustrate): components`.

### Task 3: Flow layout engine

**Files:**
- Create: `scripts/illustrate/layout.py`
- Test: `scripts/illustrate/tests/test_layout.py`

**Interfaces:**
- Consumes: `size_component`.
- Produces: `layout_flow(spec) -> Placement` and `layout_stack(spec) -> Placement` where `Placement = {id: (x, y, w, h)}` plus `edges: [(points, label, label_pos)]`. Flow: vertical main axis, centered column; `side: right|left` branches leave diamond side points horizontally then descend to their box; branch boxes re-merge to the next main-axis component with elbow polylines; `loop: true` edges route left of the main column (x = min_x - 60). Vertical gap 40, horizontal branch gap 70. Collision check: no two placed rects intersect (raise `LayoutError`).
- [ ] Failing tests: linear chain stacks vertically with equal centers; two-branch diamond puts sides at symmetric x; loop edge points form left elbow; overlapping forced case raises.
- [ ] Implement; tests pass; commit `feat(illustrate): flow and stack layout`.

### Task 4: Renderer CLI and golden specs

**Files:**
- Create: `scripts/illustrate/render.py`
- Create: `docs/images/illustrations/specs/2-1-if-else-flow.json`, `2-2-while-loop.json`, `2-2-for-list.json` (the three approved mockups, animation added later)
- Test: `scripts/illustrate/tests/test_render.py`

**Interfaces:**
- Produces: CLI `python3 scripts/illustrate/render.py <spec.json ...> [--out-dir docs/images/illustrations]`; `render_spec(spec: dict) -> str` returning full SVG (viewBox computed from placement bounds + 16px margin, `role="img"`, `aria-label` from title, arrow marker def, single embedded `<style>`).
- [ ] Failing tests: three golden specs render; output parses as XML; contains expected element ids; SVG < 20KB; invalid spec (connection to unknown id) raises `SpecError` with the bad id in the message.
- [ ] Implement; tests pass; render the three goldens; qlmanage thumbnail; visually verify; commit `feat(illustrate): renderer CLI + golden specs`.

### Task 5: Animation compiler

**Files:**
- Modify: `scripts/illustrate/render.py`, `theme.py`, `components.py`
- Test: `scripts/illustrate/tests/test_animation.py`

**Interfaces:**
- Spec addition: `"animation": {"step_seconds": 1.4, "steps": [{"active": ["cond"], "edges": [0], "set": {"value": 1}}, ...]}` - `active` ids get highlight class during their step, `set` switches a `dynamic` component to variant index. Compiler emits per-element `@keyframes` with percentage windows (`step i` active in `[i/n, (i+1)/n)`), infinite loop, 0.8s hold at cycle end, `prefers-reduced-motion` shows last step statically.
- [ ] Failing tests: keyframe percentages cover 0-100; each dynamic variant visible in exactly its windows; no `animation` block -> no `@keyframes` in output.
- [ ] Implement; add animation to the three golden specs (if branch walk, while iteration count 0->4, for walk across list); re-render; verify; commit `feat(illustrate): css keyframe animation`.

### Task 6: SPEC.md authoring guide

**Files:**
- Create: `scripts/illustrate/SPEC.md`

Complete spec-format reference for sweep agents: all component types with JSON examples, layouts, connections, animation, slug/file conventions, insertion rules (image line with Hebrew alt text, blank lines around, place after the paragraph the visual explains), render + qlmanage QA commands, checklist (render clean, thumbnail check, alt text Hebrew, path resolves).
- [ ] Write; commit `docs(illustrate): spec authoring guide`.

### Task 7: Batch sweep of all course sections

**Files:**
- Create: many `docs/images/illustrations/specs/*.json` + rendered `*.svg`
- Modify: lecture `.md` files under `docs/תכנות-בסיסי/`

One subagent per section (0-11), parallel batches of 4. Prompt template: role, worktree path, read SPEC.md first, read every `הרצאה` file in the section, choose 0-3 genuinely explanatory spots per lecture (concept with structure/flow/state change - not decoration), prefer animation for stateful concepts, author specs, render, qlmanage-QA each PNG (note: check layout/overlap), insert references, report table of insertions.
- [ ] Dispatch, monitor, spot-fix failures; commit per-section or at end `feat(course): add generated illustrations across basic programming course`.

### Task 8: Validation and ship

- [ ] Re-render every spec in one batch run - zero errors.
- [ ] Script check: every `illustrations/*.svg` referenced in some lecture exists on disk and vice versa (orphans listed, refs resolve relative to each md).
- [ ] Run full test suite.
- [ ] `mkdocs serve` smoke: start, curl 2 lecture pages, confirm `<img` refs present, kill.
- [ ] Spot-check 6 random thumbnails visually.
- [ ] Push branch, open draft PR with summary + count table.

## Self-Review

Spec coverage: renderer invariants (T1-4), animation (T5), file conventions (T4, T6), sweep (T7), quality loop (T4, T5, T7), testing (all + T8). Gap check: none found. Types consistent: `Placement`, `SpecError`, `LayoutError`, `render_spec` used uniformly.
