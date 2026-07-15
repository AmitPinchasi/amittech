(function() {
  'use strict';

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

  function render(posts, container) {
    posts.forEach(function(post) {
      var a = document.createElement('a');
      a.className = 'blog-card';
      a.href = getBaseUrl() + post.url;

      var strong = document.createElement('strong');
      strong.textContent = post.title;
      a.appendChild(strong);

      if (post.description) {
        var p = document.createElement('p');
        p.textContent = post.description;
        a.appendChild(p);
      }

      container.appendChild(a);
    });
  }

  function init() {
    var container = document.getElementById('recent-blog-posts');
    if (!container) return;

    fetch(getBaseUrl() + 'assets/recent-posts.json')
      .then(function(res) { return res.ok ? res.json() : []; })
      .then(function(posts) { render(posts, container); })
      .catch(function() {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
