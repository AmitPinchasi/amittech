"""Layout engines: compute pixel placement from logical specs.

flow  - vertical flowchart: main components stack top-down; connections with
        "side": right|left hang branch boxes off a diamond (below it if the
        branch merges back, beside it if terminal); "loop": true edges route
        around the left of the diagram (RTL: the "return" direction).
stack - simple vertical sequence; a connection from "table.<i>" starts at that
        cell and its target is centered under the cell.

Placement.rects: {id: (x, y, w, h)}
Placement.edges: [{"points": [(x,y)...], "label", "label_pos", "label_anchor", "loop"}]
"""

from components import size_component, cell_center_x

GAP = 40
BRANCH_OFF = 88
SIDE_OFF = 66
LOOP_OFF = 80


class LayoutError(Exception):
    pass


class Placement:
    def __init__(self):
        self.rects = {}
        self.edges = []


def _split_ref(ref):
    if "." in ref:
        base, idx = ref.rsplit(".", 1)
        if idx.isdigit():
            return base, int(idx)
    return ref, None


def _validate(spec):
    comps = {c["id"]: c for c in spec.get("components", [])}
    if not comps:
        raise LayoutError("spec has no components")
    if len(comps) != len(spec["components"]):
        raise LayoutError("duplicate component ids")
    for conn in spec.get("connections", []):
        for key in ("from", "to"):
            base, idx = _split_ref(conn[key])
            if base not in comps:
                raise LayoutError("connection references unknown id: %r" % conn[key])
            if idx is not None:
                cells = comps[base].get("cells")
                if cells is None or not (0 <= idx < len(cells)):
                    raise LayoutError("bad cell reference: %r" % conn[key])
    return comps


def _check_collisions(rects):
    ids = list(rects)
    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            ax, ay, aw, ah = rects[ids[i]]
            bx, by, bw, bh = rects[ids[j]]
            if ax < bx + bw and bx < ax + aw and ay < by + bh and by < ay + ah:
                raise LayoutError("components overlap: %s, %s" % (ids[i], ids[j]))


def _normalize(p):
    xs = [x for (x, y, w, h) in p.rects.values()]
    ys = [y for (x, y, w, h) in p.rects.values()]
    for e in p.edges:
        xs.extend(px for (px, py) in e["points"])
        ys.extend(py for (px, py) in e["points"])
        if e.get("label_pos"):
            xs.append(e["label_pos"][0])
            ys.append(e["label_pos"][1])
    dx, dy = -min(xs), -min(ys)
    p.rects = {i: (x + dx, y + dy, w, h) for i, (x, y, w, h) in p.rects.items()}
    for e in p.edges:
        e["points"] = [(x + dx, y + dy) for (x, y) in e["points"]]
        if e.get("label_pos"):
            e["label_pos"] = (e["label_pos"][0] + dx, e["label_pos"][1] + dy)
    return p


def _edge(points, label=None, label_pos=None, anchor="middle", loop=False):
    return {"points": points, "label": label, "label_pos": label_pos,
            "label_anchor": anchor, "loop": loop}


