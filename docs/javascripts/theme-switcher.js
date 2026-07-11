/* Theme switcher: builds a header dropdown of named themes, persists the
   choice to localStorage, and applies it to <html>. The matching palettes
   live in stylesheets/themes.css; the early-apply (anti-FOUC) snippet lives
   in overrides/main.html. Keep the theme ids here in sync with both. */
(function () {
  "use strict";

  var STORAGE_KEY = "am-theme";
  var DEFAULT_THEME = "light";

  // id, label (Hebrew), base Material scheme, and swatch gradient colours.
  var THEMES = [
    { id: "light",          label: "בהיר",        scheme: "default", sw: ["#ff1b6b", "#a855f7", "#45caff"] },
    { id: "light-violet",   label: "בהיר סגול",   scheme: "default", sw: ["#7c3aed", "#a855f7", "#c4b5fd"] },
    { id: "light-rose",     label: "בהיר ורוד",   scheme: "default", sw: ["#e11d48", "#db2777", "#fb7185"] },
    { id: "light-ocean",    label: "בהיר טורקיז", scheme: "default", sw: ["#0891b2", "#22d3ee", "#7dd3fc"] },

    { id: "midnight",       label: "חצות",        scheme: "slate", sw: ["#db2777", "#7c3aed", "#3b82f6"] },
    { id: "dracula",        label: "Dracula",     scheme: "slate", sw: ["#ff79c6", "#bd93f9", "#8be9fd"] },
    { id: "nord",           label: "Nord",        scheme: "slate", sw: ["#b48ead", "#5e81ac", "#88c0d0"] },
    { id: "gruvbox",        label: "Gruvbox",     scheme: "slate", sw: ["#fb4934", "#d3869b", "#fabd2f"] },
    { id: "solarized-dark", label: "Solarized",   scheme: "slate", sw: ["#d33682", "#6c71c4", "#268bd2"] },
    { id: "matrix",         label: "Matrix",      scheme: "slate", sw: ["#00cc33", "#00ff41", "#66ff66"] },
    { id: "amber",          label: "ענבר",        scheme: "slate", sw: ["#cc7000", "#ff9500", "#ffc300"] },
    { id: "synthwave",      label: "Synthwave",   scheme: "slate", sw: ["#ff2e97", "#b829e0", "#05d9e8"] },
    { id: "ocean",          label: "אוקיינוס",    scheme: "slate", sw: ["#06b6d4", "#3b82f6", "#22d3ee"] },
    { id: "emerald",        label: "ברקת",        scheme: "slate", sw: ["#10b981", "#059669", "#34d399"] },
    { id: "rose",           label: "ורד",         scheme: "slate", sw: ["#f43f5e", "#db2777", "#fb7185"] },
    { id: "violet",         label: "סגול",        scheme: "slate", sw: ["#8b5cf6", "#6d28d9", "#a78bfa"] }
  ];

  var GROUPS = [
    { label: "בהיר", scheme: "default" },
    { label: "כהה", scheme: "slate" }
  ];

  function byId(id) {
    for (var i = 0; i < THEMES.length; i++) {
      if (THEMES[i].id === id) return THEMES[i];
    }
    return null;
  }

  function getSaved() {
    var id;
    try { id = localStorage.getItem(STORAGE_KEY); } catch (e) { id = null; }
    return byId(id) ? id : DEFAULT_THEME;
  }

  function apply(id) {
    var t = byId(id) || byId(DEFAULT_THEME);
    var root = document.documentElement;
    root.setAttribute("data-theme", t.id);
    root.setAttribute("data-md-color-scheme", t.scheme);
    try { localStorage.setItem(STORAGE_KEY, t.id); } catch (e) {}
  }

  var PALETTE_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<circle cx="13.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"></circle>' +
    '<circle cx="17.5" cy="10.5" r="1.5" fill="currentColor" stroke="none"></circle>' +
    '<circle cx="8.5" cy="7.5" r="1.5" fill="currentColor" stroke="none"></circle>' +
    '<circle cx="6.5" cy="12.5" r="1.5" fill="currentColor" stroke="none"></circle>' +
    '<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 ' +
    '0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.09a1.64 1.64 0 0 1 ' +
    '1.668-1.668h1.996C19.51 15.441 22 12.951 22 9.875 22 5.55 17.5 2 12 2z"></path>' +
    "</svg>";

  var CHECK_ICON =
    '<svg class="am-theme-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<polyline points="20 6 9 17 4 12"></polyline></svg>';

  function build() {
    var header = document.querySelector(".md-header__inner");
    if (!header || document.querySelector(".am-theme")) return;

    var current = getSaved();

    var wrap = document.createElement("div");
    wrap.className = "am-theme";

    var btn = document.createElement("button");
    btn.className = "am-theme-btn";
    btn.type = "button";
    btn.setAttribute("aria-label", "בחירת ערכת נושא");
    btn.setAttribute("aria-haspopup", "true");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = PALETTE_ICON;

    var panel = document.createElement("div");
    panel.className = "am-theme-panel";
    panel.setAttribute("role", "menu");

    var title = document.createElement("div");
    title.className = "am-theme-panel-title";
    title.textContent = "בחירת ערכת נושא";
    panel.appendChild(title);

    GROUPS.forEach(function (group) {
      var gl = document.createElement("div");
      gl.className = "am-theme-group-label";
      gl.textContent = group.label;
      panel.appendChild(gl);

      THEMES.filter(function (t) { return t.scheme === group.scheme; }).forEach(function (t) {
        var opt = document.createElement("button");
        opt.className = "am-theme-opt";
        opt.type = "button";
        opt.setAttribute("role", "menuitemradio");
        opt.setAttribute("data-theme-id", t.id);
        opt.setAttribute("aria-checked", t.id === current ? "true" : "false");

        var sw = document.createElement("span");
        sw.className = "am-theme-sw";
        sw.style.background = "linear-gradient(135deg, " + t.sw[0] + ", " + t.sw[1] + ", " + t.sw[2] + ")";

        var name = document.createElement("span");
        name.className = "am-theme-name";
        name.textContent = t.label;

        opt.appendChild(sw);
        opt.appendChild(name);
        opt.insertAdjacentHTML("beforeend", CHECK_ICON);

        opt.addEventListener("click", function () {
          apply(t.id);
          panel.querySelectorAll(".am-theme-opt").forEach(function (o) {
            o.setAttribute("aria-checked", o === opt ? "true" : "false");
          });
          close();
        });

        panel.appendChild(opt);
      });
    });

    wrap.appendChild(btn);
    wrap.appendChild(panel);
    header.appendChild(wrap);

    function open() {
      wrap.classList.add("open");
      btn.setAttribute("aria-expanded", "true");
      document.addEventListener("click", onOutside, true);
      document.addEventListener("keydown", onKey);
    }
    function close() {
      wrap.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
      document.removeEventListener("click", onOutside, true);
      document.removeEventListener("keydown", onKey);
    }
    function onOutside(e) {
      if (!wrap.contains(e.target)) close();
    }
    function onKey(e) {
      if (e.key === "Escape") { close(); btn.focus(); }
    }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (wrap.classList.contains("open")) close(); else open();
    });
  }

  // Ensure the stored theme is applied (matches the anti-FOUC head script).
  apply(getSaved());

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
