"""Force browsers to fetch fresh extra_css/extra_javascript on every content
change, regardless of any CDN or browser Cache-Control TTL.

Unlike the theme's own bundled assets (assets/stylesheets/main.<hash>.min.css),
MkDocs serves extra_css/extra_javascript at a fixed URL across builds, so a
change to stylesheets/extra.css keeps the previously cached response valid
for every client until its cache happens to re-validate - which can leave
visitors on stale, broken-looking CSS for as long as their browser (or a
network cache in between) decides to hold onto it. Appending a content hash
as a query string makes any changed file a new URL, so an existing cache
entry is a guaranteed miss.
"""
import hashlib
import os


def _content_hash(path):
    with open(path, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()[:8]


def _busted_path(rel_path, docs_dir):
    abs_path = os.path.join(docs_dir, rel_path)
    if not os.path.isfile(abs_path):
        return rel_path
    return f"{rel_path}?v={_content_hash(abs_path)}"


def on_config(config):
    docs_dir = config["docs_dir"]
    config["extra_css"] = [_busted_path(p, docs_dir) for p in config["extra_css"]]

    scripts = config["extra_javascript"]
    for i, script in enumerate(scripts):
        if hasattr(script, "path"):
            script.path = _busted_path(script.path, docs_dir)
        else:
            scripts[i] = _busted_path(script, docs_dir)
    return config
