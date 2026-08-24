/* The one permitted moment of motion: a receipt unfolding.
   Every receipt marker on the site — including on our own marketing claims —
   toggles its receipt panel. One component, used everywhere.
   Receipt component (v1).*/
(function () {
  function closeAll(except) {
    document.querySelectorAll('.receipt.open').forEach(function (r) {
      if (r !== except) {
        r.classList.remove('open');
        var m = r.previousElementSibling;
        if (m && m.classList.contains('receipt-marker')) m.setAttribute('aria-expanded', 'false');
      }
    });
  }
  document.addEventListener('click', function (e) {
    var marker = e.target.closest('.receipt-marker');
    if (marker) {
      var panel = marker.nextElementSibling;
      if (!panel || !panel.classList.contains('receipt')) return;
      var isOpen = panel.classList.contains('open');
      closeAll(panel);
      panel.classList.toggle('open', !isOpen);
      marker.setAttribute('aria-expanded', String(!isOpen));
      e.preventDefault();
      return;
    }
    if (!e.target.closest('.receipt')) closeAll(null);
  });
})();
