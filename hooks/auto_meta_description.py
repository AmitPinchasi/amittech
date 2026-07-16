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
_HR = re.compile(r"^(-{3,}|\*{3,}|_{3,})$")
_MD_LINK = re.compile(r"\[([^\]]*)\]\([^)]*\)")
_MD_INLINE = re.compile(r"[*_`]+")
_HTML_TAG = re.compile(r"<[^>]+>")
# Never include: images and table rows carry no standalone prose.
_SKIP_LINE = re.compile(r"^(\||!\[)")
# A single "*"/"-" followed by whitespace is a list marker; "**bold**" is not, so
# this must not match on a bare startswith("*") or every bolded lead-in strips.
_LIST_MARKER = re.compile(r"^([-*+>]\s+|\d+[.)]\s+)")


def _clean(line):
    line = _MD_LINK.sub(r"\1", line)
    line = _HTML_TAG.sub("", line)
    line = _MD_INLINE.sub("", line)
    return line.strip()


def _finish_paragraph(lines):
    if not lines:
        return None
    text = _clean(" ".join(lines))
    if len(text) < 40:
        return None
    if len(text) <= _MAX_LEN:
        return text
    return text[:_MAX_LEN].rsplit(" ", 1)[0] + "..."


def _extract_description(markdown):
    in_code = False
    paragraph = []
    for raw_line in markdown.splitlines():
        # Fences nested under a list item are indented (tabs/spaces), so the
        # check must strip first or those code blocks leak into descriptions.
        if _CODE_FENCE.match(raw_line.strip()):
            in_code = not in_code
            continue
        if in_code:
            continue
        line = raw_line.strip()
        # Headings/rules start a new section, so whatever came before them
        # must be finalized now - never carried into an unrelated section.
        if _HEADING.match(line) or _HR.match(line):
            result = _finish_paragraph(paragraph)
            if result:
                return result
            paragraph = []
            continue
        # A short lead-in sentence introducing a list ("X:\n\n- a\n- b") is
        # common on exercise/solution pages and often falls under the 40-char
        # floor alone. Blank lines and list markers are soft breaks: strip the
        # marker and keep folding the text in, so the lead-in plus its list
        # items become one real description instead of being discarded.
        if not line or _SKIP_LINE.match(line):
            continue
        line = _LIST_MARKER.sub("", line).strip()
        if line:
            paragraph.append(line)
    return _finish_paragraph(paragraph)


def on_page_markdown(markdown, *, page, config, files):
    if page.meta.get("description"):
        return markdown
    description = _extract_description(markdown)
    if description:
        page.meta["description"] = description
    return markdown
