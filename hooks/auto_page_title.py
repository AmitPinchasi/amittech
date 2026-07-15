"""Clean up MkDocs' filename-derived title for pages without an H1 or explicit title.

MkDocs falls back to `file.name.replace('-', ' ').replace('_', ' ')` when a page
has neither `page.meta['title']` nor a real H1 - see
`mkdocs.structure.pages.Page.title`. For this site's "1.3 - topic - solution"
naming convention that turns every " - " into a triple space, which then shows
up verbatim in the browser tab, the <title> tag, and social/search snippets on
roughly two thirds of the site's course pages. This backfills a properly
whitespace-collapsed title for exactly those pages, changing formatting only -
never overriding an explicit title or a page's own H1.
"""
import re

_H1 = re.compile(r"^# \S")
_CODE_FENCE = re.compile(r"^```")
_WHITESPACE = re.compile(r"\s+")


def _has_h1(markdown):
    in_code = False
    for line in markdown.splitlines():
        if _CODE_FENCE.match(line):
            in_code = not in_code
            continue
        if not in_code and _H1.match(line):
            return True
    return False


def _clean_title(filename):
    # Unlike MkDocs' own fallback, don't replace "-" with " ": this site's
    # filenames already use " - " as an intentional, readable separator
    # ("1.3 - topic - solution"), so blanket-replacing the dash just merges
    # the segments into an unreadable run-on phrase.
    return _WHITESPACE.sub(" ", filename).strip()


def on_page_markdown(markdown, *, page, config, files):
    if not page.meta.get("title") and not _has_h1(markdown):
        page.meta["title"] = _clean_title(page.file.name)
    return markdown
