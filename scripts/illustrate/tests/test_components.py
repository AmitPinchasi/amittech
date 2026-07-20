import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import components
import metrics
from components import SpecError


class TestSizing(unittest.TestCase):
    def test_box_fits_label_with_padding(self):
        comp = {"id": "a", "type": "box", "label": "מותר להיכנס"}
        w, h = components.size_component(comp)
        self.assertGreaterEqual(
            w, metrics.text_width("מותר להיכנס", components.FONT) + 2 * components.PAD_X
        )
        self.assertEqual(h, 46)

    def test_min_width_applies(self):
        w, _ = components.size_component({"id": "a", "type": "box", "label": "כן"})
        self.assertEqual(w, components.MIN_W)

    def test_code_multiline_taller(self):
        one = {"id": "a", "type": "code", "label": "x = 1"}
        two = {"id": "b", "type": "code", "lines": ["x = 1", "y = 2"]}
        _, h1 = components.size_component(one)
        _, h2 = components.size_component(two)
        self.assertGreater(h2, h1)

    def test_diamond_wider_than_double_text(self):
        comp = {"id": "c", "type": "diamond", "label": "age >= 18"}
        w, h = components.size_component(comp)
        tw = metrics.text_width("age >= 18", components.CODE_FONT, mono=True)
        self.assertGreaterEqual(w, 2 * tw)
        self.assertGreater(h, 0)

    def test_table_width_scales_with_cells(self):
        t2 = {"id": "t", "type": "table", "cells": ["אא", "בב"]}
        t3 = {"id": "t", "type": "table", "cells": ["אא", "בב", "גג"]}
        w2, _ = components.size_component(t2)
        w3, _ = components.size_component(t3)
        self.assertGreater(w3, w2)

    def test_unknown_type_raises(self):
        with self.assertRaises(SpecError):
            components.size_component({"id": "x", "type": "cloud", "label": "a"})


class TestEmit(unittest.TestCase):
    def test_emit_box_has_group_id_and_shape_class(self):
        comp = {"id": "end", "type": "box", "label": "סוף"}
        w, h = components.size_component(comp)
        svg = components.emit_component(comp, 10, 20, w, h)
        self.assertIn('id="el-end"', svg)
        self.assertIn("shp", svg)
        self.assertIn("סוף", svg)

    def test_emit_table_cells_rtl_with_ids(self):
        comp = {"id": "lst", "type": "table", "cells": ["תפוח", "בננה"],
                "indices": True, "highlight": 1}
        w, h = components.size_component(comp)
        svg = components.emit_component(comp, 0, 0, w, h)
        self.assertIn('id="el-lst-c0"', svg)
        self.assertIn('id="el-lst-c1"', svg)
        # cell 0 must be to the RIGHT of cell 1 (RTL)
        x0 = float(svg.split('id="el-lst-c0"')[1].split('x="')[1].split('"')[0])
        x1 = float(svg.split('id="el-lst-c1"')[1].split('x="')[1].split('"')[0])
        self.assertGreater(x0, x1)
        self.assertIn("n-hl", svg)

    def test_dynamic_stacks_variants(self):
        comp = {"id": "v", "type": "dynamic", "values": ["תפוח", "בננה", "ענב"]}
        w, h = components.size_component(comp)
        svg = components.emit_component(comp, 0, 0, w, h)
        for i in range(3):
            self.assertIn(f"dyn-v-{i}", svg)


if __name__ == "__main__":
    unittest.main()
