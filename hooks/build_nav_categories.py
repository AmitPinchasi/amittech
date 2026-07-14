"""Emit the top-tab -> course mapping used by tabs-dropdown.js.

navigation.prune (mkdocs.yml) only ships the current page's branch of the
sidebar nav in each page's HTML, so the dropdown script can no longer scrape
the full category/course tree out of the DOM. This hook reads the complete
tree at build time - before pruning ever touches it - and writes it once to
assets/nav-categories.json for every page to share and cache.
"""
import json
import os

_categories = {}


def _section_index_url(section):
    for child in section.children:
        if getattr(child, "is_page", False) and child.file.name == "index":
            return child.url
    return None


def on_nav(nav, config, files):
    _categories.clear()
    for level1 in nav.items:
        if not getattr(level1, "is_section", False):
            continue
        courses = [
            {"name": level2.title, "href": _section_index_url(level2)}
            for level2 in level1.children
            if getattr(level2, "is_section", False) and _section_index_url(level2)
        ]
        if courses:
            _categories[level1.title] = courses
    return nav


def on_post_build(config):
    out_dir = os.path.join(config["site_dir"], "assets")
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, "nav-categories.json"), "w", encoding="utf-8") as f:
        json.dump(_categories, f, ensure_ascii=False)
