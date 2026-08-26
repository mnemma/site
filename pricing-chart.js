/* Mnemma pricing chart — the worked band and its ceiling.
   X-axis is census-uHi (attested planning stock) — the exact statistic
   quote(route, stock) gates on, imported as QUOTED_ABOVE so the boundary can
   never drift from the assessment. Left of the ceiling the published worked
   band applies (cash at order / year one); strictly right of it the install is
   quoted from the census. A ceiling, not a slope.
   The two plotted dollars and the boundary are all imported from estimator.js —
   no number lives twice. Pure SVG + one HTML tooltip. No network. */

import {
  QUOTED_ABOVE, WORKED_CASH_AT_ORDER, WORKED_YEAR_ONE,
  CAP_UNIQUE, fmtStock, fmtUsd, ceilingKwAt
} from './estimator.js';

var NS = 'http://www.w3.org/2000/svg';

export function render(container) {
  var W = 960, H = 400;
  var M = { l: 78, r: 210, t: 40, b: 92 };
  var pw = W - M.l - M.r, ph = H - M.t - M.b;
  var X_MAX = 40e9;   // census-uHi, linear 0→40B (§3c axis spec)
  var Y_MAX = 90000;  // dollars
  var x = function (v) { return M.l + (v / X_MAX) * pw; };
  var y = function (usd) { return M.t + ph - (usd / Y_MAX) * ph; };
  var CX = x(QUOTED_ABOVE);   // the one marked interior boundary, from the import
  var kwAt6 = ceilingKwAt(6);
  var GAP = 4;                 // hatch starts strictly PAST the ceiling, never on it
  var plotR = W - M.r;

  function el(name, attrs, text) {
    var n = document.createElementNS(NS, name);
    for (var a in attrs) n.setAttribute(a, attrs[a]);
    if (text != null) n.textContent = text;
    return n;
  }

  var svg = el('svg', {
    viewBox: '0 0 ' + W + ' ' + H,
    role: 'img',
    'aria-label':
      'Chart: the worked mid-market band against attested planning stock (the census statistic). ' +
      'Up to about ' + fmtStock(QUOTED_ABOVE) + ' census planning stock — roughly ' + kwAt6 +
      ' knowledge workers with several years of history — the published worked band applies: about ' +
      fmtUsd(WORKED_CASH_AT_ORDER) + ' cash at order and about ' + fmtUsd(WORKED_YEAR_ONE) +
      ' year one. Above that envelope the worked band stops applying and the install is quoted from your census.'
  });
  svg.style.width = '100%';
  svg.style.height = 'auto';
  svg.style.display = 'block';
  svg.style.fontFamily = 'var(--sans)';

  // Hatch texture for the quoted zone (identity by label + texture, not hue).
  var defs = el('defs', {});
  var pat = el('pattern', { id: 'quoted-hatch', width: 8, height: 8, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
  pat.appendChild(el('rect', { width: 8, height: 8, fill: 'var(--rule-soft)', opacity: 0.4 }));
  pat.appendChild(el('line', { x1: 0, y1: 0, x2: 0, y2: 8, stroke: 'var(--muted)', 'stroke-width': 1, opacity: 0.5 }));
  defs.appendChild(pat);
  svg.appendChild(defs);

  // Gridlines + y ticks (hairline, recessive)
  [0, 30000, 60000, 90000].forEach(function (v) {
    svg.appendChild(el('line', { x1: M.l, y1: y(v), x2: plotR, y2: y(v), stroke: 'var(--rule-soft)', 'stroke-width': 1 }));
    svg.appendChild(el('text', { x: M.l - 10, y: y(v) + 4, 'text-anchor': 'end', 'font-size': 12, fill: 'var(--muted)' }, v === 0 ? '$0' : '$' + (v / 1000) + 'k'));
  });

  // Quoted zone: hatched, STRICTLY right of the ceiling (starts past the line, never on it).
  var hx = CX + GAP;
  svg.appendChild(el('rect', { x: hx, y: M.t, width: plotR - hx, height: ph, fill: 'url(#quoted-hatch)' }));
  svg.appendChild(el('text', { x: (hx + plotR) / 2, y: M.t + 20, 'text-anchor': 'middle', 'font-size': 12, fill: 'var(--muted)' }, 'quoted —'));
  svg.appendChild(el('text', { x: (hx + plotR) / 2, y: M.t + 35, 'text-anchor': 'middle', 'font-size': 12, fill: 'var(--muted)' }, 'larger install'));

  // The two flat worked-band lines, drawn ONLY up to the ceiling.
  [{ v: WORKED_YEAR_ONE, label: '~' + fmtUsd(WORKED_YEAR_ONE) + ' year one' },
   { v: WORKED_CASH_AT_ORDER, label: '~' + fmtUsd(WORKED_CASH_AT_ORDER) + ' cash at order' }].forEach(function (s) {
    svg.appendChild(el('line', { x1: x(0), y1: y(s.v), x2: CX, y2: y(s.v), stroke: 'var(--accent)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
    svg.appendChild(el('circle', { cx: CX, cy: y(s.v), r: 4.5, fill: 'var(--accent)', stroke: 'var(--paper)', 'stroke-width': 2 }));
    svg.appendChild(el('text', { x: x(0) + 10, y: y(s.v) - 8, 'font-size': 12.5, fill: 'var(--ink-soft)' }, s.label));
  });

  // The story, said once, on the worked region.
  svg.appendChild(el('text', { x: (x(0) + CX) / 2, y: y(WORKED_YEAR_ONE) - 28, 'text-anchor': 'middle', 'font-size': 13, fill: 'var(--muted)' }, 'Worked mid-market band — we quote from your numbers.'));

  // Ceiling line + honest "stops applying" caption (a ceiling, not an upward slope).
  svg.appendChild(el('line', { x1: CX, y1: M.t, x2: CX, y2: M.t + ph, stroke: 'var(--ink-soft)', 'stroke-width': 1.5 }));
  svg.appendChild(el('text', { x: CX, y: M.t - 12, 'text-anchor': 'middle', 'font-size': 12, fill: 'var(--ink-soft)' }, 'the worked band stops applying above the mid-market envelope'));

  // x axis
  svg.appendChild(el('line', { x1: M.l, y1: M.t + ph, x2: plotR, y2: M.t + ph, stroke: 'var(--rule)', 'stroke-width': 1 }));
  // Neutral decade ticks for scale — NOT boundaries. The unblessed lower S1/S2 edge
  // is not drawn at all; the only marked interior boundary is the ceiling.
  [0, 10e9, 20e9, 30e9, 40e9].forEach(function (v) {
    svg.appendChild(el('text', { x: x(v), y: M.t + ph + 18, 'text-anchor': 'middle', 'font-size': 12, fill: 'var(--muted)' }, v === 0 ? '0' : fmtStock(v)));
  });
  // The ceiling boundary tick — the one marked interior boundary (from the import).
  svg.appendChild(el('line', { x1: CX, y1: M.t + ph, x2: CX, y2: M.t + ph + 6, stroke: 'var(--ink-soft)', 'stroke-width': 1.5 }));
  svg.appendChild(el('text', { x: CX, y: M.t + ph + 18, 'text-anchor': 'middle', 'font-size': 12, fill: 'var(--ink-soft)', 'font-weight': 600 }, fmtStock(QUOTED_ABOVE)));

  // Axis title + secondary team-size scale (years assumption lives here, never in geometry).
  svg.appendChild(el('text', { x: M.l + pw / 2, y: M.t + ph + 42, 'text-anchor': 'middle', 'font-size': 12, fill: 'var(--muted)' }, 'attested planning stock — the census statistic we quote from (knowledge workers × years of history × content per person)'));
  svg.appendChild(el('text', { x: M.l + pw / 2, y: M.t + ph + 60, 'text-anchor': 'middle', 'font-size': 11.5, fill: 'var(--muted)' }, '≈ team size at 6 years of history: ' + kwAt6 + ' knowledge workers ↔ ' + fmtStock(QUOTED_ABOVE) + ' — the years assumption lives in this label, not the gate'));

  // Greenfield planning cap: a hairline near the origin (57M is 0.14% of the axis —
  // never a visible window). The existing GF copy block on the page carries the rest.
  var gx = x(CAP_UNIQUE);
  svg.appendChild(el('line', { x1: gx, y1: M.t, x2: gx, y2: M.t + ph, stroke: 'var(--rule)', 'stroke-width': 1, 'stroke-dasharray': '2 3', opacity: 0.75 }));
  svg.appendChild(el('text', { x: gx + 5, y: M.t + 13, 'text-anchor': 'start', 'font-size': 10.5, fill: 'var(--muted)' }, 'Greenfield planning cap (' + fmtStock(CAP_UNIQUE) + ') — near the origin at this scale'));

  // Hover layer: crosshair + tooltip, read in census-uHi space (the gate's own units).
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
    var uHi = Math.min(X_MAX, Math.max(0, (px - M.l) / pw * X_MAX));
    var cxp = x(uHi);
    cross.setAttribute('x1', cxp); cross.setAttribute('x2', cxp);
    cross.setAttribute('opacity', 1);
    var html;
    if (uHi > QUOTED_ABOVE) {
      html = '<strong>' + fmtStock(uHi) + ' attested planning stock</strong><br>' +
        'Above the mid-market envelope (~' + fmtStock(QUOTED_ABOVE) + '). The worked band stops applying — the install is quoted from your census.';
    } else {
      html = '<strong>' + fmtStock(uHi) + ' attested planning stock</strong><br>' +
        'Within the worked mid-market band: ~' + fmtUsd(WORKED_CASH_AT_ORDER) + ' cash at order · ~' + fmtUsd(WORKED_YEAR_ONE) + ' year one. We quote from your numbers.';
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
