"""Build a PDF book for each course on the site.

Usage (from the repo root):
    .venv/bin/python scripts/books/make_books.py                    # every course
    .venv/bin/python scripts/books/make_books.py --course ליבת-המחשב  # just one (repeatable)
    .venv/bin/python scripts/books/make_books.py --base-url http://127.0.0.1:8000
        # reuse an `AMITTECH_BOOKS=1 mkdocs serve` that is already running

Needs: pip install -r scripts/books/requirements.txt, and Google Chrome.

How it works: hooks/build_books.py (enabled by AMITTECH_BOOKS=1) writes each
course's nav tree and rendered pages to books/<course>.json in the served
site. This script turns that into one HTML book - cover, table of contents,
a chapter per section, solutions in an appendix - and prints it with Chrome.
It prints twice: the first PDF tells it which page every chapter, lesson and
solution landed on, and the second fills those numbers into the table of
contents and the exercise <-> solution references.

Output: books/<course>.pdf (gitignored).
"""
import argparse
import datetime
import html as html_lib
import io
import json
import logging
import os
import re
import socket
import subprocess
import sys
import threading
import time
import urllib.request
from urllib.parse import quote, unquote, urljoin

from playwright.sync_api import sync_playwright
from pypdf import PdfReader, PdfWriter

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HERE = os.path.dirname(os.path.abspath(__file__))
SITE = "https://amittech.dev"
AUTHOR = "עמית פנחסי"
MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט",
          "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"]

SOLUTION = "פתרון"
EXERCISES = {"תרגול", "תרגיל"}
LECTURE = "הרצאה"

PLACEHOLDER = "000"

# Chrome's PDFs declare a trailer /Size a little short of their object count;
# pypdf reads them fine but warns about it on every pass
logging.getLogger("pypdf").setLevel(logging.ERROR)

HEADERLINK_RE = re.compile(r'<a class="headerlink"[^>]*>.*?</a>', re.S)
ID_RE = re.compile(r'\bid="([^"]+)"')
HREF_RE = re.compile(r'\bhref="([^"]*)"')
URL_REF_RE = re.compile(r'url\(#([^)]+)\)')
SRC_RE = re.compile(r'(<(?:img|source|video)\b[^>]*?\s)src="([^"]*)"')
HEADING_RE = re.compile(r'<(/?)h([1-6])\b')
LEADING_H1_RE = re.compile(r'^\s*<h1\b[^>]*>.*?</h1>', re.S)
VIDEO_WRAP_RE = re.compile(
    r'<div[^>]*padding-bottom:\s*56\.25%[^>]*>\s*(<iframe\b[^>]*>\s*</iframe>)\s*</div>', re.S)
IFRAME_RE = re.compile(r'<iframe\b[^>]*\bsrc="([^"]+)"[^>]*>\s*</iframe>', re.S)
YOUTUBE_RE = re.compile(r'youtube(?:-nocookie)?\.com/embed/([\w-]+)')
DETAILS_RE = re.compile(r'<details(?![^>]*\bopen\b)')
CHAPTER_NUM_RE = re.compile(r'^\d+\s*-\s*')

PLAY_ICON = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10,16.5V7.5L16,12M12,2A10,10 0 0,0 '
             '2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/></svg>')


def page_type(name):
    _, sep, suffix = name.rpartition(" - ")
    return suffix.strip() if sep else ""


def esc(text):
    return html_lib.escape(text, quote=True)


def iter_pages(nodes):
    for node in nodes:
        if node["type"] == "page":
            yield node
        else:
            yield from iter_pages(node["children"])


def default_title(dirname):
    """MkDocs' title for a folder with no explicit one (mkdocs.utils.dirname_to_title)."""
    title = dirname.replace("-", " ").replace("_", " ")
    return title.capitalize() if title.lower() == title else title


def restore_section_titles(nodes, depth=1):
    """Section titles come from folder names with every '-' turned into a space
    ("1.5 - אתגר CTF - סריקות" -> "1.5   אתגר CTF   סריקות"). Put the folder
    name back wherever that default was used; titles set in .pages stay."""
    squash = lambda s: " ".join(s.split()).lower()
    for node in nodes:
        if node["type"] != "section":
            continue
        page = next(iter_pages(node["children"]), None)
        if page is not None:
            parts = page["src"].split("/")
            if len(parts) > depth + 1:
                dirname = parts[depth]
                if squash(node["title"]) == squash(default_title(dirname)):
                    node["title"] = dirname
        restore_section_titles(node["children"], depth + 1)


