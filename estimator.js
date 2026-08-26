/* Mnemma census v0 — published formula.
   Source: PLANS/CENSUS_MVP.md §3–5 · RESEARCH/GREENFIELD_SIZING_ENVELOPE.md
   Greenfield planning cap 57M unique. Fees [SET, proposed] / Standard published.

   Contract (Dev / Node):
     import { estimate } from './estimator.js'
     estimate({ kw, years, gmail, drive, calendar, github, extras, workspace, filter, paper })
       -> { route: 'gf'|'std'|'straddle'|'reject', uLo, uHi, pLo, pHi, ... }

   Browser: book.html loads this as type=module and imports the same named export.
   Pure. No DOM. No network. */

export const UNIQUE_LO = 4.1e6;
export const UNIQUE_HI = 16.2e6;
export const CAP_UNIQUE = 57e6;

// Quoted-above ceiling (proposal §3c/§4, blessed 2026-08-26).
// Standard prints the already-published worked band while census-uHi <= QUOTED_ABOVE;
// above it the install is quoted from the census, not printed. Single source of truth —
// pricing-chart.js and book.html import THIS constant; never copy the number.
// Gate is stock (census-uHi), not headcount: 600 KW x 2y = 19.4B still prints the
// worked band; 600 KW x 5y = 48.6B goes quoted.
export const QUOTED_ABOVE = 25e9;

// Worked mid-market example — the already-published Standard band
// (receipt: /brain/pricing-mechanics#claim-standard-bands). Single source of the
// two plotted dollars: quote() prints them and pricing-chart.js imports them, so
// the chart no longer keeps its own copy of 42000/78000.
export const WORKED_CASH_AT_ORDER = 42000;
export const WORKED_YEAR_ONE = 78000;

export function fmtUsd(n) {
  return '$' + Math.round(Number(n) || 0).toLocaleString('en-US');
}

export function fmtM(n) {
  if (!isFinite(n)) return '—';
  if (n === 0) return '0';
  var m = n / 1e6;
  return (m >= 100 ? Math.round(m).toString() : m.toFixed(1)) + 'M';
}

// Format a census-stock figure for copy (billions above 1B, else millions).
// Every "~25B" label in quote()/book.html/pricing-chart.js derives from QUOTED_ABOVE
// through this — no literal ceiling number lives outside the QUOTED_ABOVE export.
export function fmtStock(n) {
  if (!isFinite(n)) return '—';
  if (n >= 1e9) {
    var b = n / 1e9;
    return (b === Math.round(b) ? b.toString() : b.toFixed(1)) + 'B';
  }
  return fmtM(n);
}

// Legibility only: the team size the ceiling corresponds to at a stated history depth.
// Years live in the label, never in the gate (the gate is census-uHi). Rounded to 5.
export function ceilingKwAt(years) {
  var y = Number(years) || 0;
  if (!y) return 0;
  return Math.round(QUOTED_ABOVE / (y * UNIQUE_HI) / 5) * 5;
}

export function sourcesModifier(d) {
  var both = d.gmail && d.drive;
  var one = (d.gmail || d.drive) && !both;
  if (!d.gmail && !d.drive) return 0;
  return both ? 1 : one ? 0.6 : 0;
}

export function stock(d) {
  var srcMod = sourcesModifier(d);
  var paper = d.paper ? 1.25 : 1;
  var years = Number(d.years) || 0;
  var kw = Number(d.kw) || 0;
  var uLo = kw * years * UNIQUE_LO * srcMod;
  var uHi = kw * years * UNIQUE_HI * srcMod;
  return {
    srcMod: srcMod,
    paper: paper,
    uLo: uLo,
    uHi: uHi,
    pLo: uLo * 3 * paper,
    pHi: uHi * 3 * paper,
    mid: (uLo + uHi) / 2
  };
}

export function shrinkYearsToCap(d) {
  var srcMod = sourcesModifier(d);
  var kw = Number(d.kw) || 0;
  if (!kw || !srcMod) return 0;
  return CAP_UNIQUE / (kw * UNIQUE_HI * srcMod);
}

