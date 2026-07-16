"""Disambiguate titles on paginated blog/archive listing pages.

The blog plugin's pagination views (blog/page/2/, blog/archive/2026/page/2/,
...) are shallow copies of the first page that all share its title verbatim.
With 60+ pages per listing, that put ~240 pages on the site with an identical
<title> ("Blog - עמית טק" / "2026 - עמית טק"), which is a real duplicate-
content signal to Google even though each page self-canonicalizes. This
appends the page number to the title for every page after the first.
"""
import re

_PAGE_URL = re.compile(r"/page/(\d+)/$")


def on_page_context(context, page, config, nav):
    match = _PAGE_URL.search(page.url)
    if match:
        page.title = f"{page.title} - עמוד {match.group(1)}"
    return context
