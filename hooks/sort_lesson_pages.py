"""Order the pages inside a lesson folder by teaching order, not by alphabet.

Every lesson folder holds the same handful of pages, distinguished only by the
type suffix of their filename ("4.1 - הקדמה - הרצאה", "... - תרגול",
"... - פתרון"). awesome-pages sorts them by name, and in the Hebrew alphabet
פ precedes ת - so the solution was listed above the exercise it solves on
roughly every lesson in the site. The teaching order is a property of the type,
not of its spelling, so it is applied here instead of being encoded by hand in
740 per-folder `.pages` files.

Pages whose name carries no known type suffix are left exactly where the
sorting plugin put them: only the recognised ones trade places, and only among
the slots they already occupy.
"""

# Lecture first, then the exercise, then its solution; a project closes a
# lesson because it builds on everything above it.
_TYPE_ORDER = {
    "הרצאה": 0,
    "תרגול": 1,
    "תרגיל": 1,
    "פתרון": 2,
    "פרויקט": 3,
}


def _type_rank(page):
    name = getattr(page.file, "name", "")
    _, separator, suffix = name.rpartition(" - ")
    return _TYPE_ORDER.get(suffix.strip()) if separator else None


def _sort_children(children):
    ranked = [
        (index, item, _type_rank(item))
        for index, item in enumerate(children)
        if getattr(item, "is_page", False) and _type_rank(item) is not None
    ]
    if len(ranked) < 2:
        return
    slots = [index for index, _, _ in ranked]
    # (rank, index) keeps same-rank pages in the order the plugin produced.
    for slot, (_, item, _rank) in zip(slots, sorted(ranked, key=lambda r: (r[2], r[0]))):
        children[slot] = item


def _sort_sections(items):
    for item in items:
        if getattr(item, "is_section", False):
            _sort_sections(item.children)
    _sort_children(items)


def _pages_in_nav_order(items):
    for item in items:
        if getattr(item, "is_page", False):
            yield item
        elif getattr(item, "is_section", False):
            yield from _pages_in_nav_order(item.children)


def _relink(pages):
    """Rebuild the flat page chain so previous/next follow the new order."""
    for index, page in enumerate(pages):
        page.previous_page = pages[index - 1] if index else None
        page.next_page = pages[index + 1] if index + 1 < len(pages) else None


def on_nav(nav, config, files):
    _sort_sections(nav.items)
    pages = list(_pages_in_nav_order(nav.items))
    _relink(pages)
    nav.pages = pages
    return nav
