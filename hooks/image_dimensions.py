"""Add width/height to content images so the browser can reserve their
layout space before they load, instead of shifting the page once each image
arrives - Cumulative Layout Shift is a Core Web Vitals ranking factor.

The theme's CSS (height:auto; max-width:100%) already renders images
responsively; explicit width/height attributes don't override that, they
only give the browser the aspect ratio to reserve while the image downloads.

All content images live flat under docs/images/ (site convention - verified
across the whole course tree), so the lookup is a plain filename match
rather than relative-path resolution against each page's own directory.
"""
import os
import re
from urllib.parse import unquote
from xml.etree import ElementTree

from PIL import Image

_IMG_TAG = re.compile(r'<img ([^>]*?)src="([^"]*\bimages/([^"/]+))"([^>]*?)/?>')
_IMAGES_DIR = os.path.join("docs", "images")
_dimension_cache = {}


def _svg_dimensions(path):
    # SVG is a vector format with no pixel dimensions Pillow can decode, but
    # the site's own SVGs all declare a literal width/height on the root tag.
    root = ElementTree.parse(path).getroot()
    width = float(root.get("width").rstrip("px"))
    height = float(root.get("height").rstrip("px"))
    return int(width), int(height)


def _dimensions(filename):
    if filename not in _dimension_cache:
        path = os.path.join(_IMAGES_DIR, filename)
        try:
            if filename.lower().endswith(".svg"):
                _dimension_cache[filename] = _svg_dimensions(path)
            else:
                with Image.open(path) as img:
                    _dimension_cache[filename] = img.size
        except Exception:
            _dimension_cache[filename] = None
    return _dimension_cache[filename]


def on_page_content(html, *, page, config, files):
    def add_dims(match):
        before, src, filename, after = match.groups()
        if "width=" in before or "width=" in after:
            return match.group(0)
        size = _dimensions(unquote(filename))
        if not size:
            return match.group(0)
        width, height = size
        after_clean = after.strip()
        suffix = f" {after_clean}" if after_clean else ""
        return f'<img {before}src="{src}"{suffix} width="{width}" height="{height}">'

    return _IMG_TAG.sub(add_dims, html)
