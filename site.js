/* Shared chrome is static in each page so crawlers see nav and footer
   without executing JS. This file only: mobile toggle + home #cxo redirect. */
(function () {
  var page = document.body.getAttribute('data-page') || '';
  var root = document.body.getAttribute('data-root') || (page === 'brain' ? '../' : '');

  function href(path) { return root + path; }

  var nav = document.querySelector('nav.nav');
  var toggle = document.querySelector('.nav-toggle');
  if (nav && toggle) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  if (page === 'home' && location.hash === '#cxo') {
    location.replace(href('for-your-team.html') + '#cxo');
  }
})();
