/* Mnemma pricing chart — an ILLUSTRATIVE estimate by company size.
   X-axis is annual revenue in $50M steps across the $50M–$250M segment Standard
   serves; larger is always a custom quote. Each bracket carries the corpus it
   implies (knowledge workers × years × content per person) so a reader whose
   business is leaner than its revenue can self-select by tokens instead.

   This chart is a PICTURE, not the quote. Only the $50M column prints published
   dollars — it is the one bracket whose implied corpus sits within the worked
   mid-market envelope (census planning stock <= QUOTED_ABOVE, imported). Every
   larger column is a PLANNING ESTIMATE from a stated rule, drawn dashed and
   labelled on the column — never the output of the assessment. The assessment
   (book.html / estimator.js) is untouched and quotes from your measured census.

   Single source of truth: the published worked-band dollars and the envelope
   boundary are imported from estimator.js and never copied here. The scaling
   rule below is an ILLUSTRATION constant that lives only in this file — it must
   never enter estimator.js or book.html. Pure SVG + one HTML tooltip. No network. */

import {
  QUOTED_ABOVE, WORKED_CASH_AT_ORDER, WORKED_YEAR_ONE,
  fmtUsd, fmtStock
} from './estimator.js';

var NS = 'http://www.w3.org/2000/svg';

/* ---- Illustration constants (this file only — never estimator.js/book.html) ----
   Rule B, blessed by zach 2026-08-26 (thread 60394f1f):
   install estimate = max($30k floor, $30k × corpus / 17.01B sized anchor),
   rounded to $1k; hardware ~$12k and first-year stewardship ~$36k unchanged.
   The $30k install was sized at the ~$50M SMB whose attested census is ~17.01B,
   so that anchor — not the print ceiling — sets the per-token slope. */
var KW_PER_50M   = 150;      // ~150 knowledge workers per $50M revenue (calibration anchor)
var YEARS        = 6;        // labelled history assumption — never a gate
var COEF_HI      = 16.2e6;   // census-uHi content-per-person coefficient (matches estimator UNIQUE_HI)
var SIZED_ANCHOR = 17.01e9;  // corpus the $30k install was sized at ($50M SMB) — the Rule B denominator
var BASE_INSTALL = 30000;    // published install floor
var HW           = 12000;    // hybrid-default hardware (2-node), shown at the default
var STEW_Y1      = 36000;    // first-year stewardship (~$3k/mo × 12)

var REVS = [50, 100, 150, 200, 250];

function k1(v) { return Math.round(v / 1000) * 1000; }

// Build the ladder. A column is "published" only while its implied corpus stays
// within the worked envelope (the imported QUOTED_ABOVE ceiling); there it prints
// the imported worked-band dollars. Above the envelope it is a planning estimate
// from Rule B — dashed, tagged, never a quote.
export function ladder() {
  return REVS.map(function (rev, i) {
    var kw = KW_PER_50M * (i + 1);
    var stock = kw * YEARS * COEF_HI;
    var published = stock <= QUOTED_ABOVE;
    if (published) {
      return { rev: rev, kw: kw, stock: stock, published: true,
               cash: WORKED_CASH_AT_ORDER, y1: WORKED_YEAR_ONE };
    }
    var install = k1(Math.max(BASE_INSTALL, BASE_INSTALL * stock / SIZED_ANCHOR));
    return { rev: rev, kw: kw, stock: stock, published: false,
             install: install, cash: install + HW, y1: install + HW + STEW_Y1 };
  });
}

