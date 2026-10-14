/* Split the sidebar section rows into two separate actions, as requested:
   clicking the ARROW expands/collapses the section's contents, and clicking the
   TITLE goes into the section. By default Material does both from one click, and
   because `navigation.prune` ships only the current branch, an un-opened chapter
   is a plain link to its first lesson with no contents on the page at all - so
   its arrow can only navigate. Here the arrow instead reveals the chapter's
   table of contents in place, fetching it once on demand (prune stays on, so
   pages are not bloated), while the title still navigates.

   Two row shapes exist in the sidebar:
   - open branch: a <label> toggle whose children are already present. Arrow
     flips the toggle; title navigates to the first lesson.
   - pruned branch: an <a> to the first lesson, no children present. Arrow
     lazy-loads and shows the chapter's topics; title navigates (its default). */
(function () {
  "use strict";

  function injectStyle() {
    if (document.getElementById("sidebar-nav-style")) return;
    var css =
      // make the arrow a clear, comfortably sized click target
      ".md-sidebar--primary .md-nav__icon.brnav-arrow{cursor:pointer;pointer-events:auto;" +
        "border-radius:4px}" +
      ".md-sidebar--primary .md-nav__icon.brnav-arrow:hover{background:var(--am-accent-soft,rgba(67,97,238,.1))}" +
      // lazily-loaded subtree: hidden until expanded
      ".md-sidebar--primary .brnav-sub{display:none}" +
      ".md-sidebar--primary .brnav-expanded>.brnav-sub{display:block}" +
      // point the arrow down when a lazy section is open (its icon has no toggle to do it)
      ".md-sidebar--primary .brnav-expanded>.md-nav__link .brnav-arrow{transform:rotate(-90deg)}" +
      ".md-sidebar--primary .brnav-arrow{transition:transform .2s ease,background .15s}";
    var el = document.createElement("style");
    el.id = "sidebar-nav-style";
    el.textContent = css;
    document.head.appendChild(el);
  }

  function ellipsisText(el) {
    var e = el.querySelector(".md-ellipsis") || el;
    return (e.textContent || "").replace(/\s+/g, " ").trim();
  }

  var cache = {}; // href -> Promise<ul html string> for the section's topics

  // Fetch the section's own page and lift out its list of child topics, with
  // every link rewritten to an absolute URL (the fetched hrefs are relative to
  // that page, not to the one we are on).
  function loadSub(href, title) {
    // Resolve to an ABSOLUTE base first. The fetched page's nav links are
    // relative to *that* page, not to the page we're on, so they must be
    // resolved against this absolute base - otherwise they end up relative to
    // the current page and 404. (This was the bug: a relative base made
    // `new URL(..)` throw, leaving the links pointing at the current chapter.)
    var base;
    try { base = new URL(href, location.href).href; } catch (e) { base = href; }
    if (cache[base]) return cache[base];
    cache[base] = fetch(base, { credentials: "same-origin" })
      .then(function (r) { return r.ok ? r.text() : ""; })
      .then(function (html) {
        if (!html) return null;
        var doc = new DOMParser().parseFromString(html, "text/html");
        var side = doc.querySelector(".md-sidebar--primary");
        if (!side) return null;
        var match = null;
        side.querySelectorAll(".md-nav__item--nested").forEach(function (li) {
          if (match) return;
          var main = li.querySelector(":scope > .md-nav__link");
          if (main && ellipsisText(main) === title) match = li;
        });
        if (!match) return null;
        var sub = match.querySelector(":scope > nav.md-nav");
        if (!sub) return null;
        // show just the chapter's topic list: drop deeper levels (the fetched
        // page has its first lesson pre-expanded, down to heading anchors) and
        // the toggle checkboxes/labels those levels used.
        sub.querySelectorAll("nav.md-nav").forEach(function (n) { n.remove(); });
        sub.querySelectorAll("input.md-nav__toggle").forEach(function (n) { n.remove(); });
        sub.querySelectorAll(".md-nav__icon").forEach(function (n) { n.remove(); });
        // the chapter's own first lesson is the active topic on the fetched page,
        // so it's a non-link <label>; turn it into a link (to this chapter, = base)
        // so the topic list is complete and clickable.
        sub.querySelectorAll("label.md-nav__link").forEach(function (lbl) {
          var a = doc.createElement("a");
          a.className = lbl.className;
          a.setAttribute("href", base);
          a.innerHTML = lbl.innerHTML;
          lbl.parentNode.replaceChild(a, lbl);
        });
        sub.querySelectorAll("a[href]").forEach(function (a) {
          try { a.setAttribute("href", new URL(a.getAttribute("href"), base).href); } catch (e) {}
        });
        // strip the in-list title label the nested nav repeats at its top
        var t = sub.querySelector(":scope > .md-nav__title");
        if (t) t.remove();
        return sub.innerHTML;
      })
      .catch(function () { return null; });
    return cache[base];
  }

  function expandLazy(li, main, arrow) {
    var existing = li.querySelector(":scope > .brnav-sub");
    if (existing) {
      li.classList.toggle("brnav-expanded");
      arrow.setAttribute("aria-expanded", li.classList.contains("brnav-expanded") ? "true" : "false");
      return;
    }
    arrow.classList.add("brnav-loading");
    loadSub(main.getAttribute("href") || main.href, ellipsisText(main)).then(function (innerHtml) {
      arrow.classList.remove("brnav-loading");
      if (!innerHtml) { // fall back to normal navigation if we could not load it
        window.location.href = main.href;
        return;
      }
      var nav = document.createElement("nav");
      nav.className = "md-nav brnav-sub";
      nav.innerHTML = innerHtml;
      li.appendChild(nav);
      li.classList.add("brnav-expanded");
      arrow.setAttribute("aria-expanded", "true");
    });
  }

  function wire(li) {
    if (li.getAttribute("data-brnav")) return;
    var main = li.querySelector(":scope > .md-nav__link");
    if (!main) return;
    // navigation.indexes renders sections-with-an-index as a <div> container that
    // already separates the title link from the toggle label - leave those alone.
    if (main.tagName !== "A" && main.tagName !== "LABEL") return;
    var arrow = main.querySelector(".md-nav__icon");
    if (!arrow) return;
    var toggle = li.querySelector(":scope > input.md-nav__toggle");
    li.setAttribute("data-brnav", "1");
    arrow.classList.add("brnav-arrow");
    arrow.setAttribute("role", "button");
    arrow.setAttribute("tabindex", "0");

    function onArrow(e) {
      e.preventDefault();
      e.stopPropagation();
      if (toggle) { // open branch: real children + a native toggle
        toggle.checked = !toggle.checked;
        var sub = li.querySelector(":scope > nav.md-nav");
        if (sub) sub.setAttribute("aria-expanded", toggle.checked ? "true" : "false");
        arrow.setAttribute("aria-expanded", toggle.checked ? "true" : "false");
      } else if (main.tagName === "A") { // pruned branch: fetch its topics
        expandLazy(li, main, arrow);
      }
    }
    arrow.addEventListener("click", onArrow);
    arrow.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") onArrow(e);
    });

    // Title navigates into the section. For a <label> row (no href) send it to
    // the first lesson; an <a> row already navigates there on its own.
    if (main.tagName !== "A") {
      var firstLeaf = li.querySelector(":scope > nav a.md-nav__link[href]");
      if (firstLeaf) {
        var dest = firstLeaf.href;
        main.style.cursor = "pointer";
        main.addEventListener("click", function (e) {
          if (arrow.contains(e.target)) return; // arrow handles its own clicks
          e.preventDefault();
          window.location.href = dest;
        });
      }
    }
  }

  function init() {
    var side = document.querySelector(".md-sidebar--primary");
    if (!side) return;
    injectStyle();
    side.querySelectorAll(".md-nav__item--nested").forEach(wire);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
