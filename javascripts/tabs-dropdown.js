(function() {
  'use strict';

  var activeDropdown = null;
  var categoriesPromise = null;

  function getBaseUrl() {
    var homeLink = document.querySelector('.md-tabs__list .md-tabs__item:first-child .md-tabs__link');
    if (homeLink) {
      var url = homeLink.getAttribute('href');
      if (url === '.') url = './';
      if (url.charAt(url.length - 1) !== '/') url += '/';
      return url;
    }
    return '/';
  }

  /* navigation.prune (mkdocs.yml) strips the sidebar down to the current
     page's branch, so the category/course tree can no longer be scraped
     from the DOM. hooks/build_nav_categories.py writes the full tree once
     at build time instead. */
  function fetchCategories() {
    if (!categoriesPromise) {
      categoriesPromise = fetch(getBaseUrl() + 'assets/nav-categories.json')
        .then(function(res) { return res.ok ? res.json() : {}; })
        .catch(function() { return {}; });
    }
    return categoriesPromise;
  }

  function hideDropdown() {
    if (activeDropdown) {
      activeDropdown.style.display = 'none';
      activeDropdown = null;
    }
  }

  function showDropdown(dropdown, tabEl) {
    hideDropdown();
    var rect = tabEl.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.top = rect.bottom + 'px';
    dropdown.style.right = (window.innerWidth - rect.right) + 'px';
    dropdown.style.left = '';
    dropdown.style.display = 'flex';
    activeDropdown = dropdown;
  }

  function buildDropdowns(categories) {
    var tabsList = document.querySelector('.md-tabs__list');
    if (!tabsList) return false;

    var baseUrl = getBaseUrl();

    var tabs = tabsList.querySelectorAll('.md-tabs__item');
    if (tabs.length === 0 || Object.keys(categories).length === 0) return false;

    var matched = 0;

    tabs.forEach(function(tab) {
      if (tab.getAttribute('data-dropdown-init')) return;

      var link = tab.querySelector('.md-tabs__link');
      if (!link) return;

      var text = link.textContent.replace(/\s+/g, ' ').trim();
      var courses = categories[text];
      if (!courses) return;

      matched++;
      tab.setAttribute('data-dropdown-init', 'true');

      var dropdown = document.createElement('div');
      dropdown.className = 'tabs-dropdown';
      dropdown.style.display = 'none';

      courses.forEach(function(course) {
        var a = document.createElement('a');
        /* course.href is site-root-relative without a leading slash, so it
           must be resolved against the site base, not the current page */
        a.href = baseUrl + course.href;
        a.className = 'tabs-dropdown-item';
        a.textContent = course.name;
        dropdown.appendChild(a);
      });

      document.body.appendChild(dropdown);

      link.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (activeDropdown === dropdown) {
          hideDropdown();
        } else {
          showDropdown(dropdown, tab);
        }
      });

      tab.addEventListener('mouseenter', function() {
        showDropdown(dropdown, tab);
      });

      tab.addEventListener('mouseleave', function(e) {
        var related = e.relatedTarget;
        if (related && dropdown.contains(related)) return;
        setTimeout(function() {
          if (activeDropdown === dropdown && !tab.matches(':hover') && !dropdown.matches(':hover')) {
            hideDropdown();
          }
        }, 100);
      });

      dropdown.addEventListener('mouseleave', function(e) {
        var related = e.relatedTarget;
        if (related && tab.contains(related)) return;
        hideDropdown();
      });
    });

    return matched > 0;
  }

  document.addEventListener('click', function(e) {
    if (activeDropdown && !activeDropdown.contains(e.target) && !e.target.closest('.md-tabs__item[data-dropdown-init]')) {
      hideDropdown();
    }
  });

  function tryInit(attempts) {
    if (!document.querySelector('.md-tabs__list')) {
      if (attempts > 0) setTimeout(function() { tryInit(attempts - 1); }, 300);
      return;
    }
    fetchCategories().then(buildDropdowns);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { tryInit(20); });
  } else {
    tryInit(20);
  }
})();