export function render(container) {
  var rows = ladder();
  var W = 1000, H = 480;
  var M = { l: 84, r: 40, t: 52, b: 118 };
  var pw = W - M.l - M.r, ph = H - M.t - M.b;
  var Y_MAX = 200000;   // headroom above the ~$177k top line so its label clears the column tag
  var STRIP = 104;                        // right strip: beyond the $50–250M segment
  var slot = (pw - STRIP) / rows.length;
  var x0 = function (i) { return M.l + i * slot; };
  var y = function (usd) { return M.t + ph - (usd / Y_MAX) * ph; };

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
      'Illustrative estimate by company size across the $50M to $250M segment. ' +
      'The $50M column shows the published worked band: about ' + fmtUsd(WORKED_CASH_AT_ORDER) +
      ' cash at order and about ' + fmtUsd(WORKED_YEAR_ONE) + ' year one. Larger columns are ' +
      'planning estimates that scale with the corpus we would read, tagged as estimates and ' +
      'never a quote. Above $250M is always a custom quote. Your measured census sets your actual number.'
  });
  svg.style.width = '100%';
  svg.style.height = 'auto';
  svg.style.display = 'block';
  svg.style.fontFamily = 'var(--sans)';

  // Hatch texture for the custom (beyond-segment) zone — identity by label + texture, not hue.
  var defs = el('defs', {});
  var pat = el('pattern', { id: 'custom-hatch', width: 8, height: 8, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
  pat.appendChild(el('rect', { width: 8, height: 8, fill: 'var(--rule-soft)', opacity: 0.4 }));
  pat.appendChild(el('line', { x1: 0, y1: 0, x2: 0, y2: 8, stroke: 'var(--muted)', 'stroke-width': 1, opacity: 0.5 }));
  defs.appendChild(pat);
  svg.appendChild(defs);

  // Gridlines + y ticks (hairline, recessive).
  [0, 30000, 60000, 90000, 120000, 150000, 180000].forEach(function (v) {
    svg.appendChild(el('line', { x1: M.l, y1: y(v), x2: W - M.r, y2: y(v), stroke: 'var(--rule-soft)', 'stroke-width': 1 }));
    svg.appendChild(el('text', { x: M.l - 10, y: y(v) + 4, 'text-anchor': 'end', 'font-size': 12, fill: 'var(--muted)' }, v === 0 ? '$0' : '$' + (v / 1000) + 'k'));
  });

  var tip = document.createElement('div');
  tip.className = 'chart-tip';
  tip.setAttribute('hidden', '');
  container.appendChild(tip);

  function showTip(evt, r) {
    var lines = r.published
      ? '<strong>$' + r.rev + 'M — published worked band</strong><br>' +
        '~' + fmtUsd(r.cash) + ' cash at order · ~' + fmtUsd(r.y1) + ' year one. ' +
        'Implied corpus ~' + fmtStock(r.stock) + ', within the worked mid-market envelope.'
      : '<strong>$' + r.rev + 'M — planning estimate, not your quote</strong><br>' +
        'Implied corpus ~' + fmtStock(r.stock) + '. Install ~' + fmtUsd(r.install) +
        ' + ~' + fmtUsd(HW) + ' hardware = ~' + fmtUsd(r.cash) + ' cash · ~' + fmtUsd(r.y1) +
        ' year one. Your measured census sets the real number.';
    tip.innerHTML = lines;
    tip.removeAttribute('hidden');
    var cw = container.getBoundingClientRect();
    var left = evt.clientX - cw.left + 14;
    if (left > cw.width - 300) left = cw.width - 300;
    tip.style.left = left + 'px';
    tip.style.top = (evt.clientY - cw.top + 16) + 'px';
  }
  function hideTip() { tip.setAttribute('hidden', ''); }

  rows.forEach(function (r, i) {
    var xa = x0(i) + 10, xb = x0(i) + slot - 10, xm = (xa + xb) / 2;

    // Planning columns carry the tag ON the column (Substrate hard requirement) + dashed lines.
    if (!r.published) {
      svg.appendChild(el('text', { x: xm, y: M.t - 22, 'text-anchor': 'middle', 'font-size': 10.5, fill: 'var(--muted)', 'letter-spacing': '.06em' }, 'PLANNING ESTIMATE'));
      svg.appendChild(el('text', { x: xm, y: M.t - 9, 'text-anchor': 'middle', 'font-size': 10.5, fill: 'var(--muted)', 'letter-spacing': '.06em' }, 'NOT YOUR QUOTE'));
    } else {
      svg.appendChild(el('text', { x: xm, y: M.t - 15, 'text-anchor': 'middle', 'font-size': 10.5, fill: 'var(--accent-ink)', 'letter-spacing': '.06em' }, 'PUBLISHED BAND'));
    }

    [{ v: r.y1, lab: 'year one' }, { v: r.cash, lab: 'cash at order' }].forEach(function (ln) {
      svg.appendChild(el('line', {
        x1: xa, y1: y(ln.v), x2: xb, y2: y(ln.v),
        stroke: 'var(--accent)', 'stroke-width': 2, 'stroke-linecap': 'round',
        'stroke-dasharray': r.published ? 'none' : '6 5',
        opacity: r.published ? 1 : 0.9
      }));
      svg.appendChild(el('text', { x: xm, y: y(ln.v) - 7, 'text-anchor': 'middle', 'font-size': 12.5, fill: 'var(--ink-soft)' },
        '~' + fmtUsd(ln.v) + (i === 0 ? ' ' + ln.lab : '')));
    });

    // Column labels: revenue + implied corpus subtitle (read by tokens, not revenue).
    svg.appendChild(el('text', { x: xm, y: H - M.b + 30, 'text-anchor': 'middle', 'font-size': 14, fill: 'var(--ink)', 'font-weight': 600 }, '$' + r.rev + 'M'));
    svg.appendChild(el('text', { x: xm, y: H - M.b + 49, 'text-anchor': 'middle', 'font-size': 11, fill: 'var(--muted)' }, '~' + r.kw + ' KW · ~' + fmtStock(r.stock) + ' tokens'));

    // Hover hit area over the whole column.
    var hit = el('rect', { x: x0(i), y: M.t, width: slot, height: ph, fill: 'transparent' });
    hit.addEventListener('pointermove', function (e) { showTip(e, r); });
    hit.addEventListener('pointerdown', function (e) { showTip(e, r); });
    hit.addEventListener('pointerleave', hideTip);
    hit.addEventListener('pointercancel', hideTip);
    svg.appendChild(hit);
  });

  // Beyond-segment strip: Standard serves $50–250M; larger is always a custom quote.
  var sx = M.l + rows.length * slot + 8, sw = W - M.r - sx;
  svg.appendChild(el('rect', { x: sx, y: M.t, width: sw, height: ph, fill: 'url(#custom-hatch)' }));
  svg.appendChild(el('text', { x: sx + sw / 2, y: y(84000) - 8, 'text-anchor': 'middle', 'font-size': 12, fill: 'var(--muted)' }, 'beyond'));
  svg.appendChild(el('text', { x: sx + sw / 2, y: y(84000) + 8, 'text-anchor': 'middle', 'font-size': 12, fill: 'var(--muted)' }, '$250M —'));
  svg.appendChild(el('text', { x: sx + sw / 2, y: y(84000) + 24, 'text-anchor': 'middle', 'font-size': 12, fill: 'var(--muted)' }, 'custom quote'));
  svg.appendChild(el('text', { x: sx + sw / 2, y: H - M.b + 30, 'text-anchor': 'middle', 'font-size': 14, fill: 'var(--ink)', 'font-weight': 600 }, '$250M+'));

  // x axis
  svg.appendChild(el('line', { x1: M.l, y1: M.t + ph, x2: W - M.r, y2: M.t + ph, stroke: 'var(--rule)', 'stroke-width': 1 }));
  svg.appendChild(el('text', { x: M.l + (pw - STRIP) / 2, y: H - M.b + 68, 'text-anchor': 'middle', 'font-size': 12, fill: 'var(--muted)' }, 'annual revenue — the segment Standard serves'));

  // Honest caption: labelled assumptions, read-by-tokens escape hatch, and the plain limit.
  svg.appendChild(el('text', { x: M.l, y: H - 24, 'font-size': 11.5, fill: 'var(--muted)' },
    'Illustrative: ~150 knowledge workers per $50M and 6 years of history, labelled — not the gate. Leaner corpus? Read by tokens; the measured census sets the quote.'));
  svg.appendChild(el('text', { x: M.l, y: H - 8, 'font-size': 11.5, fill: 'var(--muted)' },
    'Only the $50M column is the published band. Dashed columns are planning estimates from a stated rule — never your actual quote.'));

  container.insertBefore(svg, container.firstChild);

  // Dismiss a stuck touch tooltip on tap-away.
  document.addEventListener('pointerdown', function (evt) {
    if (!svg.contains(evt.target)) hideTip();
  });

  // On small screens the in-chart text is tiny; lean on the table.
  if (window.matchMedia && window.matchMedia('(max-width: 600px)').matches) {
    var tbl = document.querySelector('.chart-table');
    if (tbl) tbl.setAttribute('open', '');
  }
}

var mount = (typeof document !== 'undefined') ? document.getElementById('price-chart') : null;
if (mount) render(mount);
