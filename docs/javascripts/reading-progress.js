/* Per-lecture reading progress: how much of the lecture you're reading is behind
   you, and how much is left. A thin bar fills across the top as you scroll, and a
   small pill shows the percentage. This is separate from progress.js, which tracks
   how many *lessons in the course* you have marked complete - here it is scroll
   position within the single page you are on.

   Progress is measured against the article itself (.md-content__inner), so 100%
   means the end of the lecture, not the end of the footer below it. Shown on
   article pages (lessons and blog posts, i.e. two or more path segments deep) that
   are long enough to scroll; hidden on short pages, landing pages, and in print. */
(function () {
  "use strict";

  function depth() {
    var parts = location.pathname.split("/").filter(Boolean);
    if (parts[0] === "amittech") parts.shift();
    return parts.length;
  }

  // lessons and blog posts are >= 2 segments deep; home/course-index/about are not
  if (depth() < 2) return;

  function injectStyle() {
    if (document.getElementById("reading-progress-style")) return;
    var css =
      ".reading-progress-bar{position:fixed;top:0;right:0;height:3px;width:0;z-index:61;" +
        "background:var(--am-accent,#4361ee);transition:width .1s linear;pointer-events:none}" +
      ".reading-progress-pill{position:fixed;bottom:16px;right:16px;z-index:60;" +
        "display:none;align-items:center;gap:5px;height:30px;padding:0 11px;border-radius:15px;" +
        "font-family:inherit;font-size:.68rem;font-weight:700;line-height:1;" +
        "color:var(--am-text,#0a1628);background:var(--am-surface,#fff);" +
        "border:1px solid var(--am-border,#d0d5dd);box-shadow:0 3px 10px rgba(0,0,0,.12);pointer-events:none}" +
      ".reading-progress-pill b{color:var(--am-accent,#4361ee);font-weight:800}" +
      ".reading-active .reading-progress-pill{display:inline-flex}" +
      "@media print{.reading-progress-bar,.reading-progress-pill{display:none!important}}";
    var el = document.createElement("style");
    el.id = "reading-progress-style";
    el.textContent = css;
    document.head.appendChild(el);
  }

  var bar, pill, pctEl, article;

  function build() {
    article = document.querySelector(".md-content__inner");
    if (!article) return;
    injectStyle();
    bar = document.createElement("div");
    bar.className = "reading-progress-bar";
    pill = document.createElement("div");
    pill.className = "reading-progress-pill";
    pill.setAttribute("aria-hidden", "true");
    pill.setAttribute("title", "כמה מההרצאה כבר קראת");
    pill.innerHTML = '<span>נקרא</span><b class="reading-progress-pct">0%</b>';
    pctEl = pill.querySelector(".reading-progress-pct");
    document.body.appendChild(bar);
    document.body.appendChild(pill);
    update();
  }

  function update() {
    if (!article) return;
    var rect = article.getBoundingClientRect();
    // doc coordinate of the article's end, and how far you must scroll to bring
    // that end up to the bottom of the viewport (= finished the lecture)
    var articleBottom = rect.bottom + window.pageYOffset;
    var finish = articleBottom - window.innerHeight;
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable < 40 || finish <= 0) {
      // page does not really scroll - nothing to track
      document.documentElement.classList.remove("reading-active");
      if (bar) bar.style.width = "0";
      return;
    }
    document.documentElement.classList.add("reading-active");
    // 0% at the top, 100% when the end of the lecture reaches the screen
    var pct = Math.max(0, Math.min(100, Math.round(window.pageYOffset / finish * 100)));
    bar.style.width = pct + "%";
    pctEl.textContent = pct + "%";
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { update(); ticking = false; });
  }

  function start() {
    build();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
