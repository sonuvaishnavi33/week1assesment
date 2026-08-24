# ML Concepts Assessment — deployment guide

This package gives you a full 30-question assessment (20 MCQ + 10 coding, run in Colab)
that you can deploy for free on **GitHub Pages**, with submissions graded and stored
automatically in a **Google Sheet** via a free **Google Apps Script** backend.

Files in this package:
- `index.html` — the assessment page (student info → fullscreen exam → submission)
- `Code.gs` — the backend that grades answers and logs them to a spreadsheet
- `coding_questions.ipynb` — the Colab notebook students run to get their coding answers

Nothing here needs a paid server — GitHub Pages hosts the static page, and Apps Script
(free with any Google account) acts as the grading + storage backend.

---

## Step 1 — Set up the grading backend (Google Sheets + Apps Script)

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet.
   Name it something like `ML Assessment — Responses`.
2. In the sheet, go to **Extensions → Apps Script**.
3. Delete the placeholder code in `Code.gs` and paste in the contents of the `Code.gs`
   file from this package.
4. Click **Deploy → New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**, authorize the script when prompted (it needs permission to write to
   the sheet), and copy the **Web app URL** it gives you — it looks like
   `https://script.google.com/macros/s/AKfycb.../exec`.
6. The first submission will auto-create a `Submissions` tab with all the columns
   (name, USN, email, timing, tab-switch/fullscreen counts, and scores).

**If you ever change the questions or answers:** edit `MCQ_KEY` and `CODING_KEY` at the
top of `Code.gs`, then **Deploy → Manage deployments → Edit → New version → Deploy**
again (editing the code alone doesn't update a live deployment).

---

## Step 2 — Point the page at your backend

Open `index.html` and edit the two lines near the top of the `<script>` block:

```js
const APPS_SCRIPT_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
const COLAB_NOTEBOOK_URL = "https://colab.research.google.com/github/YOUR_GITHUB_USERNAME/YOUR_REPO/blob/main/coding_questions.ipynb";
```

Replace `APPS_SCRIPT_URL` with the URL from Step 1, and `COLAB_NOTEBOOK_URL` once you know
your GitHub username/repo name (Step 3 tells you how that link is formed — Colab can open
any notebook straight from a public GitHub repo at that URL pattern).

---

## Step 3 — Deploy on GitHub Pages

1. Create a new **public** GitHub repository (e.g. `ml-assessment`).
2. Upload `index.html` and `coding_questions.ipynb` to the repo root (drag-and-drop on
   github.com works, or `git add`/`commit`/`push` if you're using git locally).
3. Go to the repo's **Settings → Pages**.
   - Source: **Deploy from a branch**
   - Branch: **main**, folder: **/ (root)**
4. Save. GitHub gives you a live URL after a minute or two, typically:
   `https://YOUR_GITHUB_USERNAME.github.io/ml-assessment/`
5. Double check the `COLAB_NOTEBOOK_URL` in `index.html` now matches your actual repo path,
   commit the change, and it'll go live automatically.

Share the GitHub Pages URL with your students — that's the assessment link.

---

## How it works / what's enforced

- **Student info** (name, USN, email) is captured before the exam starts and travels with
  every submission.
- **Fullscreen** is requested when the exam starts. Leaving it is logged; a 3rd exit
  auto-submits and locks the page.
- **Tab switches** (`visibilitychange`) are counted separately and logged, but don't lock
  the exam on their own — only fullscreen exits do, matching what you described.
- **Copy/paste/right-click** are blocked on the exam screen.
- **Grading happens server-side** in Apps Script — the answer key is never sent to the
  browser, so it can't be read from page source.
- **One submission per USN** — the backend rejects a second submission with the same USN
  (matched case-insensitively).
- Each row in the `Submissions` sheet has: timestamp, name, USN, email, start/end time,
  duration, tab-switch count, fullscreen-exit count, MCQ score, coding score, total score,
  and the raw answers (useful if you want to spot-check partial credit later).

## Known limitations (be upfront with students/faculty about these)

- This is **client-side proctoring** on a static page — a determined student could defeat
  fullscreen/copy-paste blocks with browser devtools. It deters casual copying, it is not
  exam-grade lockdown software.
- The coding-question tolerances in `Code.gs` assume the same scikit-learn defaults
  Colab currently ships with. If Colab's sklearn version changes significantly in the
  future, results for the ensemble-method questions (RF/AdaBoost) could drift slightly —
  re-run `coding_questions.ipynb` yourself if a lot of students report "close but wrong"
  answers, and adjust the tolerance or expected value in `Code.gs` accordingly.
