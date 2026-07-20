"""Spec-to-SVG renderer.

Usage:
    python3 scripts/illustrate/render.py <spec.json ...> [--out-dir docs/images/illustrations]

Output SVG embeds its palette (light + dark via prefers-color-scheme) and,
when the spec has an "animation" block, CSS keyframes that loop like a GIF.
prefers-reduced-motion shows the final animation state statically.
"""

import argparse
import json
import sys
from pathlib import Path
from xml.sax.saxutils import escape

sys.path.insert(0, str(Path(__file__).resolve().parent))

import theme
from components import SpecError, emit_component, size_component
from layout import LayoutError, layout_flow, layout_stack

MARGIN = 16
HOLD_SECONDS = 0.8
EPS = 0.01

MARKER = (
    '<defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" '
    'markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
    '<path d="M0,0 L10,5 L0,10 z" class="arrhead"/></marker></defs>'
)


def _bounds(placement):
    xs, ys = [], []
    for (x, y, w, h) in placement.rects.values():
        xs.extend([x, x + w])
        ys.extend([y, y + h])
    for e in placement.edges:
        for (px, py) in e["points"]:
            xs.append(px)
            ys.append(py)
        if e.get("label_pos") and e.get("label"):
            ys.append(e["label_pos"][1] - 14)
    return min(xs), min(ys), max(xs), max(ys)


def _selector(token, comps):
    """Animation target token -> CSS selector."""
    if "." in token:
        base, idx = token.rsplit(".", 1)
        if idx.isdigit() and base in comps and comps[base].get("cells"):
            return "#el-%s-c%s" % (base, idx)
    if token in comps:
        return "#el-%s .shp" % token
    raise SpecError("animation references unknown target: %r" % token)


def _windows_to_keyframes(name, windows, n_steps, step_pct, active_css, base_css_decl):
    """Build @keyframes toggling between base and active for the given step windows."""
    points = [(0.0, base_css_decl)]
    for i in windows:
        start = i * step_pct
        end = (i + 1) * step_pct
        if start > 0:
            points.append((max(0.0, start - EPS), base_css_decl))
        points.append((start, active_css))
        points.append((end, active_css))
        # the last step's state persists through the hold period at cycle end
        if end < 100.0 and i != n_steps - 1:
            points.append((min(100.0, end + EPS), base_css_decl))
    points.append((100.0, active_css if n_steps - 1 in windows else base_css_decl))
    points.sort(key=lambda t: t[0])
    frames = "".join("%.2f%%{%s}" % (pct, css) for pct, css in points)
    return "@keyframes %s{%s}" % (name, frames)


def _compile_animation(spec, comps, n_edges):
    anim = spec["animation"]
    steps = anim["steps"]
    n = len(steps)
    step_seconds = float(anim.get("step_seconds", 1.4))
    total = n * step_seconds + HOLD_SECONDS
    step_pct = (step_seconds / total) * 100.0

    css = []
    run = "animation-duration:%.2fs;animation-iteration-count:infinite;" \
          "animation-timing-function:linear;" % total

    # highlight windows per element / edge
    el_windows, edge_windows = {}, {}
    for i, step in enumerate(steps):
        for token in step.get("active", []):
            el_windows.setdefault(token, []).append(i)
        for ei in step.get("edges", []):
            if not (0 <= ei < n_edges):
                raise SpecError("animation references unknown edge index: %r" % ei)
            edge_windows.setdefault(ei, []).append(i)

    active_shape = "stroke:var(--pink);stroke-width:2.5;"
    base_shape = "stroke-width:1.5;"
    for token, windows in el_windows.items():
        sel = _selector(token, comps)
        name = "k-" + token.replace(".", "-")
        css.append(_windows_to_keyframes(name, windows, n, step_pct,
                                         active_shape, base_shape))
        css.append("%s{animation-name:%s;%s}" % (sel, name, run))

    active_edge = "stroke:var(--pink);stroke-width:2.4;"
    base_edge = "stroke-width:1.6;"
    for ei, windows in edge_windows.items():
        name = "k-edge-%d" % ei
        css.append(_windows_to_keyframes(name, windows, n, step_pct,
                                         active_edge, base_edge))
        css.append("#edge-%d{animation-name:%s;%s}" % (ei, name, run))

    # dynamic text variants: carry the current variant forward through steps
    dyn_ids = [c["id"] for c in spec["components"] if c["type"] == "dynamic"]
    for did in dyn_ids:
        n_vals = len(comps[did]["values"])
        curr = 0
        by_step = []
        for step in steps:
            if did in step.get("set", {}):
                curr = int(step["set"][did])
                if not (0 <= curr < n_vals):
                    raise SpecError("animation sets %s to bad variant %d" % (did, curr))
            by_step.append(curr)
        final = by_step[-1]
        for v in range(n_vals):
            # static/reduced-motion state shows the final variant
            css.append(".dyn-%s-%d{opacity:%d;}" % (did, v, 1 if v == final else 0))
            windows = [i for i, cv in enumerate(by_step) if cv == v]
            name = "k-dyn-%s-%d" % (did, v)
            css.append(_windows_to_keyframes(name, windows, n, step_pct,
                                             "opacity:1;", "opacity:0;"))
            css.append(".dyn-%s-%d{animation-name:%s;%s}" % (did, v, name, run))
    return "\n".join(css)


