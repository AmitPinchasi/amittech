"""Component sizing and SVG emission.

Every emitter wraps its output in <g id="el-<id>"> and marks its primary
shape(s) with class "shp" so the animation compiler can target them.
Table cells additionally get their own ids: el-<id>-c<n>.
"""

from xml.sax.saxutils import escape

import metrics

PAD_X = 22
PAD_Y = 14
FONT = 15
CODE_FONT = 13
MIN_W = 96

BOX_H = 46
CODE_LINE_H = 22
CELL_GAP = 20
CELL_H = 46
IDX_H = 18


class SpecError(Exception):
    pass


def _is_code_text(s):
    return all(ord(c) < 0x0590 for c in s)


def size_component(comp):
    ctype = comp.get("type")
    if ctype == "box":
        texts = comp.get("values") or [comp["label"]]
        w = max(MIN_W, max(metrics.text_width(t, FONT) for t in texts) + 2 * PAD_X)
        return w, BOX_H
    if ctype == "code":
        lines = comp.get("values") or comp.get("lines") or [comp["label"]]
        w = max(
            MIN_W,
            max(metrics.text_width(l, CODE_FONT, mono=True) for l in lines) + 2 * 18,
        )
        n_rows = len(comp["lines"]) if comp.get("lines") else 1
        return w, 16 + CODE_LINE_H * n_rows
    if ctype == "diamond":
        texts = comp.get("values") or [comp["label"]]
        tw = max(
            metrics.text_width(
                t, CODE_FONT if _is_code_text(t) else FONT, mono=_is_code_text(t))
            for t in texts
        )
        w = max(160, 2.2 * tw)
        return w, max(84, 0.5 * w)
    if ctype == "table":
        cells = comp["cells"]
        cell_w = max(MIN_W, max(metrics.text_width(c, FONT) for c in cells) + 28)
        w = len(cells) * cell_w + (len(cells) - 1) * CELL_GAP
        h = CELL_H + (IDX_H if comp.get("indices") else 0)
        return w, h
    if ctype == "text":
        return metrics.text_width(comp["label"], 12) + 8, 18
    if ctype == "dynamic":
        w = max(MIN_W, max(metrics.text_width(v, 16) for v in comp["values"]) + 44)
        return w, 44
    raise SpecError("unknown component type: %r (id=%s)" % (ctype, comp.get("id")))


def _text(x, y, cls, s, anchor="middle", extra=""):
    # pure-ASCII content must not inherit the RTL base direction of Hebrew
    # text classes, or tokens like "a = 5" render reversed
    if _is_code_text(s) and "code" not in cls.split():
        extra += ' style="direction:ltr"'
    return '<text class="%s" x="%.1f" y="%.1f" text-anchor="%s"%s>%s</text>' % (
        cls, x, y, anchor, extra, escape(s)
    )


def emit_component(comp, x, y, w, h):
    ctype = comp["type"]
    cid = comp["id"]
    parts = ['<g id="el-%s">' % escape(cid)]
    cx = x + w / 2

    if ctype == "box":
        parts.append(
            '<rect class="n-box shp" x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="8"/>'
            % (x, y, w, h)
        )
        if comp.get("values"):
            for i, v in enumerate(comp["values"]):
                parts.append(_text(cx, y + h / 2 + 5,
                                   "t dyn-%s-%d" % (escape(cid), i), v))
        else:
            parts.append(_text(cx, y + h / 2 + 5, "t", comp["label"]))

    elif ctype == "code":
        parts.append(
            '<rect class="n-code-bg shp" x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="7"/>'
            % (x, y, w, h)
        )
        ty = y + 16 + CODE_LINE_H / 2
        if comp.get("values"):
            for i, v in enumerate(comp["values"]):
                parts.append(_text(cx, ty, "code dyn-%s-%d" % (escape(cid), i), v))
        else:
            for line in comp.get("lines") or [comp["label"]]:
                parts.append(_text(cx, ty, "code", line))
                ty += CODE_LINE_H

    elif ctype == "diamond":
        pts = "%.1f,%.1f %.1f,%.1f %.1f,%.1f %.1f,%.1f" % (
            cx, y, x + w, y + h / 2, cx, y + h, x, y + h / 2
        )
        parts.append('<polygon class="n-dia shp" points="%s"/>' % pts)
        if comp.get("values"):
            for i, v in enumerate(comp["values"]):
                cls = "code" if _is_code_text(v) else "t"
                parts.append(_text(cx, y + h / 2 + 5,
                                   "%s dyn-%s-%d" % (cls, escape(cid), i), v))
        else:
            cls = "code" if _is_code_text(comp["label"]) else "t"
            parts.append(_text(cx, y + h / 2 + 5, cls, comp["label"]))

    elif ctype == "table":
        cells = comp["cells"]
        n = len(cells)
        cell_w = (w - (n - 1) * CELL_GAP) / n
        top = y + (IDX_H if comp.get("indices") else 0)
        hl = comp.get("highlight")
        for i, cell in enumerate(cells):
            # RTL: cell 0 is rightmost
            cx_i = x + w - (i + 1) * cell_w - i * CELL_GAP
            cls = "n-hl" if hl == i else "n-cell"
            parts.append(
                '<rect id="el-%s-c%d" class="%s shp" x="%.1f" y="%.1f" '
                'width="%.1f" height="%.1f" rx="6"/>'
                % (escape(cid), i, cls, cx_i, top, cell_w, CELL_H)
            )
            center = cx_i + cell_w / 2
            if comp.get("indices"):
                parts.append(_text(center, y + 12, "idx", str(i)))
            parts.append(_text(center, top + CELL_H / 2 + 5, "t", cell))

    elif ctype == "text":
        parts.append(_text(cx, y + 13, "small", comp["label"]))

    elif ctype == "dynamic":
        parts.append(
            '<rect class="n-box shp" x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="8"/>'
            % (x, y, w, h)
        )
        for i, v in enumerate(comp["values"]):
            parts.append(
                _text(cx, y + h / 2 + 5, "t-b dyn-%s-%d" % (escape(cid), i), v)
            )

    else:
        raise SpecError("unknown component type: %r (id=%s)" % (ctype, cid))

    parts.append("</g>")
    return "\n".join(parts)


def cell_center_x(comp, rect, index):
    """Center x of table cell `index` given the table's placed rect."""
    x, y, w, h = rect
    n = len(comp["cells"])
    cell_w = (w - (n - 1) * CELL_GAP) / n
    left = x + w - (index + 1) * cell_w - index * CELL_GAP
    return left + cell_w / 2
