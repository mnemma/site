/* Hero knowledge-graph nebula. The cloud behind the headline is this site's own
   /brain/ graph: pages + claims from brain/index.json, edges included. Slow Y-rotation,
   masked + low-alpha so text contrast on paper is never compromised.
   Zero dependencies. Reduced-motion renders one static frame. Fails silent to a
   plain hero if the fetch or canvas is unavailable. */
(function () {
  var canvas = document.getElementById('hero-graph');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var INK = '26,26,23';        /* --ink */
  var ACCENT = '13,107,86';    /* --accent */
  var RED = '154,59,47';       /* --red (boundary pages only) */

  var nodes = [], edges = [];

  function seeded(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

  function build(graph) {
    var pages = (graph && graph.pages) || [];
    var rels = (graph && graph.edges) || [];
    var byId = {};
    pages.forEach(function (p, i) {
      var phi = Math.acos(1 - 2 * (i + 0.5) / pages.length);
      var theta = Math.PI * (1 + Math.sqrt(5)) * i;
      var r = 0.62 + seeded(i) * 0.18;
      var n = {
        x: r * Math.sin(phi) * Math.cos(theta), y: 0.72 * r * Math.cos(phi), z: r * Math.sin(phi) * Math.sin(theta),
        size: 2.6, color: p.type === 'boundary' ? RED : ACCENT, alpha: 0.85
      };
      byId[p.id || p.page || String(i)] = nodes.length; nodes.push(n);
      var claims = (p.claims && p.claims.length) || 4;
      for (var c = 0; c < Math.min(claims, 6); c++) {
        var j = i * 13 + c, rr = 0.10 + seeded(j) * 0.10;
        var a1 = seeded(j + 1) * Math.PI * 2, a2 = seeded(j + 2) * Math.PI;
        nodes.push({
          x: n.x + rr * Math.sin(a2) * Math.cos(a1), y: n.y + rr * Math.cos(a2) * 0.8, z: n.z + rr * Math.sin(a2) * Math.sin(a1),
          size: 1.1, color: INK, alpha: 0.5
        });
        edges.push([byId[p.id || p.page || String(i)], nodes.length - 1, 0.10]);
      }
    });
    rels.forEach(function (e) {
      var a = byId[e.from], b = byId[e.to];
      if (a !== undefined && b !== undefined) edges.push([a, b, 0.22]);
    });
  }

  function fallback() { /* synthetic cloud if index.json unavailable */
    for (var i = 0; i < 90; i++) {
      var phi = Math.acos(1 - 2 * (i + 0.5) / 90), theta = Math.PI * (1 + Math.sqrt(5)) * i;
      var r = 0.55 + seeded(i) * 0.3;
      nodes.push({ x: r * Math.sin(phi) * Math.cos(theta), y: 0.72 * r * Math.cos(phi), z: r * Math.sin(phi) * Math.sin(theta),
        size: i % 6 ? 1.1 : 2.4, color: i % 6 ? INK : ACCENT, alpha: i % 6 ? 0.5 : 0.85 });
      if (i > 1 && seeded(i + 7) > 0.45) edges.push([i, Math.floor(seeded(i + 3) * i), 0.14]);
    }
  }

  var W, H, DPR;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  var angle = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    var cx = W * 0.5, cy = H * 0.48, scale = Math.min(W, H) * 0.62;
    var cos = Math.cos(angle), sin = Math.sin(angle);
    var pts = nodes.map(function (n) {
      var x = n.x * cos - n.z * sin, z = n.x * sin + n.z * cos;
      var depth = 1 / (1.9 + z);
      return { sx: cx + x * scale * 1.35 * depth * 1.9, sy: cy + n.y * scale * depth * 1.9, d: depth, n: n };
    });
    edges.forEach(function (e) {
      var a = pts[e[0]], b = pts[e[1]];
      if (!a || !b) return;
      ctx.strokeStyle = 'rgba(' + INK + ',' + (e[2] * (a.d + b.d)) + ')';
      ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
    });
    pts.forEach(function (p) {
      ctx.fillStyle = 'rgba(' + p.n.color + ',' + (p.n.alpha * p.d * 1.6) + ')';
      ctx.beginPath(); ctx.arc(p.sx, p.sy, p.n.size * p.d * 1.7, 0, Math.PI * 2); ctx.fill();
    });
  }

  var raf;
  function loop() {
    if (!document.hidden) { angle += 0.00075; draw(); }  /* ~140s/rev */
    raf = requestAnimationFrame(loop);
  }

  function start() {
    resize(); draw();
    if (!reduced) { raf = requestAnimationFrame(loop); }
    window.addEventListener('resize', function () { resize(); draw(); });
  }

  fetch('brain/index.json').then(function (r) { return r.ok ? r.json() : null; })
    .then(function (g) { if (g && g.pages && g.pages.length) { build(g); } else { fallback(); } start(); })
    .catch(function () { fallback(); start(); });
})();
