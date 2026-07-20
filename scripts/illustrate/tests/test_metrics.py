import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import metrics
import theme


class TestMetrics(unittest.TestCase):
    def test_empty_string_is_zero(self):
        self.assertEqual(metrics.text_width("", 15), 0.0)

    def test_hebrew_wider_than_latin_lowercase(self):
        heb = metrics.text_width("שלום", 15)
        lat = metrics.text_width("abcd", 15)
        self.assertGreater(heb, lat)

    def test_mono_width_is_fixed_per_char(self):
        w = metrics.text_width("count", 13, mono=True)
        self.assertAlmostEqual(w, 5 * 0.62 * 13 * metrics.SLACK)

    def test_longer_text_is_wider(self):
        self.assertGreater(
            metrics.text_width("שלום עולם", 15), metrics.text_width("שלום", 15)
        )


class TestTheme(unittest.TestCase):
    def test_css_has_dark_mode_and_classes(self):
        css = theme.base_css(animated=False)
        self.assertIn("prefers-color-scheme: dark", css)
        for cls in [".n-box", ".n-dia", ".n-hl", ".n-cell", ".n-code-bg",
                    ".t", ".t-b", ".code", ".lbl", ".small", ".idx",
                    ".edge", ".arrhead"]:
            self.assertIn(cls, css)

    def test_reduced_motion_only_when_animated(self):
        self.assertIn("prefers-reduced-motion", theme.base_css(animated=True))
        self.assertNotIn("prefers-reduced-motion", theme.base_css(animated=False))


if __name__ == "__main__":
    unittest.main()
