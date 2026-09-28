# Fork — what’s left before submitting (Next Gen)

Deadline: **September 30, 2026, 11:45 PM PDT**. No App Store or Play Store release is needed for Next Gen: a public open-source repo plus a demo video is enough.

## Already done
- App redesigned, typechecked, linted, 52 tests passing; every screen checked visually at phone size.
- Live AI backend (Supabase Edge Function `analyze-decision`) deployed with clear error handling.
- RevenueCat Test Store key and public AI endpoint built in, so `npm install && npm run web` works with no `.env`.
- Public repo with MIT license, README, screenshots, and Devpost copy (`DEVPOST.md`).
- A GitHub Actions workflow that tests the app and publishes the web build to GitHub Pages.

## 1. Make “Build my paths” work (5 min)
Run the app (`npm run web`), type a decision and press **Build my paths**.
- **It works:** great, move on.
- **You see “Fork’s AI is unavailable right now”:** your Anthropic account needs credit. Go to console.anthropic.com → **Billing** and add $5–10, then try again.
- **Any other error:** tell Claude “check the logs”. The function now records Anthropic’s exact error reason.

## 2. Check RevenueCat (5 min)
The dashboard needs: product `fork_pro_monthly` (Test Store) → entitlement `fork_pro` → offering marked **Current** with a **Monthly** package.
In the app: Home → **Fork Pro** card. You should see your monthly price. Tap **Continue with Fork Pro**, complete the Test Store purchase, and a **PRO** badge appears.

## 3. Record the demo video (under 2 minutes)
Follow `docs/DEMO_SCRIPT.md`. Easiest option: record Chrome in phone view with your voice.
Automated option (captions, cuts out the AI wait):
```bash
npm run build:web
node scripts/serve-dist.mjs            # keep this terminal open
# in a second terminal:
npm i --no-save playwright && npx playwright install chromium
LIVE=1 node scripts/record-demo.mjs    # needs ffmpeg installed; writes docs/demo/fork-demo.mp4
```
(Windows PowerShell: `$env:LIVE="1"; node scripts/record-demo.mjs`)

## 4. Take one paywall screenshot
With RevenueCat working, open the paywall and screenshot it. Upload it with the others on Devpost.

## 5. Upload the video to YouTube
Visibility **Unlisted** or **Public**, not Private.

## 6. Submit on Devpost
Use your **student email** account. Paste from `DEVPOST.md`, fill in the **[YOU]** items, add the repo link, the YouTube link and the screenshots, select **Next Gen**, then press **Submit**. Check that the project page says **Submitted**, not *Draft*.

## Optional
- **Live web link for judges:** GitHub repo → Settings → Pages → Source: **GitHub Actions** (if the workflow couldn’t turn it on automatically). The link is then `https://nailer.github.io/fork/`.
- **Native builds:** not needed for Next Gen. See the EAS commands in the README.