def layout_flow(spec):
    comps = _validate(spec)
    conns = spec.get("connections", [])
    sizes = {cid: size_component(c) for cid, c in comps.items()}

    side_conns = [c for c in conns if c.get("side")]
    side_targets = {c["to"] for c in side_conns}
    main = [c["id"] for c in spec["components"] if c["id"] not in side_targets]
    outgoing = {}
    for c in conns:
        outgoing.setdefault(_split_ref(c["from"])[0], []).append(c)

    p = Placement()
    cx = 0.0
    y = 0.0
    for cid in main:
        w, h = sizes[cid]
        p.rects[cid] = (cx - w / 2, y, w, h)
        branch_bottom = y + h
        # hang side branches off this component (normally a diamond)
        for conn in side_conns:
            if _split_ref(conn["from"])[0] != cid:
                continue
            tid = conn["to"]
            tw, th = sizes[tid]
            sign = 1 if conn["side"] == "right" else -1
            spx = cx + sign * w / 2
            spy = y + h / 2
            merges_back = any(cc["to"] in main and not cc.get("loop")
                              for cc in outgoing.get(tid, []))
            if merges_back:
                bcx = spx + sign * BRANCH_OFF
                p.rects[tid] = (bcx - tw / 2, y + h, tw, th)
                branch_bottom = max(branch_bottom, y + h + th)
                p.edges.append(_edge(
                    [(spx, spy), (bcx, spy), (bcx, y + h)],
                    conn.get("label"), ((spx + bcx) / 2, spy - 12)))
            else:
                tx = spx + sign * SIDE_OFF
                if sign < 0:
                    tx -= tw
                p.rects[tid] = (tx, spy - th / 2, tw, th)
                end_x = tx if sign > 0 else tx + tw
                p.edges.append(_edge(
                    [(spx, spy), (end_x, spy)],
                    conn.get("label"), ((spx + end_x) / 2, spy - 12)))
        y = branch_bottom + GAP

    # remaining edges: main-axis, merges, loops
    for conn in conns:
        if conn.get("side"):
            continue
        src, _ = _split_ref(conn["from"])
        dst, _ = _split_ref(conn["to"])
        sx, sy, sw, sh = p.rects[src]
        dx_, dy_, dw, dh = p.rects[dst]
        scx, dcx = sx + sw / 2, dx_ + dw / 2
        if conn.get("loop"):
            lx = min(x for (x, y_, w_, h_) in p.rects.values()) - LOOP_OFF
            dcy = dy_ + dh / 2
            pts = [(sx, sy + sh / 2), (lx, sy + sh / 2), (lx, dcy), (dx_, dcy)]
            p.edges.append(_edge(
                pts, conn.get("label"), ((lx + dx_) / 2, dcy - 12), loop=True))
        elif src in side_targets:
            # merge edge: branch box down, then horizontally into target's side
            dcy = dy_ + dh / 2
            enter_x = dx_ + dw if scx > dcx else dx_
            pts = [(scx, sy + sh), (scx, dcy), (enter_x, dcy)]
            p.edges.append(_edge(pts, conn.get("label"),
                                 (scx + 14, (sy + sh + dcy) / 2), anchor="start"))
        else:
            pts = [(scx, sy + sh), (scx, dy_)]
            p.edges.append(_edge(pts, conn.get("label"),
                                 (scx + 14, (sy + sh + dy_) / 2 + 4), anchor="start"))

    _check_collisions(p.rects)
    return _normalize(p)


def layout_stack(spec):
    comps = _validate(spec)
    conns = spec.get("connections", [])
    sizes = {cid: size_component(c) for cid, c in comps.items()}

    # a connection from table cell -> component centers the target under the cell
    under_cell = {}
    for conn in conns:
        base, idx = _split_ref(conn["from"])
        if idx is not None and comps[base].get("cells"):
            under_cell[conn["to"]] = (base, idx)

    p = Placement()
    cx = 0.0
    y = 0.0
    for comp in spec["components"]:
        cid = comp["id"]
        w, h = sizes[cid]
        p.rects[cid] = (cx - w / 2, y, w, h)
        y += h + GAP

    for tid, (base, idx) in under_cell.items():
        ccx = cell_center_x(comps[base], p.rects[base], idx)
        x_, y_, w_, h_ = p.rects[tid]
        p.rects[tid] = (ccx - w_ / 2, y_, w_, h_)

    for conn in conns:
        src, sidx = _split_ref(conn["from"])
        dst, _ = _split_ref(conn["to"])
        sx, sy, sw, sh = p.rects[src]
        dx_, dy_, dw, dh = p.rects[dst]
        if sidx is not None:
            start_x = cell_center_x(comps[src], p.rects[src], sidx)
        else:
            start_x = sx + sw / 2
        pts = [(start_x, sy + sh), (start_x, dy_)]
        p.edges.append(_edge(pts, conn.get("label"),
                             (start_x + 12, (sy + sh + dy_) / 2 + 4), anchor="start"))

    _check_collisions(p.rects)
    return _normalize(p)
