/* טעינה עצלה של אינדקס החיפוש - lazy search index

   ערכת Material מורידה את search/search_index.json ובונה ממנו אינדקס lunr
   בכל טעינת עמוד, עוד לפני שהמשתמש נגע בתיבת החיפוש. באתר בגודל הזה
   (מעל 2700 עמודים, כ-28 אלף רשומות באינדקס) הבנייה הזו תופסת קרוב
   לגיגהבייט זיכרון, ובמכשירים עם מעט זיכרון הלשונית נסגרת אחרי כדקה.

   הקובץ הזה דוחה את הבקשה הזו בלבד עד לרגע שבו המשתמש באמת פותח את
   החיפוש. Material מבקש את האינדקס דרך XMLHttpRequest, ולכן מספיק
   לעכב את send() של אותה בקשה - שאר הזרימה בערכה ממתינה כרגיל.

   הקובץ חייב לרוץ לפני ה-bundle של Material, ולכן הוא נטען מ-overrides/main.html
   בתוך <head> ולא דרך extra_javascript (שנטען בסוף ה-body). */
(function () {
  "use strict";

  var INDEX_RE = /search_index\.json(\?|$)/;

  var origOpen = XMLHttpRequest.prototype.open;
  var origSend = XMLHttpRequest.prototype.send;

  var held = [];
  var released = false;

  XMLHttpRequest.prototype.open = function (method, url) {
    try { this.__amSearchIndex = INDEX_RE.test(String(url)); } catch (e) {}
    return origOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function () {
    if (this.__amSearchIndex && !released) {
      var xhr = this, args = arguments;
      held.push(function () { origSend.apply(xhr, args); });
      return;
    }
    return origSend.apply(this, arguments);
  };

  function release() {
    if (released) return;
    released = true;

    XMLHttpRequest.prototype.open = origOpen;
    XMLHttpRequest.prototype.send = origSend;

    var queued = held;
    held = [];
    queued.forEach(function (send) {
      try { send(); } catch (e) {}
    });
  }

  /* הרכיבים של החיפוש לא קיימים עדיין כשהסקריפט רץ ב-head, ולכן ההאזנה
     היא על document עם capture. */
  function inSearch(el) {
    return el && el.closest && el.closest('.md-search, label[for="__search"]');
  }

  document.addEventListener("focusin", function (e) {
    if (inSearch(e.target)) release();
  }, true);

  document.addEventListener("click", function (e) {
    if (inSearch(e.target)) release();
  }, true);

  document.addEventListener("change", function (e) {
    if (e.target && e.target.id === "__search" && e.target.checked) release();
  }, true);

  /* קיצורי המקלדת של Material לפתיחת חיפוש */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "f" && e.key !== "s" && e.key !== "/") return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target;
    if (!t) return;
    var tag = t.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || t.isContentEditable) return;
    release();
  }, true);
})();
