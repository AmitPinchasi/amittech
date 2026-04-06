(function() {
  'use strict';

  var STORAGE_KEY = 'amittech_completed';

  // --- Storage ---
  function getCompleted() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch(e) { return {}; }
  }

  function saveCompleted(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  // --- Path helpers ---
  function norm(p) { return (p || '').replace(/\/$/, '') || '/'; }
  function curPath() { return norm(window.location.pathname); }

  function pathParts(p) {
    var arr = norm(p).split('/').filter(Boolean);
    if (arr[0] === 'amittech') arr.shift();
    return arr;
  }

  function isMaterial(p) { return pathParts(p).length >= 2; }
  function isInCourse() { return pathParts(curPath()).length >= 1 && curPath() !== norm('/amittech') && curPath() !== '/'; }
  function isCourseIndex() { return pathParts(curPath()).length === 1; }
  function getCourse(p) { return pathParts(p)[0] || ''; }
  function getSection(p) { var pp = pathParts(p); return pp.length >= 2 ? pp[0] + '/' + pp[1] : ''; }

  // --- Collect material pages from sidebar nav, filtered to current course ---
  function navPages() {
    var crs = getCourse(curPath());
    var pages = [], seen = {};
    document.querySelectorAll('.md-sidebar--primary a.md-nav__link[href]').forEach(function(a) {
      var href = a.getAttribute('href');
      if (!href || href[0] === '#' || /^https?:/.test(href)) return;
      try {
        var p = norm(new URL(href, location.href).pathname);
        if (isMaterial(p) && getCourse(p) === crs && !seen[p]) { seen[p] = 1; pages.push(p); }
      } catch(e) {}
    });
    return pages;
  }

  // --- Complete Button ---
  function addButton() {
    if (!isMaterial(curPath()) || document.querySelector('.complete-btn-container')) return;

    var path = curPath();
    var done = !!getCompleted()[path];
    var pages = navPages();
    var idx = pages.indexOf(path);
    var prevPage = idx > 0 ? pages[idx - 1] : null;
    var nextPage = idx >= 0 && idx < pages.length - 1 ? pages[idx + 1] : null;

    var wrap = document.createElement('div');
    wrap.className = 'complete-btn-container';

    // Previous button (appears on the right in RTL)
    var prevBtn = document.createElement('a');
    prevBtn.className = 'nav-btn' + (prevPage ? '' : ' nav-btn-disabled');
    prevBtn.dir = 'rtl';
    prevBtn.innerHTML = '\u05d4\u05e7\u05d5\u05d3\u05dd \u203a';
    if (prevPage) prevBtn.href = prevPage;

    var btn = document.createElement('button');
    btn.className = 'complete-btn' + (done ? ' completed' : '');
    btn.dir = 'rtl';
    setLabel(btn, done);

    btn.onclick = function() {
      var c = getCompleted(), d = !c[path];
      if (d) c[path] = true; else delete c[path];
      saveCompleted(c);
      btn.className = 'complete-btn' + (d ? ' completed' : '');
      setLabel(btn, d);
      refreshProgress();
      markNav();
      if (d) checkCelebrate(c);
    };

    // Next button (appears on the left in RTL)
    var nextBtn = document.createElement('a');
    nextBtn.className = 'nav-btn' + (nextPage ? '' : ' nav-btn-disabled');
    nextBtn.dir = 'rtl';
    nextBtn.innerHTML = '\u2039 \u05d4\u05d1\u05d0';
    if (nextPage) nextBtn.href = nextPage;

    wrap.appendChild(prevBtn);
    wrap.appendChild(btn);
    wrap.appendChild(nextBtn);
    var el = document.querySelector('.md-content__inner');
    if (el) el.appendChild(wrap);
  }

  function setLabel(btn, done) {
    if (done) {
      btn.innerHTML = '<span class="complete-check">\u2713</span> \u05d4\u05d5\u05e9\u05dc\u05dd';
    } else {
      btn.textContent = '\u05e1\u05de\u05df \u05db\u05d4\u05d5\u05e9\u05dc\u05dd';
    }
  }

  // --- Course Progress Bar ---
  function addProgressBar() {
    if (!isCourseIndex() || document.querySelector('.course-progress')) return;

    var pages = navPages();
    if (pages.length === 0) return;

    var el = document.createElement('div');
    el.className = 'course-progress';
    el.dir = 'rtl';
    el.innerHTML =
      '<div class="course-progress-header">' +
        '<span class="course-progress-text"></span>' +
        '<span class="course-progress-pct"></span>' +
      '</div>' +
      '<div class="course-progress-track"><div class="course-progress-fill"></div></div>';

    var content = document.querySelector('.md-content__inner');
    if (content) {
      var h1 = content.querySelector('h1');
      var target = h1 ? h1.nextSibling : content.firstChild;
      content.insertBefore(el, target);
    }

    refreshProgress();
  }

  function refreshProgress() {
    var el = document.querySelector('.course-progress');
    if (!el) return;

    var pages = navPages();
    var completed = getCompleted();
    var done = pages.filter(function(p) { return !!completed[p]; }).length;
    var total = pages.length;
    var pct = total > 0 ? Math.round(done / total * 100) : 0;

    el.querySelector('.course-progress-text').textContent = done + ' / ' + total;
    el.querySelector('.course-progress-pct').textContent = pct + '%';
    el.querySelector('.course-progress-fill').style.width = pct + '%';
  }

  // --- Nav Checkmarks ---
  function markNav() {
    var completed = getCompleted();

    // Mark individual material links
    document.querySelectorAll('.md-sidebar--primary a.md-nav__link[href]').forEach(function(a) {
      var href = a.getAttribute('href');
      if (!href || href[0] === '#' || /^https?:/.test(href)) return;
      try {
        var p = norm(new URL(href, location.href).pathname);
        a.classList.toggle('nav-completed', !!completed[p]);
      } catch(e) {}
    });

    // Mark parent items (topics/sections) when all children are completed
    var nestedItems = document.querySelectorAll('.md-sidebar--primary .md-nav__item--nested');
    nestedItems.forEach(function(item) {
      var childLinks = item.querySelectorAll('a.md-nav__link[href]');
      var pages = [];
      childLinks.forEach(function(a) {
        var href = a.getAttribute('href');
        if (!href || href[0] === '#' || /^https?:/.test(href)) return;
        try {
          var p = norm(new URL(href, location.href).pathname);
          if (isMaterial(p)) pages.push(p);
        } catch(e) {}
      });
      if (pages.length === 0) return;
      var allDone = pages.every(function(p) { return !!completed[p]; });
      var label = item.querySelector(':scope > .md-nav__link') || item.querySelector(':scope > label.md-nav__link');
      if (label) label.classList.toggle('nav-section-completed', allDone);
    });
  }

  // --- Celebration ---
  function checkCelebrate(completed) {
    var p = curPath(), all = navPages();
    var sec = getSection(p), crs = getCourse(p);

    var sp = all.filter(function(x) { return getSection(x) === sec; });
    var cp = all.filter(function(x) { return getCourse(x) === crs; });

    var courseOk = cp.length > 0 && cp.every(function(x) { return !!completed[x]; });
    var secOk = sp.length > 0 && sp.every(function(x) { return !!completed[x]; });

    if (courseOk) fire('course');
    else if (secOk) fire('section');
  }

  function fire(level) {
    if (typeof confetti !== 'function') return;

    if (level === 'course') {
      var end = Date.now() + 5000;
      (function f() {
        confetti({ particleCount: 7, angle: 60, spread: 80, origin: { x: 0, y: 0.7 } });
        confetti({ particleCount: 7, angle: 120, spread: 80, origin: { x: 1, y: 0.7 } });
        if (Date.now() < end) requestAnimationFrame(f);
      })();
      toast('\u05db\u05dc \u05d4\u05db\u05d1\u05d5\u05d3! \u05e1\u05d9\u05d9\u05de\u05ea \u05d0\u05ea \u05d4\u05e7\u05d5\u05e8\u05e1!');
    } else {
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.7 } });
      toast('\u05db\u05dc \u05d4\u05db\u05d1\u05d5\u05d3! \u05e1\u05d9\u05d9\u05de\u05ea \u05d0\u05ea \u05d4\u05e4\u05e8\u05e7!');
    }
  }

  function toast(text) {
    var el = document.createElement('div');
    el.className = 'celebrate-toast';
    el.dir = 'rtl';
    el.textContent = text;
    document.body.appendChild(el);
    requestAnimationFrame(function() { el.classList.add('show'); });
    setTimeout(function() {
      el.classList.remove('show');
      setTimeout(function() { el.remove(); }, 500);
    }, 3500);
  }

  // --- Init ---
  function init() {
    addButton();
    addProgressBar();
    markNav();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