def link_card(url, label):
    return ('<p class="link-card">%s<a href="%s">%s<br><span class="url">%s</span></a></p>'
            % (PLAY_ICON, esc(url), esc(label), esc(url)))


class Book:
    def __init__(self, course):
        self.course = course
        restore_section_titles(course["tree"])
        self.pages = list(iter_pages(course["tree"]))
        self.url_map = {}
        for i, page in enumerate(self.pages):
            page["idx"] = i
            self.url_map["/" + unquote(page["url"])] = i
        self.toc = []           # (level, anchor, title)
        self.solutions = []     # (heading, solution page, exercise page or None)
        self.anchor_count = 0
        self.has_math = False

    # ---------- page HTML clean-up ----------

    def anchor(self):
        self.anchor_count += 1
        return "s%d" % self.anchor_count

    def resolve_href(self, href, page_url_q, prefix):
        if href.startswith("#"):
            return "#" + prefix + href[1:] if len(href) > 1 else href
        if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", href) or href.startswith("//"):
            return href
        absolute = urljoin(page_url_q, href)
        path, _, fragment = absolute.partition("#")
        key = unquote(path)
        if not key.endswith("/") and not os.path.splitext(key)[1]:
            key += "/"
        target = self.url_map.get(key)
        if target is not None:
            return "#p%d-%s" % (target, fragment) if fragment else "#p%d" % target
        return SITE + path + ("#" + fragment if fragment else "")

    def clean(self, page, shift, drop_h1=True):
        html = page.get("html") or ""
        prefix = "p%d-" % page["idx"]
        page_url_q = "/" + quote(page["url"])
        if "arithmatex" in html:
            self.has_math = True
        html = HEADERLINK_RE.sub("", html)
        if drop_h1:
            html = LEADING_H1_RE.sub("", html, count=1)
        html = VIDEO_WRAP_RE.sub(r"\1", html)

        def iframe(m):
            src = m.group(1)
            yt = YOUTUBE_RE.search(src)
            if yt:
                return link_card("https://youtu.be/" + yt.group(1), "צפו בסרטון ב-YouTube")
            return link_card(src, "תוכן אינטראקטיבי באתר")
        html = IFRAME_RE.sub(iframe, html)
        html = DETAILS_RE.sub("<details open", html)
        html = ID_RE.sub(lambda m: 'id="%s%s"' % (prefix, m.group(1)), html)
        html = URL_REF_RE.sub(lambda m: "url(#%s%s)" % (prefix, m.group(1)), html)
        html = HREF_RE.sub(lambda m: 'href="%s"' % esc(self.resolve_href(
            html_lib.unescape(m.group(1)), page_url_q, prefix)), html)
        html = SRC_RE.sub(lambda m: '%ssrc="%s"' % (
            m.group(1), m.group(2) if re.match(r"^(data|https?):", m.group(2))
            else urljoin(page_url_q, m.group(2))), html)
        if shift:
            html = HEADING_RE.sub(lambda m: "<%sh%d" % (m.group(1), min(6, int(m.group(2)) + shift)), html)
        return html

    # ---------- structure ----------

    def heading(self, level, title, anchor=None, cls="", toc=False):
        anchor = anchor or self.anchor()
        if toc:
            self.toc.append((level, anchor, title))
        cls_attr = ' class="%s"' % cls if cls else ""
        return '<h%d id="%s"%s>%s</h%d>' % (level, anchor, cls_attr, esc(title), level)

    def page_block(self, page, inner):
        return '<div class="page" id="p%d">%s</div>' % (page["idx"], inner)

    def render_section(self, section, level):
        out = []
        title = section["title"]
        if level == 1:
            title = "פרק " + title if CHAPTER_NUM_RE.match(title) else title
            out.append(self.heading(1, title, cls="chapter", toc=True))
        else:
            out.append(self.heading(min(level, 6), title, cls="topic" if level == 2 else "",
                                    toc=level == 2))
        children = section["children"]
        pages = [c for c in children if c["type"] == "page"]
        index = next((p for p in pages if p["name"] == "index"), None)
        if index is not None:
            out.append(self.page_block(index, self.clean(index, level - 1)))
        # an empty file (there is one: core 4.4's exercise) would print as a bare label
        empty = {id(p) for p in pages if not (p.get("html") or "").strip()}
        lessons = [p for p in pages if p["name"] != "index" and page_type(p["name"]) != SOLUTION
                   and id(p) not in empty]
        solutions = [p for p in pages if page_type(p["name"]) == SOLUTION and id(p) not in empty]
        exercise = next((p for p in lessons if page_type(p["name"]) in EXERCISES), None)
        for sol in solutions:
            self.solutions.append((section["title"], sol, exercise))
        skip = {id(index)} | {id(s) for s in solutions} | empty

        for child in children:
            if child["type"] == "section":
                out.append(self.render_section(child, level + 1))
            elif id(child) in skip:
                continue
            elif level == 1:
                # a lesson page sitting directly in a chapter: treat it like a topic
                out.append('<h2 id="%s" class="topic">%s</h2>' % ("p%d" % child["idx"], esc(child["title"])))
                self.toc.append((2, "p%d" % child["idx"], child["title"]))
                out.append(self.clean(child, 1))
            else:
                out.append(self.render_lesson(child, section["title"], level, lessons))
        return "\n".join(out)

    def render_lesson(self, page, topic_title, level, lessons):
        title = page["title"]
        prefix = topic_title + " - "
        label = title[len(prefix):] if title.startswith(prefix) else title
        first = lessons and lessons[0] is page
        show_label = not (first and (label == LECTURE or len(lessons) == 1))
        parts = []
        if show_label:
            parts.append(self.heading(min(level + 1, 6), label, cls="label"))
            parts.append(self.clean(page, level))
        else:
            parts.append(self.clean(page, level - 1))
        if page_type(page["name"]) in EXERCISES:
            sol = next((s for (_, s, ex) in self.solutions if ex is page), None)
            if sol is not None:
                parts.append(self.pageref("p%d" % sol["idx"], "לפתרון"))
        return self.page_block(page, "\n".join(parts))

    def pageref(self, anchor, text):
        return ('<p class="xref"><a href="#%s">%s: עמוד <span class="pg" data-ref="%s">%s</span></a></p>'
                % (anchor, esc(text), anchor, PLACEHOLDER))

    def render_appendix(self):
        if not self.solutions:
            return ""
        out = [self.heading(1, "נספח - פתרונות", cls="chapter", toc=True)]
        for topic_title, sol, exercise in self.solutions:
            body = [self.heading(2, topic_title, anchor="p%d" % sol["idx"], cls="topic solution")]
            if exercise is not None:
                body.append(self.pageref("p%d" % exercise["idx"], "לתרגיל"))
            body.append(self.clean(sol, 1))
            out.append('<div class="page">%s</div>' % "\n".join(body))
        return "\n".join(out)

    def render_toc(self):
        rows = []
        for level, anchor, title in self.toc:
            rows.append('<li class="toc-%d"><a href="#%s"><span class="t">%s</span><span class="dots"></span>'
                        '<span class="pg" data-ref="%s">%s</span></a></li>'
                        % (level, anchor, esc(title), anchor, PLACEHOLDER))
        return ('<section class="toc"><h1 class="toc-title">תוכן העניינים</h1><ol>%s</ol></section>'
                % "".join(rows))

    def render_cover(self):
        today = datetime.date.today()
        return ('<section class="cover">'
                '<img class="logo" src="/amittech.png" alt="">'
                '<p class="category">%s</p>'
                '<h1 class="cover-title">%s</h1>'
                '<p class="author">%s</p>'
                '<p class="edition">%s %d</p>'
                '<p class="site">הגרסה המעודכנת של הקורס, עם הסרטונים והתרגולים, נמצאת באתר '
                '<a href="%s">amittech.dev</a></p>'
                '</section>'
                % (esc(self.course["category"]), esc(self.course["title"]), esc(AUTHOR),
                   MONTHS[today.month - 1], today.year, SITE + "/" + quote(self.course["slug"]) + "/"))

    def render(self, head):
        body = []
        tree = self.course["tree"]
        intro = next((n for n in tree if n["type"] == "page" and n["name"] == "index"), None)
        if intro is not None:
            body.append(self.heading(1, "על הקורס", cls="chapter", toc=True))
            body.append(self.page_block(intro, self.clean(intro, 0)))
        for node in tree:
            if node["type"] == "section":
                body.append(self.render_section(node, 1))
            elif node is not intro:
                body.append(self.heading(1, node["title"], cls="chapter", toc=True))
                body.append(self.page_block(node, self.clean(node, 0)))
        body.append(self.render_appendix())
        content = "\n".join(body)
        # the TOC is rendered last so it lists every heading registered above
        return ('<!doctype html><html lang="he" dir="rtl" data-md-color-scheme="default"><head>%s</head>'
                '<body><article class="md-typeset book">%s%s%s</article></body></html>'
                % (head(self), self.render_cover(), self.render_toc(), content))


