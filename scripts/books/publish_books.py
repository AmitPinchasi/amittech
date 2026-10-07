"""Upload the course books to the `books` GitHub release, where the site links to them.

Usage (after make_books.py):
    .venv/bin/python scripts/books/publish_books.py               # uploads books/*.pdf
    .venv/bin/python scripts/books/publish_books.py --dir ~/Desktop/amittech-books --dry-run

Each course's index.md names its download with `book: <name>.pdf` in the front
matter. books/<course>.pdf is uploaded under that name, replacing the previous
upload, so the links on the site (hooks/book_download.py) never change and
publishing new books needs no site deploy.

Uses the gh CLI, logged in to an account that can write to the repo. With two
accounts logged in: GH_TOKEN=$(gh auth token --user AmitPinchasi) .venv/bin/python ...
"""
import argparse
import datetime
import os
import shutil
import subprocess
import sys
import tempfile

from mkdocs.utils.meta import get_data
from pypdf import PdfReader

REPO_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GITHUB_REPO = "AmitPinchasi/amittech"
TAG = "books"


def course_books():
    """course folder -> download file name, from each course index.md's front matter."""
    docs = os.path.join(REPO_DIR, "docs")
    books = {}
    for folder in sorted(os.listdir(docs)):
        index = os.path.join(docs, folder, "index.md")
        if os.path.isfile(index):
            with open(index, encoding="utf-8") as f:
                _, meta = get_data(f.read())
            if meta.get("book"):
                books[folder] = meta["book"]
    return books


def gh(*args, check=True):
    return subprocess.run(["gh", *args, "--repo", GITHUB_REPO], check=check,
                          capture_output=True, text=True)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--dir", default=os.path.join(REPO_DIR, "books"), help="where make_books.py wrote the PDFs")
    ap.add_argument("--dry-run", action="store_true", help="check and list, upload nothing")
    args = ap.parse_args()
    src = os.path.expanduser(args.dir)

    books = course_books()
    missing = [f for f in books if not os.path.isfile(os.path.join(src, f + ".pdf"))]
    if missing:
        sys.exit("no PDF in %s for: %s (run make_books.py first)" % (src, ", ".join(missing)))
    extra = sorted(set(f[:-4] for f in os.listdir(src) if f.endswith(".pdf")) - set(books))
    if extra:
        print("not uploaded (no `book:` in the course's index.md): " + ", ".join(extra))

    rows = []
    for folder, name in books.items():
        path = os.path.join(src, folder + ".pdf")
        pages = len(PdfReader(path).pages)
        size = os.path.getsize(path) / 1e6
        rows.append((folder, name, path, pages, size))
        print("%-22s -> %-40s %5d pages %5.1f MB" % (folder, name, pages, size))
    if args.dry_run:
        return

    today = datetime.date.today().strftime("%d.%m.%Y")
    notes = ["ספרי ה-PDF של הקורסים באתר [amittech.dev](https://amittech.dev/), עודכנו ב-%s." % today, "",
             "| קורס | עמודים | גודל |", "|---|---|---|"]
    notes += ["| %s | %s | %.0f MB |" % (folder.replace("-", " "), "{:,}".format(pages), size)
              for folder, _, _, pages, size in rows]
    notes_file = tempfile.NamedTemporaryFile("w", suffix=".md", delete=False, encoding="utf-8")
    notes_file.write("\n".join(notes) + "\n")
    notes_file.close()

    if gh("release", "view", TAG, check=False).returncode != 0:
        gh("release", "create", TAG, "--title", "ספרי הקורסים", "--notes-file", notes_file.name,
           "--target", "main", "--latest=false")
        print("created release '%s'" % TAG)

    # gh names each asset after its file, so stage copies under the download names
    staging = tempfile.mkdtemp(prefix="books-upload-")
    try:
        files = []
        for folder, name, path, _, _ in rows:
            staged = os.path.join(staging, name)
            try:
                os.link(path, staged)
            except OSError:
                shutil.copy2(path, staged)
            files.append("%s#%s (PDF)" % (staged, folder.replace("-", " ")))
        print("uploading %d books..." % len(files), flush=True)
        result = gh("release", "upload", TAG, "--clobber", *files, check=False)
        if result.returncode != 0:
            sys.exit(result.stderr)
        gh("release", "edit", TAG, "--notes-file", notes_file.name)
    finally:
        shutil.rmtree(staging, ignore_errors=True)
        os.unlink(notes_file.name)
    print("done: https://github.com/%s/releases/tag/%s" % (GITHUB_REPO, TAG))


if __name__ == "__main__":
    main()
