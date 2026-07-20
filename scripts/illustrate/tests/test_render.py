import json
import sys
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import render
from components import SpecError

SPECS_DIR = Path(__file__).resolve().parents[3] / "docs/images/illustrations/specs"
GOLDENS = ["2-1-if-else-flow.json", "2-2-while-loop.json", "2-2-for-list.json"]


class TestGoldens(unittest.TestCase):
    def _load(self, name):
        return json.loads((SPECS_DIR / name).read_text(encoding="utf-8"))

    def test_goldens_render_and_parse(self):
        for name in GOLDENS:
            svg = render.render_spec(self._load(name))
            root = ET.fromstring(svg)
            self.assertTrue(root.tag.endswith("svg"), name)
            self.assertLess(len(svg.encode("utf-8")), 20_000, name)
            self.assertIn("aria-label", svg)

    def test_if_else_has_all_elements(self):
        svg = render.render_spec(self._load("2-1-if-else-flow.json"))
        for el in ("el-input", "el-cond", "el-yes", "el-no", "el-end"):
            self.assertIn('id="%s"' % el, svg)
        self.assertEqual(svg.count("<polyline"), 5)

    def test_for_list_has_cells_and_variants(self):
        svg = render.render_spec(self._load("2-2-for-list.json"))
        for el in ("el-lst-c0", "el-lst-c1", "el-lst-c2"):
            self.assertIn('id="%s"' % el, svg)
        for v in range(3):
            self.assertIn("dyn-val-%d" % v, svg)

    def test_unknown_connection_reports_bad_id(self):
        spec = {
            "title": "t",
            "layout": {"type": "flow"},
            "components": [{"id": "a", "type": "box", "label": "א"}],
            "connections": [{"from": "a", "to": "ghost"}],
        }
        with self.assertRaises(Exception) as ctx:
            render.render_spec(spec)
        self.assertIn("ghost", str(ctx.exception))

    def test_unknown_layout_raises(self):
        with self.assertRaises(SpecError):
            render.render_spec({"title": "t", "layout": {"type": "spiral"},
                                "components": [{"id": "a", "type": "box", "label": "א"}]})


if __name__ == "__main__":
    unittest.main()