# ---------- site / server ----------

def fetch(url):
    with urllib.request.urlopen(url, timeout=120) as r:
        return r.read().decode("utf-8")


def site_head(base):
    home = fetch(base + "/")
    sheets = []
    for href in re.findall(r'<link rel="stylesheet" href="([^"]+)"', home):
        if "assets/stylesheets/main." in href or "assets/stylesheets/palette." in href \
                or "stylesheets/extra.css" in href:
            sheets.append(urljoin(base + "/", href))
    css = open(os.path.join(HERE, "book.css"), encoding="utf-8").read()

    def head(book):
        title = book.course["title"]
        parts = [
            '<meta charset="utf-8">',
            "<title>%s - עמית טק</title>" % esc(title),
            '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
            '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;'
            '700;800&family=Roboto+Mono:ital,wght@0,400;0,700;1,400&display=swap">',
        ]
        parts += ['<link rel="stylesheet" href="%s">' % esc(s) for s in sheets]
        parts.append('<style>:root{--md-text-font:"Heebo";--md-code-font:"Roboto Mono"}</style>')
        parts.append("<style>%s</style>" % css)
        parts.append('<style>@page{@top-left{content:"%s"}}</style>' % title.replace('"', ""))
        if book.has_math:
            parts.append('<script src="%s/javascripts/mathjax.js"></script>' % base)
            parts.append('<script src="https://unpkg.com/mathjax@3/es5/tex-mml-chtml.js"></script>')
        return "\n".join(parts)
    return head


