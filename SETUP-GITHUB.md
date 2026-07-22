# Setting up the Harden Crossings site on GitHub

This hosts the website for free on **GitHub Pages** and runs the vacancy **auto-sync**
on **GitHub Actions**. You can do the whole thing in a web browser — no command line.

Time: about 15 minutes. You'll need a free GitHub account (github.com).

---

## Step 1 — Create the repository

1. Sign in at github.com, click the **+** (top right) → **New repository**.
2. **Repository name:** something like `harden-crossings-site`.
3. Set it to **Public**. (Free GitHub Pages hosting from a branch requires a public
   repository. That's fine here — it's a marketing site with no passwords or secrets.)
4. Leave everything else unchecked and click **Create repository**.

---

## Step 2 — Upload the website files

On the new empty repository page:

1. Click **uploading an existing file** (or **Add file → Upload files**).
2. Drag in these items from your `harden-apartments` folder: `index.html`,
   `units.json`, `sync.mjs`, `README.md`, `.nojekyll`, and the whole `assets` folder.
3. Click **Commit changes**.

Then add the auto-sync workflow (this one lives in a hidden folder, so create it
directly to be safe):

4. Click **Add file → Create new file**.
5. In the filename box, type exactly: `.github/workflows/sync.yml`
   (typing the slashes creates the folders automatically).
6. Open the `sync.yml` from your package, copy everything, and paste it in.
7. Click **Commit changes**.

---

## Step 3 — Turn on hosting (GitHub Pages)

1. In the repository, click **Settings** (top tab) → **Pages** (left sidebar, under
   "Code and automation").
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Under **Branch**, choose **main** and folder **/ (root)**, then click **Save**.
4. Wait a few minutes, then refresh. A banner shows your live address:
   `https://<your-username>.github.io/harden-crossings-site/`
   (The first publish can take up to ~10 minutes.)

---

## Step 4 — Allow the auto-sync to update the site

1. Click the **Actions** tab. If prompted to enable workflows, click to enable them.
2. Go to **Settings → Actions → General**. Scroll to **Workflow permissions**, select
   **Read and write permissions**, and **Save**. (This lets the sync save updated
   listings back to the site.)
3. Test it now: **Actions** tab → **Sync Harden vacancies** (left) → **Run workflow**
   → **Run workflow**. After about a minute it updates the data, and Pages
   republishes the site shortly after.

From now on it runs automatically every 6 hours. Whenever you change a listing at the
source, it flows onto the site on the next run — or immediately if you click
**Run workflow** again (see the README).

---

## Step 5 — (Optional) Use your own web address

To use a domain like `hardencrossings.com` instead of the github.io address:

1. **Settings → Pages → Custom domain**, type your domain, click **Save**.
2. At your domain registrar (wherever the domain was purchased), add the DNS records
   GitHub shows you — typically a `CNAME` pointing to `<your-username>.github.io`, or
   `A` records for an apex domain. GitHub then turns on HTTPS automatically.

If you'd like, send me the domain and registrar and I'll give you the exact records.

---

## Verify everything works

Open your site's address and scroll to **Available homes**. You should see the current
units and, at the bottom of that section, a recent "Availability last synced …" time.

---

## Troubleshooting

**"Deploy from a branch" is greyed out.** The repository must be **Public** for free
Pages. Change it under **Settings → General → Change repository visibility**.

**The sync fails with a permissions error.** Set **Read and write permissions** under
**Settings → Actions → General → Workflow permissions** (Step 4.2).

**The site shows 404 right after enabling Pages.** Give it up to ~10 minutes for the
first build, then refresh.

**The scheduled sync seems to stop running.** GitHub can pause scheduled jobs on a
repository that's been inactive for a long time. The sync's own updates normally count
as activity and keep it running; if it ever pauses, opening **Actions** and clicking
**Run workflow** wakes it back up.

**A change isn't showing.** Confirm it was made at the source (your management portal /
the `pm.cprealty.co` feed), then run a manual sync. Automatic sync catches it within
6 hours.

---

## How the pieces fit together

- **GitHub Pages** serves `index.html` at your public address.
- **GitHub Actions** runs `sync.mjs` on a schedule; it reads your live feed, rewrites
  `units.json` and the snapshot inside `index.html`, and commits the changes.
- Each of those commits makes **Pages** republish, so the live site stays current with
  no manual work.
