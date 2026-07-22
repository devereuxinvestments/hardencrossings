# Harden Crossings — Website Guide

A plain-language guide for managing the Harden Crossings Apartment Homes marketing
website and keeping its vacancies up to date. No coding required for day-to-day use.

---

## The one thing to know

**You don't edit the website to change listings.** The "Available homes" section is
powered by your live CP Realty listings feed
(`https://pm.cprealty.co/rentals?q=Harden`). Whenever a unit's status changes at the
source — a home is leased, a new vacancy is posted, a rent or date changes — the
website updates itself. Leased units drop off automatically; new vacancies appear;
rent, availability dates, photos, and apply links all follow.

The site refreshes on its own **every 6 hours**, and you can trigger an immediate
refresh any time (see "Make a change appear right now").

---

## Quick answers

| I want to… | What to do |
| --- | --- |
| Add, remove, or change a vacancy | Update it in your listings source, as you normally do. The site updates itself. |
| Make a change show up immediately | Run a manual sync (see below). |
| Change a phone number, email, or marketing text | Edit `index.html` (see "Editing site content") or send it to your developer. |
| Update photos or the description of a unit | Change them at the source; they refresh on the site automatically. |
| Replace the logo | Files are in `assets/`; ask your developer to swap them. |
| Something looks wrong | See "Troubleshooting". |

---

## Updating a listing (the normal way)

1. Log in to the property management software you already use — the ManageBuilding /
   Buildium portal that handles your online applications
   (`cptriangle.managebuilding.com`) and publishes your listings to
   `pm.cprealty.co`.
2. Make your change there as usual: post a new vacancy, mark a unit leased or
   unavailable, or edit its rent, available date, photos, or description.
3. Done. The website will reflect it on the next automatic sync (within 6 hours), or
   immediately if you run a manual sync.

No code changes, and no need to touch the website files.

---

## Make a change appear right now (manual sync)

If the site is set up on GitHub (the recommended setup):

1. Open the website's repository on **GitHub**.
2. Click the **Actions** tab at the top.
3. In the left sidebar, click **Sync Harden vacancies**.
4. Click the **Run workflow** button on the right, then **Run workflow** again to
   confirm.
5. Wait about a minute. The site updates and republishes automatically.

If your site is hosted somewhere else, whoever set it up can run the sync with a
single command (`node sync.mjs`).

### Confirm it worked

Open the website and scroll to **Available homes**. Check that the units look right,
and look at the small line at the bottom of that section — it reads
"Availability last synced …" and should show a recent time.

---

## What updates automatically vs. what needs an edit

**Updates automatically from your feed (no action in the website):**
which homes are available, rent amounts, availability dates, unit photos, the video
tour, "Apply" links, the number of homes available, and the "starting rent" figure.

**Lives in the website and needs an edit to change:**
the marketing headline and neighborhood copy, the amenities/features lists, the
monthly-fees table, the contact phone numbers, email, and address, the colors, and
the logo.

---

## Editing site content (non-listing text)

`index.html` **is** the website — a single file. It's safe to edit if you're careful,
but always keep a backup copy of the current `index.html` before making changes so
you can restore it if something looks off. If you'd rather not edit it yourself, send
it to your developer (or back to me) with what you want changed.

To find something to edit, open `index.html` in a text editor and use Find (Ctrl/Cmd-F):

- **Phone / email** — search for `275-5741`, `538-7635`, or `info@cprealty.co`
- **Marketing headline** — search for `A quieter kind`
- **Neighborhood description** — search for `Settle into Graham`
- **Monthly fees table** — search for `Monthly Charge`
- **Amenities lists** — search for `In Your Home`
- **Address shown on the site** — search for `East Harden Street`

A note on the **contact form**: when a visitor submits it, it opens *their* email app
with a message addressed to `info@cprealty.co`. There's no separate inbox to monitor —
inquiries arrive as normal emails to that address. If you'd prefer a hosted form that
collects submissions automatically, that's an easy change to request.

---

## Photos and the video tour

- **Photos** come directly from your listing feed. To change a unit's photos, update
  them at the source; the website picks up the new ones on the next sync.
- **The video tour** is embedded from BombBomb and is the same walkthrough across the
  units. It can optionally be "self-hosted" (served from your own site instead of
  BombBomb) so it loads faster and never breaks if the BombBomb link changes — ask
  your developer if you'd like that.

