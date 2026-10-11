/* "Brainrot mode" - a desktop-only toggle that splits the screen: a muted,
   looping Subway Surfers gameplay clip plays in a fixed panel down the left
   side (portrait gameplay suits a tall column), and the amittech site sits in
   the right side. A draggable divider between them sets the proportion. A
   playful attention gimmick for the students, off by default; the on/off state
   and the chosen proportion are remembered per browser.

   Desktop only: the button and the whole split are gated behind a wide-screen +
   fine-pointer media query, so phones and tablets are never affected. The
   gameplay is a YouTube embed (same mechanism the lessons already use); swap
   VIDEO_ID below for a different clip. */
(function () {
  "use strict";

  // Subway Surfers gameplay, "No Copyright 4K (1 HOUR)". Swap for any YouTube id.
  var VIDEO_ID = "iKggOfcKM28";
  var STORAGE_KEY = "am-brainrot";
  var SPLIT_KEY = "am-brainrot-split"; // game width, as a percentage of the viewport
  var DEFAULT_SPLIT = 50;
  var MIN_SPLIT = 20, MAX_SPLIT = 80; // keep both sides usable
  var DESKTOP = "(min-width: 76.25em) and (pointer: fine)";

  var GAME_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M7.97 16L5 19c-.33.3-.77.5-1.25.5a1.75 1.75 0 0 1-1.75-1.75c0-.12.01-.24.04-.35L4 9.3A4 4 0 0 1 7.94 6h8.12A4 4 0 0 1 20 9.3l1.96 8.1c.03.11.04.23.04.35A1.75 1.75 0 0 1 20.25 19.5c-.48 0-.92-.2-1.25-.5l-2.97-3H7.97M8 9v2H6v2h2v2h2v-2h2v-2h-2V9H8m9 0a1 1 0 0 0-1 1 1 1 0 0 0 1 1 1 1 0 0 0 1-1 1 1 0 0 0-1-1m-2 3a1 1 0 0 0-1 1 1 1 0 0 0 1 1 1 1 0 0 0 1-1 1 1 0 0 0-1-1Z"/>' +
    "</svg>";

  function desktop() {
    try { return window.matchMedia(DESKTOP).matches; } catch (e) { return false; }
  }

  function injectStyle() {
    if (document.getElementById("brainrot-style")) return;
    // --brainrot-split drives the game width, the site's left padding, and the
    // positions of the divider and the button, so dragging updates them together.
    var css =
      ":root{--brainrot-split:" + DEFAULT_SPLIT + "vw}" +
      ".brainrot-toggle{display:none}" +
      "@media " + DESKTOP + "{" +
      ".brainrot-toggle{position:fixed;bottom:16px;left:16px;z-index:60;display:inline-flex;" +
        "align-items:center;gap:7px;height:40px;padding:0 15px;border-radius:20px;cursor:pointer;" +
        "font-family:inherit;font-size:.72rem;font-weight:700;line-height:1;" +
        "color:var(--am-accent,#4361ee);background:var(--am-surface,#fff);" +
        "border:1px solid var(--am-border,#d0d5dd);box-shadow:0 4px 14px rgba(0,0,0,.14);" +
        "transition:left .25s ease,color .15s,border-color .15s}" +
      ".brainrot-toggle:hover{color:var(--am-accent-hover,#ff1b6b);border-color:var(--am-accent-hover,#ff1b6b)}" +
      ".brainrot-toggle:focus-visible{outline:2px solid var(--am-accent,#4361ee);outline-offset:2px}" +
      ".brainrot-toggle svg{width:19px;height:19px;fill:currentColor;flex:none}" +
      ".brainrot-toggle .brainrot-off{display:none}" +
      // game fills the LEFT side, so the site (and its button) move to the RIGHT side
      "html.brainrot-on .brainrot-toggle{left:calc(var(--brainrot-split) + 16px);color:#fff;" +
        "background:var(--am-accent,#4361ee);border-color:var(--am-accent,#4361ee)}" +
      "html.brainrot-on .brainrot-toggle .brainrot-on-label{display:none}" +
      "html.brainrot-on .brainrot-toggle .brainrot-off{display:inline}" +
      "html.brainrot-on body{padding-left:var(--brainrot-split)!important}" +
      ".brainrot-panel{position:fixed;left:0;top:0;width:var(--brainrot-split);height:100vh;" +
        "z-index:55;background:#000;display:none}" +
      "html.brainrot-on .brainrot-panel{display:block}" +
      ".brainrot-panel iframe{width:100%;height:100%;border:0;display:block}" +
      // draggable divider, centred on the seam between the two sides
      ".brainrot-divider{position:fixed;top:0;height:100vh;width:16px;left:var(--brainrot-split);" +
        "transform:translateX(-50%);z-index:58;cursor:ew-resize;display:none;" +
        "align-items:center;justify-content:center;touch-action:none}" +
      "html.brainrot-on .brainrot-divider{display:flex}" +
      ".brainrot-divider::before{content:'';position:absolute;top:0;bottom:0;left:50%;" +
        "transform:translateX(-50%);width:3px;background:var(--am-accent,#4361ee)}" +
      ".brainrot-grip{position:relative;width:14px;height:46px;border-radius:7px;" +
        "background:var(--am-accent,#4361ee);box-shadow:0 2px 8px rgba(0,0,0,.35)}" +
      ".brainrot-grip::after{content:'';position:absolute;inset:0;margin:auto;width:4px;height:20px;" +
        "border-left:2px solid rgba(255,255,255,.85);border-right:2px solid rgba(255,255,255,.85)}" +
      ".brainrot-divider:hover .brainrot-grip,html.brainrot-dragging .brainrot-grip{" +
        "background:var(--am-accent-hover,#ff1b6b)}" +
      // while dragging: no transitions, no text selection, let pointer events pass the iframe
      "html.brainrot-dragging{cursor:ew-resize;-webkit-user-select:none;user-select:none}" +
      "html.brainrot-dragging .brainrot-toggle{transition:none}" +
      "html.brainrot-dragging .brainrot-panel iframe{pointer-events:none}" +
      "}" +
      "@media print{.brainrot-toggle,.brainrot-panel,.brainrot-divider{display:none!important}}";
    var el = document.createElement("style");
    el.id = "brainrot-style";
    el.textContent = css;
    document.head.appendChild(el);
  }

  // --- split proportion ---
  function clampSplit(v) { return Math.max(MIN_SPLIT, Math.min(MAX_SPLIT, v)); }
  function savedSplit() {
    try {
      var v = parseFloat(localStorage.getItem(SPLIT_KEY));
      return isNaN(v) ? DEFAULT_SPLIT : clampSplit(v);
    } catch (e) { return DEFAULT_SPLIT; }
  }
  function applySplit(pct) {
    document.documentElement.style.setProperty("--brainrot-split", pct + "vw");
  }
  function saveSplit(pct) {
    try { localStorage.setItem(SPLIT_KEY, String(Math.round(pct))); } catch (e) {}
  }

  var panel = null, divider = null;

  function ensurePanel() {
    if (panel) return panel;
    panel = document.createElement("div");
    panel.className = "brainrot-panel";
    var iframe = document.createElement("iframe");
    iframe.title = "Subway Surfers gameplay";
    iframe.allow = "autoplay; encrypted-media; picture-in-picture";
    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    iframe.src = "https://www.youtube-nocookie.com/embed/" + VIDEO_ID +
      "?autoplay=1&mute=1&controls=0&loop=1&playlist=" + VIDEO_ID +
      "&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3&disablekb=1&fs=0";
    panel.appendChild(iframe);
    document.body.appendChild(panel);
    return panel;
  }

  function ensureDivider() {
    if (divider) return divider;
    divider = document.createElement("div");
    divider.className = "brainrot-divider";
    divider.setAttribute("role", "separator");
    divider.setAttribute("aria-orientation", "vertical");
    divider.setAttribute("aria-label", "גרירה לשינוי היחס בין המשחק לאתר");
    divider.setAttribute("tabindex", "0");
    divider.innerHTML = '<span class="brainrot-grip"></span>';
    wireDrag(divider);
    document.body.appendChild(divider);
    return divider;
  }

  function wireDrag(el) {
    function move(e) {
      var pct = clampSplit(e.clientX / window.innerWidth * 100);
      applySplit(pct);
    }
    function up(e) {
      document.documentElement.classList.remove("brainrot-dragging");
      try { el.releasePointerCapture(e.pointerId); } catch (ex) {}
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      saveSplit(clampSplit(e.clientX / window.innerWidth * 100));
    }
    el.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      document.documentElement.classList.add("brainrot-dragging");
      try { el.setPointerCapture(e.pointerId); } catch (ex) {}
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
    });
    // keyboard: arrows nudge the divider by 2%
    el.addEventListener("keydown", function (e) {
      var cur = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--brainrot-split")) || DEFAULT_SPLIT;
      var step = e.key === "ArrowLeft" ? -2 : e.key === "ArrowRight" ? 2 : 0;
      if (!step) return;
      e.preventDefault();
      var pct = clampSplit(cur + step);
      applySplit(pct); saveSplit(pct);
    });
  }

  function save(on) {
    try { localStorage.setItem(STORAGE_KEY, on ? "1" : "0"); } catch (e) {}
  }
  function saved() {
    try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch (e) { return false; }
  }

  function setOn(on, persist) {
    if (on) {
      applySplit(savedSplit());
      ensurePanel();
      ensureDivider();
      document.documentElement.classList.add("brainrot-on");
    } else {
      document.documentElement.classList.remove("brainrot-on");
      if (panel) { panel.remove(); panel = null; }
      if (divider) { divider.remove(); divider = null; }
    }
    var btn = document.querySelector(".brainrot-toggle");
    if (btn) btn.setAttribute("aria-pressed", on ? "true" : "false");
    if (persist) save(on);
  }

  function build() {
    if (document.querySelector(".brainrot-toggle")) return;
    injectStyle();
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "brainrot-toggle";
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", "מצב ברנרוט - חצי מהמסך גיימפליי של Subway Surfers");
    btn.innerHTML = GAME_ICON +
      '<span class="brainrot-on-label">מצב ברנרוט</span>' +
      '<span class="brainrot-off">לכבות</span>';
    btn.addEventListener("click", function () {
      setOn(!document.documentElement.classList.contains("brainrot-on"), true);
    });
    document.body.appendChild(btn);
    if (saved() && desktop()) setOn(true, false);
  }

  // If the window shrinks below the desktop breakpoint while on, turn the split
  // off (without forgetting the preference) so narrow layouts aren't affected.
  try {
    window.matchMedia(DESKTOP).addEventListener("change", function (e) {
      if (!e.matches && document.documentElement.classList.contains("brainrot-on")) setOn(false, false);
      else if (e.matches && saved()) setOn(true, false);
    });
  } catch (e) {}

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  else build();
})();
