"""Collect each course's pages, in site order, for the PDF books.

Only active when AMITTECH_BOOKS=1 is set (scripts/books/make_books.py sets it
when it starts `mkdocs serve`); a normal build or deploy skips every step.

Writes books/<course>.json into the built site: the course's nav tree as the
reader sees it - after awesome-pages and sort_lesson_pages have ordered it -
with each page's rendered HTML. make_books.py assembles and prints the book
from that, so changing the book layout never needs a site rebuild.

Listed last under `hooks:` so it sees every other hook's changes to the HTML.
"""
import json
import os

ENABLED = os.environ.get("AMITTECH_BOOKS") == "1"

_courses = []      # [{title, category, slug, tree}]
_html = {}         # src_uri -> rendered page HTML
_titles = {}       # src_uri -> final page title (auto_page_title can change it while rendering)


def _node(item):
    if getattr(item, "is_section", False):
        return {"type": "section", "title": item.title,
                "children": [_node(child) for child in item.children]}
    if getattr(item, "is_page", False):
        return {"type": "page", "title": item.title, "url": item.url,
                "src": item.file.src_uri, "name": item.file.name}
    return None


def _fill(node):
    if node["type"] == "section":
        node["children"] = [c for c in node["children"] if c]
        for child in node["children"]:
            _fill(child)
    else:
        node["html"] = _html.get(node["src"], "")
        node["title"] = _titles.get(node["src"], node["title"])


def on_nav(nav, config, files):
    if not ENABLED:
        return nav
    _courses.clear()
    _html.clear()
    _titles.clear()
    # nav: category section -> course section (a folder with an index page)
    for category in nav.items:
        if not getattr(category, "is_section", False):
            continue
        for course in category.children:
            if not getattr(course, "is_section", False):
                continue
            index = next((c for c in course.children
                          if getattr(c, "is_page", False) and c.file.name == "index"), None)
            if index is None:
                continue
            _courses.append({
                "title": course.title,
                "category": category.title,
                "slug": index.file.src_uri.split("/", 1)[0],
                "tree": [n for n in (_node(c) for c in course.children) if n],
            })
    return nav


def on_page_content(html, page, config, files):
    if ENABLED:
        _html[page.file.src_uri] = html
        _titles[page.file.src_uri] = page.title
    return html


def on_post_build(config):
    if not ENABLED:
        return
    out_dir = os.path.join(config["site_dir"], "books")
    os.makedirs(out_dir, exist_ok=True)
    index = []
    for course in _courses:
        for node in course["tree"]:
            _fill(node)
        with open(os.path.join(out_dir, course["slug"] + ".json"), "w", encoding="utf-8") as f:
            json.dump(course, f, ensure_ascii=False)
        index.append({k: course[k] for k in ("title", "category", "slug")})
    with open(os.path.join(out_dir, "index.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False)