def free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def start_server():
    port = free_port()
    env = dict(os.environ, AMITTECH_BOOKS="1")
    mkdocs = os.path.join(REPO, ".venv", "bin", "mkdocs")
    if not os.path.exists(mkdocs):
        mkdocs = "mkdocs"
    proc = subprocess.Popen([mkdocs, "serve", "-a", "127.0.0.1:%d" % port, "--no-livereload"],
                            cwd=REPO, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                            text=True, bufsize=1)
    ready = threading.Event()
    log = []

    def pump():
        for line in proc.stdout:
            log.append(line)
            if "Serving on" in line:
                ready.set()
    threading.Thread(target=pump, daemon=True).start()
    print("building the site (a few minutes)...", flush=True)
    while not ready.wait(5):
        if proc.poll() is not None:
            sys.exit("mkdocs serve exited:\n" + "".join(log[-30:]))
    return proc, "http://127.0.0.1:%d" % port


# ---------- printing ----------

def page_numbers(pdf_bytes):
    reader = PdfReader(io.BytesIO(pdf_bytes))
    numbers = {}
    for name, dest in reader.named_destinations.items():
        try:
            numbers[str(name).lstrip("/")] = reader.get_destination_page_number(dest) + 1
        except Exception:
            pass
    return numbers, len(reader.pages)


