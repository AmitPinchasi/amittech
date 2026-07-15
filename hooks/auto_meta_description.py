"""Backfill a meta description for pages that don't set one in frontmatter.

Roughly 99% of course lecture/exercise/solution pages have no frontmatter at
all, so Google falls back to auto-generated snippets. Search Console showed
several of these pages already ranking on page 1 for real "what is X" queries
(bash, HTTP, SSRF, npm...) but getting 0% CTR - an unappealing auto-snippet,
not a ranking problem. This extracts the page's own first substantive
paragraph as a real <meta name="description">, matching the ~155 char limit
already enforced by hand on blog posts.
"""
import re

_MAX_LEN = 155
_CODE_FENCE = re.compile(r"^```")
_HEADING = re.compile(r"^#{1,6}\s")
_MD_LINK = re.compile(r"\[([^\]]*)\]\([^)]*\)")
_MD_INLINE = re.compile(r"[*_`]+")
_HTML_TAG = re.compile(r"<[^>]+>")
# A single "*"/"-" followed by whitespace is a list bullet; "**bold**" is not, so
# this must not match on a bare startswith("*") or every bolded lead-in gets skipped.
_SKIP_LINE = re.compile(r"^([-*+>]\s|\||!\[|\d+[.)]\s)")


def _clean(line):
    line = _MD_LINK.sub(r"\1", line)
    line = _HTML_TAG.sub("", line)
    line = _MD_INLINE.sub("", line)
    return line.strip()


def _extract_description(markdown):
    in_code = False
    for raw_line in markdown.splitlines():
        if _CODE_FENCE.match(raw_line):
            in_code = not in_code
            continue
        if in_code:
            continue
        line = raw_line.strip()
        if not line or _HEADING.match(line) or _SKIP_LINE.match(line):
            continue
        text = _clean(line)
        if len(text) < 40:
            continue
        if len(text) <= _MAX_LEN:
            return text
        return text[:_MAX_LEN].rsplit(" ", 1)[0] + "..."
    return None


def on_page_markdown(markdown, *, page, config, files):
    if page.meta.get("description"):
        return markdown
    description = _extract_description(markdown)
    if description:
        page.meta["description"] = description
    return markdown
