/* Mnemma pricing chart — "the band is flat".
   Renders the size→price picture on pricing.html from the same published
   formula the assessment uses (estimator.js). No second source of numbers:
   route boundaries are probed from estimate(); dollar figures are the
   canonical Standard bands receipted at /brain/pricing-mechanics#claim-standard-bands.
   Pure SVG + one HTML tooltip. No network. */

import { estimate } from './estimator.js';

// Canonical Standard bands (receipt: /brain/pricing-mechanics#claim-standard-bands).
// Deliberate second copy of quote()'s Standard amounts — quote() returns formatted
// strings, not numbers. If the bands change, update estimator.quote() AND these two.
var CASH_AT_ORDER = 42000;
var YEAR_ONE = 78000;

var DEFAULTS = {
  gmail: true, drive: true, calendar: false, github: false,
  extras: false, workspace: true, filter: true, paper: false
};

function probe(kw, years) {
  return estimate(Object.assign({ kw: kw, years: years }, DEFAULTS));
}

// Probe the formula for the route thresholds instead of restating them.
export function thresholds() {
  var minKw = 1, gfMax = 0;
  for (var k = 1; k <= 200; k++) {
    var withHistory = probe(k, 5).route;
    var brandNew = probe(k, 0).route;
    if (withHistory === 'reject') minKw = k + 1;
    if (brandNew === 'gf') gfMax = k;
  }
  return { minKw: minKw, gfMax: gfMax };
}