def render_spec(spec):
    ltype = spec.get("layout", {}).get("type", "stack")
    if ltype == "flow":
        placement = layout_flow(spec)
    elif ltype == "stack":
        placement = layout_stack(spec)
    else:
        raise SpecError("unknown layout type: %r" % ltype)

    comps = {c["id"]: c for c in spec["components"]}
    animated = "animation" in spec

    x0, y0, x1, y1 = _bounds(placement)
    vw = (x1 - x0) + 2 * MARGIN
    vh = (y1 - y0) + 2 * MARGIN
    ox, oy = MARGIN - x0, MARGIN - y0

    body = [MARKER]
    for i, e in enumerate(placement.edges):
        pts = " ".join("%.1f,%.1f" % (px + ox, py + oy) for (px, py) in e["points"])
        body.append('<polyline id="edge-%d" class="edge" points="%s" marker-end="url(#arr)"/>'
                    % (i, pts))
        if e.get("label"):
            lx, ly = e["label_pos"]
            cls = "small" if e.get("loop") else "lbl"
            # labels are RTL: "start" placement (right of the arrow) needs
            # text-anchor="end" so glyphs flow rightward from the anchor
            anchor = e.get("label_anchor", "middle")
            svg_anchor = "end" if anchor == "start" else anchor
            body.append('<text class="%s" x="%.1f" y="%.1f" text-anchor="%s">%s</text>'
                        % (cls, lx + ox, ly + oy, svg_anchor, escape(e["label"])))
    for comp in spec["components"]:
        x, y, w, h = placement.rects[comp["id"]]
        body.append(emit_component(comp, x + ox, y + oy, w, h))

    css = theme.base_css(animated=animated)
    if animated:
        css += "\n" + _compile_animation(spec, comps, len(placement.edges))
    elif any(c["type"] == "dynamic" for c in spec["components"]):
        for c in spec["components"]:
            if c["type"] == "dynamic":
                for v in range(len(c["values"])):
                    css += "\n.dyn-%s-%d{opacity:%d;}" % (c["id"], v, 1 if v == 0 else 0)

    title = spec.get("title", "")
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %.0f %.0f" '
        'width="%.0f" role="img" aria-label="%s">\n<style>\n%s\n</style>\n%s\n</svg>\n'
        % (vw, vh, vw, escape(title), css, "\n".join(body))
    )


def main(argv=None):
    ap = argparse.ArgumentParser(description="Render illustration specs to SVG")
    ap.add_argument("specs", nargs="+", help="spec JSON files")
    ap.add_argument("--out-dir", default="docs/images/illustrations")
    args = ap.parse_args(argv)

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    failures = 0
    for spec_path in args.specs:
        path = Path(spec_path)
        try:
            spec = json.loads(path.read_text(encoding="utf-8"))
            svg = render_spec(spec)
        except (SpecError, LayoutError, KeyError, ValueError) as exc:
            print("FAIL %s: %s" % (path.name, exc), file=sys.stderr)
            failures += 1
            continue
        out = out_dir / (path.stem + ".svg")
        out.write_text(svg, encoding="utf-8")
        print("ok   %s -> %s (%d bytes)" % (path.name, out, len(svg)))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
