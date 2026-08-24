/* reveal.js — MEDIA_PACKAGE_V4 §2. Vanilla. MEDIA_PACKAGE_V4 §2. Canonical media-pass.
   IntersectionObserver adds .in to [data-reveal].
   Nothing moves twice. Nothing moves on scroll-out.
   prefers-reduced-motion → everything visible immediately, no transforms.
   Stagger via --reveal-delay: 0.2 / 0.35 / 0.5 on siblings. */
(function () {
  window.__revealRan = true;
  var nodes = document.querySelectorAll("[data-reveal]");
  if (!nodes.length) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    nodes.forEach(function (el) { el.classList.add("in"); });
    return;
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );

  nodes.forEach(function (el) { io.observe(el); });
})();