def finish_pdf(data, book, numbers, out_path):
    """Bookmarks, metadata and reading direction. Chrome can generate an
    outline itself, but it writes Hebrew titles in visual word order
    ("בסיסי לינוקס") and bookmarks every heading in every lesson; this one
    mirrors the table of contents instead."""
    writer = PdfWriter(clone_from=PdfReader(io.BytesIO(data)))
    writer.add_outline_item("תוכן העניינים", 1)
    parent = None
    for level, anchor, title in book.toc:
        if anchor not in numbers:
            continue
        item = writer.add_outline_item(title, numbers[anchor] - 1, parent=parent if level > 1 else None)
        if level == 1:
            parent = item
    writer.add_metadata({"/Title": "%s - עמית טק" % book.course["title"], "/Author": AUTHOR})
    writer.create_viewer_preferences().direction = "/R2L"
    writer.page_mode = "/UseOutlines"
    with open(out_path, "wb") as f:
        writer.write(f)


def print_book(browser, base, book, book_html, out_path):
    slug, has_math = book.course["slug"], book.has_math
    url = "%s/books/%s.html" % (base, quote(slug))
    context = browser.new_context(reduced_motion="reduce", color_scheme="light")
    context.set_default_timeout(0)  # the largest books take minutes to lay out and print
    page = context.new_page()
    page.route(url, lambda route: route.fulfill(
        status=200, body=book_html, headers={"content-type": "text/html; charset=utf-8"}))
    page.goto(url, wait_until="load", timeout=0)
    page.evaluate("document.fonts.ready.then(() => true)")
    if has_math:
        page.wait_for_function("window.MathJax && MathJax.startup && MathJax.startup.promise", timeout=120000)
        page.evaluate("MathJax.startup.promise.then(() => true)")
    refs = page.eval_on_selector_all("[data-ref]", "els => [...new Set(els.map(e => e.dataset.ref))]")

    def pdf():
        return page.pdf(format="A4", print_background=True, prefer_css_page_size=True, tagged=True)

    data = pdf()
    for attempt in range(3):
        numbers, total = page_numbers(data)
        missing = [r for r in refs if r not in numbers]
        page.evaluate("""nums => document.querySelectorAll('[data-ref]').forEach(el => {
            el.textContent = nums[el.dataset.ref] || '';
        })""", {r: str(numbers[r]) for r in refs if r in numbers})
        data = pdf()
        check, total = page_numbers(data)
        moved = [r for r in refs if r in numbers and check.get(r) != numbers[r]]
        if not moved:
            break
        print("  %d references moved after filling page numbers, again" % len(moved), flush=True)
    finish_pdf(data, book, check, out_path)
    context.close()
    return total, missing


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--course", action="append", help="course folder name, e.g. ליבת-המחשב (repeatable)")
    ap.add_argument("--base-url", help="an AMITTECH_BOOKS=1 mkdocs serve that is already running")
    ap.add_argument("--out", default=os.path.join(REPO, "books"))
    ap.add_argument("--html", action="store_true", help="also save the assembled HTML next to each PDF")
    args = ap.parse_args()

    proc = None
    base = args.base_url.rstrip("/") if args.base_url else None
    if base is None:
        proc, base = start_server()
    try:
        courses = json.loads(fetch(base + "/books/index.json"))
        if args.course:
            unknown = set(args.course) - {c["slug"] for c in courses}
            if unknown:
                sys.exit("unknown course(s): %s\navailable: %s" % (
                    ", ".join(sorted(unknown)), ", ".join(c["slug"] for c in courses)))
            courses = [c for c in courses if c["slug"] in args.course]
        os.makedirs(args.out, exist_ok=True)
        head = site_head(base)
        with sync_playwright() as p:
            browser = p.chromium.launch(channel="chrome")
            for c in courses:
                started = time.time()
                course = json.loads(fetch(base + "/books/" + quote(c["slug"]) + ".json"))
                book = Book(course)
                book_html = book.render(head)
                out_path = os.path.join(args.out, c["slug"] + ".pdf")
                if args.html:
                    with open(out_path[:-4] + ".html", "w", encoding="utf-8") as f:
                        f.write(book_html)
                total, missing = print_book(browser, base, book, book_html, out_path)
                note = (" (%d references without a page number)" % len(missing)) if missing else ""
                shown = os.path.relpath(out_path, REPO) if out_path.startswith(REPO + os.sep) else out_path
                print("%s: %d pages, %.0fs -> %s%s" % (c["title"], total, time.time() - started,
                                                        shown, note), flush=True)
            browser.close()
    finally:
        if proc is not None:
            proc.terminate()


if __name__ == "__main__":
    main()