---

## Where the site lives and how updates go live

The website is a set of simple files (`index.html`, `units.json`, and the `assets/`
folder). It's hosted on a static web host — commonly GitHub Pages, Netlify, Vercel, or
Cloudflare Pages. When the sync updates the data (or you edit content and save it),
the host republishes the site automatically within a minute or two.

If you're not sure where the site is hosted or who set it up, check with your web
person — that's the account you'd log into to change the domain or hosting.

---

## What's in this package

| File | What it is |
| --- | --- |
| `index.html` | The website itself (one self-contained file). |
| `units.json` | The current vacancy data. Created automatically by the sync — don't hand-edit it. |
| `sync.mjs` | The small program that reads your live feed and updates the site. |
| `.github/workflows/sync.yml` | The schedule that runs the sync automatically. |
| `assets/` | The logo image files (emblem, favicon, full logo). |
| `README.md` | This guide. |

---

## Troubleshooting

**A leased home still shows, or a new vacancy is missing.**
Make sure the change was made at the source (your management portal / the
`pm.cprealty.co` feed). Then run a manual sync to update immediately — otherwise the
automatic sync will catch it within 6 hours.

**The "Available homes" section looks empty.**
This is a safety feature: if the website ever can't read your feed, it keeps showing
the last known list rather than showing nothing. Check that your listings feed is
online, then run a manual sync.

**The "last synced" time is old.**
The automatic job may not have run recently. Run a manual sync, and have your
developer confirm the scheduled action is switched on.

**The site looks broken after an edit.**
Restore your backup copy of `index.html` (the last version that worked) and
re-publish. When in doubt, send the file to your developer or back to me.

**The video tour won't play.**
The BombBomb link may have changed. Ask your developer to update it, or to self-host
the video so it no longer depends on BombBomb.

---

## Changing how often the site syncs

It's set to every 6 hours by default. This can be changed (for example, to once a day
or every hour) in `.github/workflows/sync.yml`. Your developer can adjust it in a few
seconds.

---

## Getting help

Anything under "Editing site content," hosting changes, the sync schedule, or
self-hosting the video is quick for a developer to handle. You can also send the
website files back to me (Claude) describing what you'd like changed, and I can make
the update and hand the files back ready to publish.

**Property contacts referenced on the site:**
Leasing office (919) 275-5741 · Maintenance (984) 538-7635 · info@cprealty.co ·
508–512 E. Harden St, Graham, NC 27253.

---

## Technical reference (for developers)

A static marketing site whose vacancy data is produced by a scheduled scraper.

**Requirements:** Node 18+ (uses global `fetch`). No dependencies.

**Commands:**
```bash
node sync.mjs             # fetch the live feed → rewrite units.json + refresh the in-page snapshot
node sync.mjs --selftest  # run the parser against a built-in fixture (no network)
```

**How it works.** The listing site blocks cross-origin browser requests, so the page
can't scrape it live. Instead, `sync.mjs` runs server-side (GitHub Actions), fetches
`https://pm.cprealty.co/rentals?q=Harden`, discovers each Harden unit slug, opens each
listing, and parses rent, beds/baths, sq ft, availability date, photos, the video
tour, and the apply link. It writes `units.json` and rewrites the snapshot embedded in
`index.html` between the `/*FEED_START*/` … `/*FEED_END*/` markers.

At runtime `index.html` fetches `units.json` (same-origin) and rebuilds the
availability cards, gallery, counts, and starting rent. If that fetch fails (opened
from disk, offline, or not yet deployed), it falls back to the embedded snapshot, so
the page always renders.

**Safety.** If the sync discovers zero listings or parses zero units (source down or
markup changed), it writes nothing and exits non-zero — a bad scrape never wipes a
working page. The parser targets the current structure of the CP Realty listing pages;
if that site is redesigned, the regexes in `sync.mjs` may need a small update. The
`--selftest` and the zero-result guard make such a break fail safely rather than
silently.

**Automation.** `.github/workflows/sync.yml` runs on a `cron` schedule (default
`0 */6 * * *`, i.e. every 6 hours) and on manual dispatch, commits any changes to
`units.json` / `index.html`, and — when the repo is deployed via a static host that
redeploys on push — triggers a fresh deploy.

**Deploy.** Any static host works; keep `index.html` and `units.json` in the same
folder so the page can fetch the data. No build step, no server code.
