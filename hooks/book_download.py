"""Download links for the course PDF books.

A course opts in with `book: <file>.pdf` in its index.md front matter. The
PDFs themselves are not in the repo (every deploy clones the full history,
so a few hundred MB of regenerated PDFs would weigh on every build after);
scripts/books/publish_books.py uploads them as assets of the `books` GitHub
release, whose download URLs stay the same each time the books are rebuilt.

This hook adds a download button under the intro of each such course page,
and fills the `<!-- books-list -->` marker on the books page with every
course that has a book, grouped like the nav.
"""
import html
import re

from mkdocs.utils.meta import get_data

RELEASE_URL = "https://github.com/AmitPinchasi/amittech/releases/download/books/"
LIST_MARKER = "<!-- books-list -->"

DOWNLOAD_ICON = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" '
                 'style="vertical-align:-4px;margin-inline-end:6px;fill:currentColor" aria-hidden="true">'
                 '<path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/></svg>')

_books = {}       # course folder -> pdf file name
_courses = []     # [(category, course title, course url, folder)] in nav order


def book_url(name):
    return RELEASE_URL + name


def on_files(files, config):
    _books.clear()
    for f in files.documentation_pages():
        parts = f.src_uri.split("/")
        if len(parts) == 2 and parts[1] == "index.md":
            with open(f.abs_src_path, encoding="utf-8") as fh:
                _, meta = get_data(fh.read())
            if meta.get("book"):
                _books[parts[0]] = meta["book"]
    return files


def on_nav(nav, config, files):
    _courses.clear()
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
            folder = index.file.src_uri.split("/", 1)[0]
            if folder in _books:
                _courses.append((category.title, course.title, index.url, folder))
    return nav


def _button(name):
    return ('<p class="book-download"><a class="md-button" href="%s">%s'
            'הורדת הקורס כספר PDF</a></p>' % (html.escape(book_url(name)), DOWNLOAD_ICON))


def _books_list(page_url):
    out, current = [], None
    depth = page_url.strip("/").count("/") + 1 if page_url.strip("/") else 0
    up = "../" * depth
    for category, title, url, folder in _courses:
        if category != current:
            if current is not None:
                out.append("</ul>")
            out.append("<h2>%s</h2><ul>" % html.escape(category))
            current = category
        out.append('<li><a href="%s%s">%s</a> - <a href="%s">הורדת הספר (PDF)</a></li>'
                   % (up, html.escape(url), html.escape(title), html.escape(book_url(_books[folder]))))
    if current is not None:
        out.append("</ul>")
    return "\n".join(out)


def on_page_content(content, page, config, files):
    parts = page.file.src_uri.split("/")
    if len(parts) == 2 and parts[1] == "index.md" and parts[0] in _books:
        button = _button(_books[parts[0]])
        # under the course's opening paragraph, or right after its title
        m = re.search(r"</h1>\s*<p\b.*?</p>", content, re.S) or re.search(r"</h1>", content)
        if m:
            return content[:m.end()] + "\n" + button + content[m.end():]
        return button + content
    if LIST_MARKER in content:
        return content.replace(LIST_MARKER, _books_list(page.url))
    return content