export function estimate(d) {
  var s = stock(d);
  var under = s.uHi < CAP_UNIQUE;
  var over = s.uLo > CAP_UNIQUE;
  var straddle = !under && !over;
  var packMissing = !d.gmail && !d.drive;

  // §4 first-match. Extra v0 guard: no Gmail and no Drive with years > 0 is not this product.
  // H2 (2026-08-20): question copy generalized. Reject gate unchanged (filter=false still first-match).
  // Revert one-liner — original why:
  // 'Mnemma is for teams that already know a prospect asking where the data lives must hear “our accounts.” If that is not a requirement, ChatGPT Team is the honest recommendation. We will not quote.'
  if (!d.filter) {
    return {
      id: 'reject-sovereignty',
      route: 'reject',
      title: 'Not the right product — and that is fine.',
      why: 'Mnemma is for teams that already require company data to stay in accounts they control. If that is not a requirement, ChatGPT Team is the honest recommendation. We will not quote.'
    };
  }
  if (d.kw < 15) {
    return {
      id: 'reject-size',
      route: 'reject',
      title: 'Too small for a 2026 engagement.',
      why: 'We are focused on teams of 15 or more knowledge workers. We can put you on a waitlist for a later path.'
    };
  }
  if (d.kw > 50) {
    return Object.assign({
      id: 'standard-size',
      route: 'std',
      title: 'Standard install',
      why: 'Teams over 50 knowledge workers are a Standard engagement, not the Greenfield design-partner path.'
    }, s);
  }
  if (d.extras) {
    return Object.assign({
      id: 'standard-scope',
      route: 'std',
      title: 'Standard install',
      why: 'Slack, Microsoft 365, a CRM, or on-prem file shares in month one is beyond the starter pack. We quote Standard, or write a change-order if you want the smaller pack first.'
    }, s);
  }
  if (!d.workspace) {
    return Object.assign({
      id: 'park-workspace',
      route: 'reject',
      title: 'Parked — this path needs Google Workspace.',
      why: 'The current design-partner path uses an Internal OAuth client in your Workspace. Consumer Gmail waits for a later path, or we talk Standard.'
    }, s);
  }
  if (packMissing && (Number(d.years) || 0) > 0) {
    return Object.assign({
      id: 'no-pack',
      route: 'reject',
      title: 'The starter pack is Gmail and Drive.',
      why: 'Calendar and GitHub do not size the stock on their own. Name Gmail, Drive, or both — or set years of history to 0 and connect from go-live only.'
    }, s);
  }
  if (over) {
    return Object.assign({
      id: 'standard-stock',
      route: 'std',
      title: 'Standard install',
      why: 'The history you would connect is over the Greenfield planning cap (57M unique tokens). We will not squeeze that into the smaller package.'
    }, s);
  }
  if (straddle) {
    return Object.assign({
      id: 'straddle',
      route: 'straddle',
      title: 'Two honest paths — not one squeezed price.',
      why: 'Your low-end estimate fits Greenfield; your high-end does not. We offer Standard, or you connect from today and leave history unrecorded. We will not invent a bigger machine to save the smaller package.',
      shrinkYears: shrinkYearsToCap(d)
    }, s);
  }
  return Object.assign({
    id: 'greenfield',
    route: 'gf',
    title: 'Greenfield design partner',
    why: 'On the numbers you supplied, attested stock sits under the Greenfield planning cap. That is a planning band, not a measurement. Any pre-go-live history you do not connect stays unrecorded.'
  }, s);
}

export const compute = estimate;

export function quote(route, stock) {
  if (route === 'gf') {
    return [
      { line: '1. Our fee', value: '$2,000 setup + $1,500 × 12 = $20,000', tag: '' },
      { line: '2. Your tenancy', value: '$70–125/mo → $840–1,500 year one', tag: 'PLANNING' },
      { line: '3. Year-one all-in', value: '~$21,000–21,500', tag: '' },
      { line: 'Cash at signing', value: '$3,500 (setup + month 1) — not year-one', tag: '' }
    ];
  }
  if (route === 'std' || route === 'straddle') {
    // Ceiling: above the mid-market worked example, the worked band stops applying.
    // We quote the install from the census rather than printing $30k/$42k/$78k.
    if (stock && stock.uHi > QUOTED_ABOVE) {
      return [
        { line: '1. Install', value: 'Quoted from your census — this is above the mid-market worked example (~' + fmtStock(QUOTED_ABOVE) + ' census planning stock). The published worked band stops applying; we scope the install from your numbers.', tag: 'QUOTED' },
        { line: '2. Stewardship', value: 'from ~$3,000/mo', tag: 'PLANNING' },
        { line: '3. Hardware + burst', value: 'Deployment-model dependent — hardware, burst compute in your tenancy, and ongoing cloud/VPC are scoped with the install at this size, not the mid-market worked-example figure.', tag: 'PLANNING' }
      ];
    }
    return [
      { line: '1. Our fee', value: '$30,000 install + $3,000 × 12 = $66,000', tag: '' },
      { line: '2. Your tenancy', value: '~$12k hardware + burst compute in your tenancy $3–8k + ongoing cloud/VPC', tag: 'PLANNING' },
      { line: '3. Year-one all-in', value: '~' + fmtUsd(WORKED_YEAR_ONE) + ' (cash-at-order ' + fmtUsd(WORKED_CASH_AT_ORDER) + ' — never blended into year-one)', tag: '' }
    ];
  }
  return [];
}

export const DISCLAIMER =
  'This is a planning band from numbers you supplied, not a measurement. ' +
  'After we connect the named pack we will recount metadata. ' +
  'If the recount is more than 1.5× this band, crosses the Greenfield cap, ' +
  'or restates your planning stock above the mid-market envelope (~' + fmtStock(QUOTED_ABOVE) + ' census planning stock — where the worked band stops applying and the install is quoted), ' +
  'you choose: reprice, shrink what we connect, or walk. ' +
  'We keep the setup you already paid for ($2,000 on the Greenfield path). We refund unused first-month fees if you walk by day 14. ' +
  'It assumes your company looks like our published model.';

export default estimate;
