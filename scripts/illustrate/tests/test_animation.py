import json
import re
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import render

SPECS_DIR = Path(__file__).resolve().parents[3] / "docs/images/illustrations/specs"


def load(name):
    return json.loads((SPECS_DIR / name).read_text(encoding="utf-8"))


class TestAnimation(unittest.TestCase):
    def test_animated_spec_gets_keyframes_and_reduced_motion(self):
        svg = render.render_spec(load("2-1-if-else-flow.json"))
        self.assertIn("@keyframes", svg)
        self.assertIn("prefers-reduced-motion", svg)
        self.assertIn("animation-iteration-count:infinite", svg)

    def test_static_spec_has_no_keyframes(self):
        spec = load("2-1-if-else-flow.json")
        del spec["animation"]
        svg = render.render_spec(spec)
        self.assertNotIn("@keyframes", svg)
        self.assertNotIn("prefers-reduced-motion", svg)

    def test_keyframes_span_zero_to_hundred(self):
        svg = render.render_spec(load("2-2-while-loop.json"))
        blocks = re.findall(r"@keyframes [\w-]+\{((?:[\d.]+%\{[^}]*\})+)\}", svg)
        self.assertGreater(len(blocks), 0)
        for block in blocks:
            pcts = [float(p) for p in re.findall(r"([\d.]+)%\{", block)]
            self.assertEqual(min(pcts), 0.0)
            self.assertEqual(max(pcts), 100.0)

    def test_dynamic_final_variant_visible_statically(self):
        svg = render.render_spec(load("2-2-for-list.json"))
        # final step sets val=2, so variant 2 is the static/reduced-motion state
        self.assertIn(".dyn-val-2{opacity:1;}", svg)
        self.assertIn(".dyn-val-0{opacity:0;}", svg)

    def test_bad_edge_index_raises(self):
        spec = load("2-1-if-else-flow.json")
        spec["animation"]["steps"][0]["edges"] = [99]
        with self.assertRaises(Exception) as ctx:
            render.render_spec(spec)
        self.assertIn("99", str(ctx.exception))

    def test_cell_highlight_targets_cell_id(self):
        svg = render.render_spec(load("2-2-for-list.json"))
        self.assertIn("#el-lst-c1{animation-name:k-lst-1", svg)


if __name__ == "__main__":
    unittest.main()
