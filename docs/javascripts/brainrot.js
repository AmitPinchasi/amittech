/* "Brainrot mode" - a desktop-only toggle that splits the screen: a muted,
   looping Subway Surfers gameplay clip plays in a fixed panel down the left
   half (portrait gameplay suits a tall column), and the amittech site moves
   into the right half. A playful attention gimmick for the students, off by
   default and remembered per browser.

   Desktop only: the button and the whole split are gated behind a wide-screen +
   fine-pointer media query, so phones and tablets are never affected. The
   gameplay is a YouTube embed (same mechanism the lessons already use); swap
   VIDEO_ID below for a different clip. */
(function () {
  "use strict";

  // Subway Surfers gameplay, "No Copyright 4K (1 HOUR)". Swap for any YouTube id.
  var VIDEO_ID = "iKggOfcKM28";
  var STORAGE_KEY = "am-brainrot";
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
    var css =
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
      // game fills the LEFT half, so the site (and its button) move to the RIGHT half
      "html.brainrot-on .brainrot-toggle{left:calc(50vw + 16px);color:#fff;" +
        "background:var(--am-accent,#4361ee);border-color:var(--am-accent,#4361ee)}" +
      "html.brainrot-on .brainrot-toggle .brainrot-on-label{display:none}" +
      "html.brainrot-on .brainrot-toggle .brainrot-off{display:inline}" +
      "html.brainrot-on body{padding-left:50vw!important}" +
      ".brainrot-panel{position:fixed;left:0;top:0;width:50vw;height:100vh;z-index:55;" +
        "background:#000;border-right:3px solid var(--am-accent,#4361ee);display:none}" +
      "html.brainrot-on .brainrot-panel{display:block}" +
      ".brainrot-panel iframe{width:100%;height:100%;border:0;display:block}" +
      "}" +
      "@media print{.brainrot-toggle,.brainrot-panel{display:none!important}}";
    var el = document.createElement("style");
    el.id = "brainrot-style";
    el.textContent = css;
    document.head.appendChild(el);
  }

  var panel = null;

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

  function save(on) {
    try { localStorage.setItem(STORAGE_KEY, on ? "1" : "0"); } catch (e) {}
  }
  function saved() {
    try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch (e) { return false; }
  }

  function setOn(on, persist) {
    if (on) { ensurePanel(); document.documentElement.classList.add("brainrot-on"); }
    else { document.documentElement.classList.remove("brainrot-on"); if (panel) panel.remove(); panel = null; }
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
