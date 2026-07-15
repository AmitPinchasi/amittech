"""Emit the N most recent blog posts for the homepage's recent-posts section.

Blog posts get almost no internal links from anywhere but the flat sitemap -
the homepage, course nav, and course pages never link into the blog corpus.
This hook collects the newest posts (title/url/description) at build time so
the homepage can link directly to a rotating set of them.
"""
import json
import os

_RECENT_COUNT = 10
_posts = []


def on_env(env, config, files):
    _posts.clear()
    for file in files.documentation_pages():
        page = file.page
        if page is None or "blog/posts/" not in file.src_uri:
            continue
        date = page.meta.get("date") if page.meta else None
        if not date:
            continue
        _posts.append(
            {
                "date": str(date),
                "title": page.meta.get("title") or page.title,
                "description": page.meta.get("description", ""),
                "url": file.url,
            }
        )
    return env


def on_post_build(config):
    _posts.sort(key=lambda p: p["date"], reverse=True)
    out_dir = os.path.join(config["site_dir"], "assets")
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, "recent-posts.json"), "w", encoding="utf-8") as f:
        json.dump(_posts[:_RECENT_COUNT], f, ensure_ascii=False)
