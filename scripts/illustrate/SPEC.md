# Illustration Spec Authoring Guide

How to author illustration specs for lecture materials and insert them into lectures.

## Files and naming

- Spec: `docs/images/illustrations/specs/<slug>.json`
- Rendered SVG: `docs/images/illustrations/<slug>.svg` (generated, do not hand-edit)
- Slug: ASCII kebab-case, `<course>-<section>-<topic>-<name>`, e.g. `net-2-1-tcp-handshake`
- Course prefixes: client (צד-לקוח), core (ליבת-המחשב), webadv (פריצת-אתרים-מתקדם),
  vuln (מחקר-חולשות), net (רשתות), ai (פיתוח-עם-AI), gpu (תכנות-GPU),
  pentest (בודק-חדירות), web (פריצת-אתרים), srv (צד-שרת), win (ווינדוס-בסיסי),
  linux (לינוקס-בסיסי), arch (ארכיטקטורת-תוכנה). Exception: תכנות-בסיסי slugs
  have no course prefix (grandfathered, e.g. `2-1-if-else-flow`).

## Render + QA commands (run from repo root)

```bash
python3 scripts/illustrate/render.py docs/images/illustrations/specs/<slug>.json
cd docs/images/illustrations && qlmanage -t -s 900 -o /tmp/illus-qa <slug>.svg
```

Then LOOK at `/tmp/illus-qa/<slug>.svg.png` (Read tool). Check: no overlapping
shapes, no text escaping its box, labels clear of arrows, sensible proportions.
The renderer fails loudly on invalid specs - fix and re-run.

## Spec format

```json
{
  "title": "תיאור בעברית - הופך ל-aria-label",
  "layout": { "type": "flow" },
  "components": [ ... ],
  "connections": [ ... ],
  "animation": { ... }
}
```

### Layouts

- `flow` - vertical flowchart. Components stack top-down in listed order.
  Connections with `"side": "right"|"left"` hang a branch box off a diamond:
  if the branch later connects onward to a main component it is placed below
  the diamond and merges back; if it has no outgoing connection it is placed
  beside the diamond (terminal exit, e.g. leaving a loop).
  `"loop": true` on a connection routes it around the left (the RTL "return" direction).
- `stack` - simple vertical sequence (code above a table above a value box etc.).
  A connection from a table cell (`"from": "lst.1"`) starts at that cell and
  centers its target under the cell.

### Components

| type | fields | notes |
|------|--------|-------|
| `box` | `label` | Hebrew text, auto-sized |
| `diamond` | `label` | condition; ASCII label renders as LTR code |
| `code` | `label` or `lines` (list) | always LTR monospace |
| `table` | `cells` (list), `indices` (bool), `highlight` (int) | RTL: cell 0 is rightmost |
| `text` | `label` | small muted caption |
| `dynamic` | `values` (list) | value box whose content changes during animation |

### Connections

`{ "from": "id", "to": "id", "label": "כן", "side": "right", "loop": true }`
- `label`, `side`, `loop` optional. Cell references: `"lst.2"`.
- Edge order matters: animation `edges` refers to connections by index.

### Animation (make stateful concepts move)

```json
"animation": {
  "step_seconds": 1.8,
  "steps": [
    { "active": ["cond"], "edges": [1], "set": { "val": 2 }, "move": { "0": "lst.2" } }
  ]
}
```

- Each step lasts `step_seconds` (floor: 1.5s - slower is calmer; the renderer
  adds smooth fade/slide ramps automatically, never abrupt ticks).
- `active`: component ids (or table cells `"lst.0"`) highlighted this step.
- `edges`: connection indices (spec order) highlighted this step.
- `set`: switch a component to variant index; carries forward until changed.
- ANY `box`, `code`, or `diamond` may declare `"values": [...]` variants in
  addition to `label` - use this to SHOW STATE: the input value arriving, a
  counter incrementing (`"count = 0"`, `"count = 1"`, ...), a condition
  evaluating with real numbers (`"age >= 18"`, `"25 >= 18"`). Strongly
  preferred for any animation about changing values.
- `move` (stack layout): slides a cell-anchored arrow, together with its
  label and target component, to start under another cell - use for "current
  item" pointers walking a list.
- The final step's state is what static/reduced-motion viewers see.
- Bidi is handled by the renderer: pure-ASCII text is automatically LTR, so
  never insert LRM/LRE control characters in labels or values.
- Use animation for stateful concepts (loops, branch walks, iteration, state
  machines); use static for structure (architecture, comparisons, tables).

## Inserting into a lecture

Add the image on its own line, blank lines around it, directly after the
paragraph or code block the visual explains:

```markdown
![תיאור מלא בעברית של מה שהאיור מראה](../../../images/illustrations/<slug>.svg)
```

- Alt text: full Hebrew sentence describing what the illustration shows (SEO +
  accessibility; matches existing site practice).
- Relative path: count the lecture file's depth below `docs/`. A lecture at
  `docs/תכנות-בסיסי/2 - בקרת זרימה ולולאות/2.1 - בקרת זרימה/2.1 - ... .md`
  needs `../../../images/...`.
- Never use emojis or em dashes; mixed Hebrew/English lines start with Hebrew.

## Checklist per illustration

1. Spec renders without errors.
2. Thumbnail visually checked (no overlap/overflow).
3. Alt text is a full Hebrew sentence.
4. Relative path resolves from the lecture file.
5. The illustration teaches something the text alone does not (structure, flow,
   state change) - never decoration.
