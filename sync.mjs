#!/usr/bin/env node
/**
 * Harden Crossings — vacancy sync
 * --------------------------------
 * Fetches the live Chanticleer feed for "Harden", parses every current unit,
 * writes units.json, and refreshes the fallback snapshot baked into the page.
 *
 * Zero dependencies. Requires Node 18+ (global fetch).
 *
 *   node sync.mjs            # sync from the live site
 *   node sync.mjs --selftest # parse a built-in fixture and verify (no network)
 *
 * Safety: if zero units are discovered/parsed, nothing is written and the
 * process exits non-zero — a bad scrape never wipes a working page.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const BASE = 'https://pm.cprealty.co';
const FEED = `${BASE}/rentals?q=Harden`;
const APPLY = id => `https://cptriangle.managebuilding.com/Resident/rental-application/new?listingId=${id}`;
const HTML_FILE = join(HERE, 'index.html');
const JSON_FILE = join(HERE, 'units.json');

const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December';

/* ----------------------------- fetch helpers ----------------------------- */
async function getText(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'user-agent': 'HardenSync/1.0 (property listing sync)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

/* ------------------------------- parsing --------------------------------- */
// Strip tags/scripts to plain text so the same regexes work on the rendered page.
function normalize(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Find Harden unit slugs anywhere in the feed HTML (DOM order preserved).
function discoverSlugs(html) {
  const seen = new Set();
  const re = /\/rentals\/([a-z0-9-]*harden[a-z0-9-]*)/gi;
  let m;
  while ((m = re.exec(html))) {
    const slug = m[1].toLowerCase();
    if (/-unit-[a-z0-9]+$/.test(slug)) seen.add(slug);
  }
  return [...seen];
}

function imagesOf(html) {
  const re = /pm\.cprealty\.co\/api\/listings\/image\/(\d+)\/(\d+)/g;
  const seen = new Set();
  const out = [];
  let m;
  while ((m = re.exec(html))) {
    const key = `${m[1]}/${m[2]}`;
    if (!seen.has(key)) { seen.add(key); out.push({ group: +m[1], id: +m[2] }); }
  }
  return out;
}

// Pull the unit's OWN monthly rent from its listing page.
// The unit's price is the first rent-sized dollar amount in the page BODY.
// We deliberately (1) skip the <head>/<title> (which may carry a property-wide
// "from $X"), (2) stop before any "similar / other units" section so a sibling
// unit's price can't leak in, and (3) accept the amount with or without a
// "/mo" suffix, since the headline price is often shown as a bare "$1,095".
export function extractRent(html) {
  const inRange = v => v >= 500 && v <= 20000;               // plausible monthly rent
  const firstRent = s => {
    if (!s) return null;
    const re = /\$\s?([\d,]{3,7})(?:\.\d{2})?/g;             // $ + at least 3 digits
    let m;
    while ((m = re.exec(s))) {
      const v = Number(m[1].replace(/,/g, ''));
      if (inRange(v)) return v;
    }
    return null;
  };
  const body = normalize(html.replace(/<head[\s\S]*?<\/head>/i, ' '));
  const cut = body.search(/similar listing|you may(?: also)? like|other (?:available )?(?:units|rentals|homes)|more (?:rentals|homes|at this)|nearby (?:listing|rental)|related (?:listing|rental)|also viewed|explore more/i);
  const scope = cut > 0 ? body.slice(0, cut) : body;
  return firstRent(scope) || firstRent(body) || firstRent(normalize(html));
}

// Parse one listing page (raw HTML). Returns a unit object or null if unusable.
export function parseListing(html, slug) {
  const t = normalize(html);
  const imgs = imagesOf(html);

  const idM = html.match(/rental-application\/new\?listingId=(\d+)/);
  const addrM = t.match(
    new RegExp(`(\\d+\\s+[A-Za-z][A-Za-z .]*?Harden Street)\\s*-\\s*([A-Za-z0-9]+)\\s*,\\s*([A-Za-z .]+?)\\s*,\\s*([A-Z]{2})\\s*,\\s*(\\d{5})`)
  );
  const rent = extractRent(html);
  const bbM = t.match(/(\d+)\s*beds?\s*[·•\-]\s*([\d.]+)\s*bath/i);
  const bedsM = bbM || t.match(/(\d+)\s*beds?\b/i);
  const bathM = bbM || t.match(/([\d.]+)\s*bath/i);
  const sqftM = t.match(/([\d,]+)\s*sq\s*ft/i);
  const availM = t.match(new RegExp(`Available\\s+((?:${MONTHS})\\s+\\d{1,2},\\s+\\d{4})`, 'i'));
  const vidM = html.match(/https?:\/\/bbemaildelivery\.com\/bbext\/[^"'\s<>\\]+/);

  if (!idM || !addrM || !imgs.length || rent == null) {
    console.warn(`  ! skipping ${slug} (missing ${[
      !idM && 'listingId', !addrM && 'address', !imgs.length && 'photos', rent == null && 'rent',
    ].filter(Boolean).join(', ')})`);
    return null;
  }

  return {
    id: idM[1],
    address: addrM[1].trim(),
    unit: addrM[2].toUpperCase(),
    city: addrM[3].trim(),
    state: addrM[4],
    zip: addrM[5],
    rent,
    beds: bedsM ? Number(bbM ? bbM[1] : bedsM[1]) : 2,
    baths: bathM ? Number(bbM ? bbM[2] : bathM[1]) : 1.5,
    sqft: sqftM ? Number(sqftM[1].replace(/,/g, '')) : 980,
    available: availM ? availM[1] : null,
    url: `${BASE}/rentals/${slug}`,
    applyUrl: APPLY(idM[1]),
    videoUrl: vidM ? vidM[0].replace(/&amp;/g, '&') : null,
    group: imgs[0].group,
    hero: imgs[0].id,
    photos: imgs.map(i => i.id).slice(0, 12),
  };
}

/* ------------------------------- assembly -------------------------------- */
export function build(units) {
  units.sort((a, b) => a.rent - b.rent || a.address.localeCompare(b.address) || a.unit.localeCompare(b.unit));
  const primary = units.slice().sort((a, b) => b.photos.length - a.photos.length)[0];
  const videoUrl = (units.find(u => u.videoUrl) || {}).videoUrl || null;

  const full = {
    generatedAt: new Date().toISOString(),
    source: FEED,
    count: units.length,
    minRent: Math.min(...units.map(u => u.rent)),
    videoUrl,
    units,
    gallery: { group: primary.group, photos: primary.photos.slice(0, 12) },
  };

  // Lean copy for the in-page snapshot (drop bulky per-unit photo lists).
  const lean = {
    ...full,
    units: units.map(({ photos, city, state, zip, applyUrl, videoUrl, ...u }) => u),
  };
  return { full, lean };
}

/* ------------------------------- writing --------------------------------- */
export async function refreshHtmlSnapshot(lean) {
  let html;
  try { html = await readFile(HTML_FILE, 'utf8'); }
  catch { console.warn('  ! index.html not found — skipping in-page snapshot refresh'); return false; }

  const marker = /\/\*FEED_START\*\/[\s\S]*?\/\*FEED_END\*\//;
  if (!marker.test(html)) { console.warn('  ! FEED markers not found in index.html — skipping'); return false; }

  const block = `/*FEED_START*/${JSON.stringify(lean, null, 2)}/*FEED_END*/`;
  await writeFile(HTML_FILE, html.replace(marker, block));
  return true;
}

/* --------------------------------- main ---------------------------------- */
async function run() {
  console.log(`→ Fetching feed: ${FEED}`);
  const feedHtml = await getText(FEED);
  const slugs = discoverSlugs(feedHtml);
  console.log(`  found ${slugs.length} Harden listing(s)`);
  if (!slugs.length) throw new Error('No Harden listings found — refusing to overwrite existing data.');

  const units = [];
  for (const slug of slugs) {
    try {
      const page = await getText(`${BASE}/rentals/${slug}`);
      const u = parseListing(page, slug);
      if (u) { units.push(u); console.log(`  ✓ ${u.address} — Unit ${u.unit} — $${u.rent.toLocaleString()}`); }
    } catch (e) {
      console.warn(`  ! ${slug}: ${e.message}`);
    }
  }
  if (!units.length) throw new Error('Parsed 0 units — refusing to overwrite existing data.');

  const { full, lean } = build(units);
  await writeFile(JSON_FILE, JSON.stringify(full, null, 2) + '\n');
  const baked = await refreshHtmlSnapshot(lean);
  console.log(`\n✓ Wrote units.json (${full.count} units, from $${full.minRent.toLocaleString()})${baked ? ' and refreshed index.html snapshot' : ''}.`);
}

/* ------------------------------- self test ------------------------------- */
function selftest() {
  const fixture = `
    <html><head><title>512 East Harden Street - H, Graham, NC, 27253 — 2 beds · 1.5 bath — $1,195/mo · Chanticleer Properties</title></head>
    <body>
      <h1>512 East Harden Street - H, Graham, NC, 27253</h1>
      <p>512 East Harden Street — Unit H</p>
      <p>$1,195/mo</p><p>2 beds · 1.5 bath</p><p>980 sq ft</p>
      <a href="https://cptriangle.managebuilding.com/Resident/rental-application/new?listingId=95259">Apply Now</a>
      <iframe src="https://bbemaildelivery.com/bbext/?p=vidEmbed&amp;id=9BFCC431-5402-4E3B-BED1-9F1D81223F5C&amp;ar=1"></iframe>
      <img src="https://pm.cprealty.co/api/listings/image/477075/1485631">
      <img src="https://pm.cprealty.co/api/listings/image/477075/1485632">
      <img src="https://pm.cprealty.co/api/listings/image/477075/1485631">
      <h2>Leasing details</h2><div>Available</div><div>July 16, 2026</div>
    </body></html>`;
  const u = parseListing(fixture, '512-east-harden-street-h-graham-nc-27253-unit-h');
  const checks = [
    ['id', u?.id === '95259'],
    ['address', u?.address === '512 East Harden Street'],
    ['unit', u?.unit === 'H'],
    ['city', u?.city === 'Graham'],
    ['rent', u?.rent === 1195],
    ['beds', u?.beds === 2],
    ['baths', u?.baths === 1.5],
    ['sqft', u?.sqft === 980],
    ['available', u?.available === 'July 16, 2026'],
    ['group', u?.group === 477075],
    ['hero', u?.hero === 1485631],
    ['photos deduped', u?.photos.length === 2],
    ['video decoded', u?.videoUrl?.includes('&id=') && !u.videoUrl.includes('&amp;')],
  ];
  // --- Rent extraction cases, incl. the 508-G bug (bare headline price + a
  //     "similar units" section listing a sibling at a different price). ---
  const rentCases = [
    // headline price WITHOUT /mo, sibling $1,195/mo lower down in a similar section
    ['bare price + sibling section', `<html><head><title>508 East Harden Street - G, Graham, NC</title></head>
       <body><h1>508 East Harden Street - G</h1><div class="price">$1,095</div>
       <p>2 beds · 1.5 bath · 980 sq ft</p>
       <section><h2>Similar listings</h2><div>510 East Harden St<span>$1,195/mo</span></div></section>
       </body></html>`, 1095],
    // property-wide "from $1,195" in the head, unit's own $1,095 in the body
    ['head "from" price ignored', `<html><head><title>Harden Crossings — from $1,195/mo</title></head>
       <body><h1>508 East Harden Street - G</h1><p>$1,095/mo</p></body></html>`, 1095],
    // normal case, price with /mo
    ['price with /mo', `<html><head><title>x</title></head><body><p>$1,195/mo</p></body></html>`, 1195],
    // fee/deposit before rent should be skipped ($50 too small)
    ['skips small $ fees', `<html><head><title>x</title></head><body><p>Application fee $50</p><p>$1,095/mo</p></body></html>`, 1095],
  ];
  for (const [name, htmlDoc, expect] of rentCases) {
    const got = extractRent(htmlDoc);
    checks.push([`rent: ${name} (=$${expect})`, got === expect]);
  }

  let ok = true;
  for (const [name, pass] of checks) { console.log(`  ${pass ? '✓' : '✗'} ${name}`); if (!pass) ok = false; }
  console.log(ok ? '\n✓ self-test passed' : '\n✗ self-test FAILED');
  if (!ok) { console.log(JSON.stringify(u, null, 2)); process.exit(1); }
}

/* ------------------------------- dispatch -------------------------------- */
// Only run when executed directly (`node sync.mjs`), not when imported.
const invokedDirectly = process.argv[1] &&
  fileURLToPath(import.meta.url) === (await import('node:fs')).realpathSync(process.argv[1]);

if (invokedDirectly) {
  const arg = process.argv[2];
  if (arg === '--selftest') {
    selftest();
  } else {
    run().catch(err => { console.error(`\n✗ Sync failed: ${err.message}`); process.exit(1); });
  }
}