export function render(container) {
  var t = thresholds();
  var W = 960, H = 400;
  var M = { l: 78, r: 210, t: 34, b: 76 };
  var pw = W - M.l - M.r, ph = H - M.t - M.b;
  var X_MAX = 160, Y_MAX = 90000;
  var x = function (kw) { return M.l + (kw / X_MAX) * pw; };
  var y = function (usd) { return M.t + ph - (usd / Y_MAX) * ph; };
  var NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs, text) {
    var n = document.createElementNS(NS, name);
    for (var a in attrs) n.setAttribute(a, attrs[a]);
    if (text != null) n.textContent = text;
    return n;
  }

  var svg = el('svg', {
    viewBox: '0 0 ' + W + ' ' + H,
    role: 'img',
    'aria-label': 'Chart: year-one planning band by team size. From ' + t.minKw +
      ' knowledge workers up, the worked Standard band is about $42,000 cash at order and about $78,000 year one; the assessment prints the band for your numbers. Under ' + t.minKw + ' is a waitlist. Between ' +
      t.minKw + ' and ' + t.gfMax + ' knowledge workers, a brand-new company may fit the Greenfield design-partner path; its bands print on the assessment.'
  });
  svg.style.width = '100%';
  svg.style.height = 'auto';
  svg.style.display = 'block';
  svg.style.fontFamily = 'var(--sans)';

  // Gridlines + y ticks (hairline, recessive)
  [0, 30000, 60000, 90000].forEach(function (v) {
    svg.appendChild(el('line', { x1: M.l, y1: y(v), x2: W - M.r, y2: y(v), stroke: 'var(--rule-soft)', 'stroke-width': 1 }));
    svg.appendChild(el('text', { x: M.l - 10, y: y(v) + 4, 'text-anchor': 'end', 'font-size': 12, fill: 'var(--muted)' }, v === 0 ? '$0' : '$' + (v / 1000) + 'k'));
  });

  // Waitlist zone (de-emphasis wash + direct label — identity by label, not color)
  svg.appendChild(el('rect', { x: x(0), y: M.t, width: x(t.minKw) - x(0), height: ph, fill: 'var(--rule-soft)', opacity: 0.55 }));
  svg.appendChild(el('text', { x: (x(0) + x(t.minKw)) / 2, y: M.t + 18, 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--muted)' }, 'under ' + t.minKw));
  svg.appendChild(el('text', { x: (x(0) + x(t.minKw)) / 2, y: M.t + 33, 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--muted)' }, 'waitlist'));

  // The two flat Standard lines (one entity, accent hue; end-labeled, end-dotted)
  [{ v: YEAR_ONE, label: 'Year one all-in · ~$78,000' },
   { v: CASH_AT_ORDER, label: 'Cash at order · ~$42,000' }].forEach(function (s) {
    svg.appendChild(el('line', { x1: x(t.minKw), y1: y(s.v), x2: x(X_MAX), y2: y(s.v), stroke: 'var(--accent)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
    svg.appendChild(el('circle', { cx: x(X_MAX), cy: y(s.v), r: 4.5, fill: 'var(--accent)', stroke: 'var(--paper)', 'stroke-width': 2 }));
    svg.appendChild(el('text', { x: x(X_MAX) + 10, y: y(s.v) + 4, 'font-size': 12.5, fill: 'var(--ink-soft)' }, s.label));
  });

  // The story, said once, on the plot
  svg.appendChild(el('text', { x: x((t.minKw + X_MAX) / 2), y: y(YEAR_ONE) - 30, 'text-anchor': 'middle', 'font-size': 13.5, fill: 'var(--ink-soft)' }, 'Worked mid-market band — the assessment prints yours.'));
  svg.appendChild(el('text', { x: x((t.minKw + X_MAX) / 2), y: y(YEAR_ONE) - 12, 'text-anchor': 'middle', 'font-size': 13.5, fill: 'var(--muted)' }, 'A purchase you own — not a per-seat rent.'));

  // x axis + ticks
  svg.appendChild(el('line', { x1: M.l, y1: M.t + ph, x2: W - M.r, y2: M.t + ph, stroke: 'var(--rule)', 'stroke-width': 1 }));
  [0, t.minKw, t.gfMax, 100, 150].forEach(function (k) {
    svg.appendChild(el('text', { x: x(k), y: M.t + ph + 18, 'text-anchor': 'middle', 'font-size': 12, fill: 'var(--muted)' }, k === 150 ? '150+' : String(k)));
  });
  svg.appendChild(el('text', { x: M.l + pw / 2, y: H - 6, 'text-anchor': 'middle', 'font-size': 12, fill: 'var(--muted)' }, 'knowledge workers — people whose work is documents, email, and decisions'));

  // Greenfield window bracket (no dollars here by policy — bands print on the assessment)
  var by = M.t + ph + 30;
  svg.appendChild(el('path', { d: 'M ' + x(t.minKw) + ' ' + by + ' v 5 H ' + x(t.gfMax) + ' v -5', fill: 'none', stroke: 'var(--accent)', 'stroke-width': 1.5 }));
  svg.appendChild(el('text', { x: (x(t.minKw) + x(t.gfMax)) / 2, y: by + 19, 'text-anchor': 'middle', 'font-size': 11.5, fill: 'var(--accent-ink)' }, 'brand-new company? Greenfield window — see below'));

  // Hover layer: crosshair + tooltip, route text probed live from the formula
  var cross = el('line', { y1: M.t, y2: M.t + ph, stroke: 'var(--rule)', 'stroke-width': 1, opacity: 0 });
  svg.appendChild(cross);
  var hit = el('rect', { x: M.l, y: M.t, width: pw, height: ph, fill: 'transparent' });
  svg.appendChild(hit);

  var tip = document.createElement('div');
  tip.className = 'chart-tip';
  tip.setAttribute('hidden', '');
  container.appendChild(tip);

  function moveTip(evt) {
    var rect = svg.getBoundingClientRect();
    var px = (evt.clientX - rect.left) * (W / rect.width);
    var kw = Math.round(Math.min(X_MAX, Math.max(0, (px - M.l) / pw * X_MAX)));
    cross.setAttribute('x1', x(kw)); cross.setAttribute('x2', x(kw));
    cross.setAttribute('opacity', 1);
    var r = probe(kw, 5);
    var html;
    if (r.route === 'reject') {
      html = '<strong>' + kw + ' knowledge workers</strong><br>' + r.title + ' We can add you to the waitlist.';
    } else {
      html = '<strong>' + kw + ' knowledge workers — Standard install</strong><br>Worked mid-market band: ~$42,000 cash at order · ~$78,000 year one. The assessment prints the band for your numbers.';
      if (probe(kw, 0).route === 'gf') {
        html += '<br><span class="tip-gf">Brand-new company? The Greenfield design-partner window may fit — bands print on the assessment.</span>';
      }
    }
    tip.innerHTML = html;
    tip.removeAttribute('hidden');
    var cw = container.getBoundingClientRect();
    var left = evt.clientX - cw.left + 14;
    if (left > cw.width - 290) left = cw.width - 290;
    tip.style.left = left + 'px';
    tip.style.top = (evt.clientY - cw.top + 16) + 'px';
  }
  function hideTip() { tip.setAttribute('hidden', ''); cross.setAttribute('opacity', 0); }
  // Pointer events cover mouse hover AND touch taps/drags (Dev audit fix).
  hit.addEventListener('pointermove', moveTip);
  hit.addEventListener('pointerdown', moveTip);
  hit.addEventListener('pointerleave', hideTip);
  hit.addEventListener('pointercancel', hideTip);
  // A tap sticks the tooltip (no pointerleave on touch) — tap anywhere else dismisses.
  document.addEventListener('pointerdown', function (evt) {
    if (!svg.contains(evt.target)) hideTip();
  });

  container.insertBefore(svg, container.firstChild);

  // On small screens the in-chart text is tiny; lean on the table (Dev audit note).
  if (window.matchMedia && window.matchMedia('(max-width: 600px)').matches) {
    var tbl = document.querySelector('.chart-table');
    if (tbl) tbl.setAttribute('open', '');
  }
}

var mount = document.getElementById('price-chart');
if (mount) render(mount);
