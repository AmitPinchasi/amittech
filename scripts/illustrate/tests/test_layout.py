import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import layout
from layout import LayoutError


def rects_overlap(a, b):
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    return ax < bx + bw and bx < ax + aw and ay < by + bh and by < ay + ah


LINEAR = {
    "layout": {"type": "flow"},
    "components": [
        {"id": "a", "type": "code", "label": "x = 1"},
        {"id": "b", "type": "box", "label": "שלב שני"},
        {"id": "c", "type": "box", "label": "שלב שלישי"},
    ],
    "connections": [
        {"from": "a", "to": "b"},
        {"from": "b", "to": "c"},
    ],
}

BRANCHED = {
    "layout": {"type": "flow"},
    "components": [
        {"id": "cond", "type": "diamond", "label": "x > 0"},
        {"id": "yes", "type": "box", "label": "חיובי"},
        {"id": "no", "type": "box", "label": "שלילי"},
        {"id": "end", "type": "box", "label": "סוף"},
    ],
    "connections": [
        {"from": "cond", "to": "yes", "label": "כן", "side": "right"},
        {"from": "cond", "to": "no", "label": "לא", "side": "left"},
        {"from": "yes", "to": "end"},
        {"from": "no", "to": "end"},
    ],
}

LOOPED = {
    "layout": {"type": "flow"},
    "components": [
        {"id": "cond", "type": "diamond", "label": "count < 5"},
        {"id": "body", "type": "code", "lines": ["print(count)", "count += 1"]},
        {"id": "end", "type": "box", "label": "סוף הלולאה", "side_of": "cond"},
    ],
    "connections": [
        {"from": "cond", "to": "body", "label": "כן"},
        {"from": "body", "to": "cond", "loop": True, "label": "חוזרים לבדיקה"},
        {"from": "cond", "to": "end", "label": "לא", "side": "right"},
    ],
}


class TestFlow(unittest.TestCase):
    def test_linear_chain_shares_center_x(self):
        p = layout.layout_flow(LINEAR)
        centers = {round(x + w / 2) for (x, y, w, h) in
                   (p.rects[i] for i in ("a", "b", "c"))}
        self.assertEqual(len(centers), 1)

    def test_linear_chain_descends(self):
        p = layout.layout_flow(LINEAR)
        ys = [p.rects[i][1] for i in ("a", "b", "c")]
        self.assertEqual(ys, sorted(ys))

    def test_no_overlaps_in_all_fixtures(self):
        for spec in (LINEAR, BRANCHED, LOOPED):
            p = layout.layout_flow(spec)
            ids = list(p.rects)
            for i in range(len(ids)):
                for j in range(i + 1, len(ids)):
                    self.assertFalse(
                        rects_overlap(p.rects[ids[i]], p.rects[ids[j]]),
                        f"{ids[i]} overlaps {ids[j]} in {spec['components'][0]['id']}",
                    )

    def test_branches_symmetric_sides(self):
        p = layout.layout_flow(BRANCHED)
        cx = p.rects["cond"][0] + p.rects["cond"][2] / 2
        yes_c = p.rects["yes"][0] + p.rects["yes"][2] / 2
        no_c = p.rects["no"][0] + p.rects["no"][2] / 2
        self.assertGreater(yes_c, cx)
        self.assertLess(no_c, cx)

    def test_branch_targets_get_merge_edges(self):
        p = layout.layout_flow(BRANCHED)
        # 4 connections -> 4 edges
        self.assertEqual(len(p.edges), 4)

    def test_loop_edge_routes_left_of_everything(self):
        p = layout.layout_flow(LOOPED)
        loop_edges = [e for e in p.edges if e.get("loop")]
        self.assertEqual(len(loop_edges), 1)
        min_x = min(x for (x, y, w, h) in p.rects.values())
        left_most = min(px for (px, py) in loop_edges[0]["points"])
        self.assertLess(left_most, min_x)

    def test_unknown_connection_target_raises(self):
        bad = {
            "layout": {"type": "flow"},
            "components": [{"id": "a", "type": "box", "label": "א"}],
            "connections": [{"from": "a", "to": "ghost"}],
        }
        with self.assertRaises(LayoutError):
            layout.layout_flow(bad)


class TestStack(unittest.TestCase):
    def test_stack_descends_and_centers(self):
        spec = {
            "layout": {"type": "stack"},
            "components": [
                {"id": "code", "type": "code", "label": "for fruit in fruits:"},
                {"id": "lst", "type": "table", "cells": ["תפוח", "בננה", "ענב"],
                 "indices": True},
                {"id": "val", "type": "box", "label": "בננה"},
            ],
            "connections": [{"from": "lst.1", "to": "val", "label": "הסיבוב הנוכחי"}],
        }
        p = layout.layout_stack(spec)
        ys = [p.rects[i][1] for i in ("code", "lst", "val")]
        self.assertEqual(ys, sorted(ys))
        self.assertEqual(len(p.edges), 1)
        # arrow starts under the table, at cell 1's center
        (x0, y0) = p.edges[0]["points"][0]
        lx, ly, lw, lh = p.rects["lst"]
        self.assertTrue(lx < x0 < lx + lw)


if __name__ == "__main__":
    unittest.main()
