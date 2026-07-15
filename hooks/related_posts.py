"""Append a "related posts" block to every blog post, linking to others that
share tags.

The URL Inspection sample showed only ~20% of blog posts indexed vs. ~70% of
course pages - the blog corpus has almost no internal links tying it
together, so each of the 1,173 posts is close to an orphan page reachable
only through the flat sitemap. This hook builds a genuine post-to-post link
mesh across the whole corpus, using each post's own front-matter tags.
"""
import html

_RELATED_COUNT = 3


def _related_html(current, candidates):
    current_tags = set(current["tags"])
    scored = []
    for other in candidates:
        if other is current:
            continue
        overlap = len(current_tags & set(other["tags"]))
        if overlap:
            scored.append((overlap, other))
    scored.sort(key=lambda pair: pair[0], reverse=True)
    top = [other for _, other in scored[:_RELATED_COUNT]]
    if not top:
        return ""

    items = "\n".join(
        f'<li><a href="/{p["url"]}">{html.escape(p["title"])}</a></li>' for p in top
    )
    return (
        '<div class="related-posts">'
        "<h2>עוד פוסטים בנושא</h2>"
        f"<ul>{items}</ul>"
        "</div>"
    )


def on_env(env, config, files):
    posts = []
    for file in files.documentation_pages():
        page = file.page
        if page is None or page.meta is None or "blog/posts/" not in file.src_uri:
            continue
        tags = page.meta.get("tags") or []
        if not tags:
            continue
        posts.append({"page": page, "title": page.meta.get("title") or page.title, "tags": tags, "url": file.url})

    for post in posts:
        block = _related_html(post, posts)
        if block:
            post["page"].content += block

    return env
