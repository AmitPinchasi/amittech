"""Publish a build id, so a stale HTML page can notice it is stale.

extra_css/extra_javascript are already cache-busted by cache_bust_assets.py:
a changed stylesheet becomes a new URL, so it can never be served from an old
cache entry. The gap is the HTML itself. GitHub Pages sends every response
with Cache-Control: max-age=600 and offers no way to change that, so a page
held by a browser (or by an intermediate proxy that ignores the TTL) keeps
pointing at the asset versions that were current when it was stored. The
assets it names are fetched correctly - they are simply the wrong ones.

This hook writes the current build id to version.json and exposes the same
value to the templates, which lets the page compare what it was built with
against what the site is serving now. version.json is deliberately tiny so
the check costs nothing, and it is requested with cache: "no-store" so the
answer never comes from the same cache we are trying to detect.

The id is derived from the assets whose staleness is actually visible, so it
only changes when a rebuild would change what the page looks like.
"""
import hashlib
import json
import os

STAMPED_ASSETS = (
    "stylesheets/extra.css",
    "stylesheets/themes.css",
    "javascripts/progress.js",
    "javascripts/theme-switcher.js",
)

_build_id = None


def _digest(docs_dir):
    h = hashlib.md5()
    for rel in STAMPED_ASSETS:
        path = os.path.join(docs_dir, rel)
        if os.path.isfile(path):
            with open(path, "rb") as f:
                h.update(f.read())
    return h.hexdigest()[:12]


def on_config(config):
    global _build_id
    _build_id = _digest(config["docs_dir"])
    config["extra"] = config.get("extra") or {}
    config["extra"]["build_id"] = _build_id
    return config


def on_post_build(config):
    """Emit version.json alongside the built site."""
    if not _build_id:
        return
    out = os.path.join(config["site_dir"], "version.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump({"build": _build_id}, f)
