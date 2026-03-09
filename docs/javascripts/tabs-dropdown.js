(function() {
  'use strict';

  var activeDropdown = null;

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

  function extractCategoriesFromNav() {
    var primaryNav = document.querySelector('.md-sidebar--primary .md-nav--primary');
    if (!primaryNav) return {};

    var categories = {};
    var level1Navs = primaryNav.querySelectorAll(':scope > .md-nav__list > .md-nav__item--nested');

    level1Navs.forEach(function(item) {
      var titleEl = item.querySelector(':scope > .md-nav > .md-nav__title');
      if (!titleEl) return;
      var categoryName = titleEl.textContent.replace(/\s+/g, ' ').trim();
      if (!categoryName) return;

      var courses = [];
      var level2Items = item.querySelectorAll(':scope > .md-nav > .md-nav__list > .md-nav__item--nested');

      level2Items.forEach(function(courseItem) {
        var courseLink = courseItem.querySelector(':scope > .md-nav__container > a.md-nav__link');
        if (!courseLink) return;

        var courseName = courseLink.textContent.replace(/\s+/g, ' ').trim();
        var courseHref = courseLink.getAttribute('href');
        if (courseName && courseHref) {
          courses.push({ name: courseName, href: courseHref });
        }
      });

      if (courses.length > 0) {
        categories[categoryName] = courses;
      }
    });

    return categories;
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

  function initDropdowns() {
    var tabsList = document.querySelector('.md-tabs__list');
    if (!tabsList) return false;

    var tabs = tabsList.querySelectorAll('.md-tabs__item');
    if (tabs.length === 0) return false;

    var categories = extractCategoriesFromNav();
    if (Object.keys(categories).length === 0) return false;

    var baseUrl = getBaseUrl();
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
        a.href = course.href;
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
    if (attempts <= 0) return;
    if (!initDropdowns()) {
      setTimeout(function() { tryInit(attempts - 1); }, 300);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { tryInit(20); });
  } else {
    tryInit(20);
  }
})();
