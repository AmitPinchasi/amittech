"""Cap the text stored per search-index entry.

Material downloads search/search_index.json and builds a lunr index from it in
the browser. The site has grown past 2700 pages / 16M characters, which makes
that index cost close to a gigabyte of RAM - enough to get the tab killed on
memory-constrained devices. javascripts/lazy-search.js stops the index from
loading until the user opens search; this hook makes the index itself
affordable to build when it finally does load.

Every page and every heading stays searchable - titles carry a 1000x boost in
the index and are never touched. Only the body text stored per section is
capped, so deep-body matches past the cap are traded away for an index the
browser can actually build.

The file is also rewritten with ensure_ascii=False: Hebrew escaped as \\uXXXX
costs six bytes per character instead of two, which roughly halves the
download for free.
"""
import json
import os

# Characters of body text kept per index entry. Chosen against a measured
# crash threshold - see the note in lazy-search.js.
TEXT_CAP = 400


def _trim(text):
    if len(text) <= TEXT_CAP:
        return text
    cut = text[:TEXT_CAP]
    # Avoid slicing mid-word so the search preview stays readable.
    space = cut.rfind(" ")
    if space > TEXT_CAP // 2:
        cut = cut[:space]
    return cut.rstrip()


def on_post_build(config):
    path = os.path.join(config["site_dir"], "search", "search_index.json")
    if not os.path.exists(path):
        return

    before = os.path.getsize(path)
    with open(path, encoding="utf-8") as f:
        index = json.load(f)

    for doc in index.get("docs", []):
        text = doc.get("text")
        if text:
            doc["text"] = _trim(text)

    with open(path, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, separators=(",", ":"))

    after = os.path.getsize(path)
    print(
        "trim_search_index: {:.1f}MB -> {:.1f}MB ({} entries)".format(
            before / 1048576, after / 1048576, len(index.get("docs", []))
        )
    )
