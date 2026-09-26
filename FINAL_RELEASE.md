# Fork — final release checklist

Everything that could be done without your accounts is done. These are the remaining steps that need **your** login, keys or verification, in order of priority. Each one says exactly where to go and what to paste.

Legend: ⏱ time needed · 🔑 needs your account

---

## 1. Turn on live AI (⏱ 5 min, 🔑 Anthropic + Supabase)

The `analyze-decision` edge function is **already deployed** to your Supabase project **“Testing”** (`gwruqdpbugqjrkyfvipa`). It answers `not_configured` until it has a model key.

1. Get an API key at <https://console.anthropic.com> → **API keys** (add a few dollars of credit).
2. Open <https://supabase.com/dashboard/project/gwruqdpbugqjrkyfvipa/functions/secrets>.
3. Add a secret: name `ANTHROPIC_API_KEY`, value `sk-ant-…`. Save.
4. Test it from your own terminal:
   ```bash
   curl -X POST https://gwruqdpbugqjrkyfvipa.supabase.co/functions/v1/analyze-decision \
     -H "Authorization: Bearer <anon key from .env / eas.json>" -H "Content-Type: application/json" \
     -d '{"description":"Should I buy a new laptop now or wait a year?"}'
   ```
   You should get `{"analysis": {...}}` back within about 30–60s.

## 2. Turn on RevenueCat (⏱ 10 min, 🔑 RevenueCat)

1. Sign up or sign in at <https://app.revenuecat.com> and create a project called **Fork**.
2. **Apps & providers → Test Store** (it’s added automatically for new projects).
3. **Product catalog → Products → + New** in the Test Store: identifier `fork_pro_monthly`, subscription, 1 month, price e.g. $4.99.
4. **Entitlements → + New**: identifier **`fork_pro`**, then attach `fork_pro_monthly`.
5. **Offerings → + New**: identifier `default`, mark it **Current**, add a package of type **Monthly** containing `fork_pro_monthly`.
6. **Project settings → API keys:** copy the **Test Store** public key (`test_…`).
7. In the repo, add to `.env`:
   ```
   EXPO_PUBLIC_REVENUECAT_TEST_KEY=test_...
   ```
   and add the same line to `eas.json` → `build.base.env` (it’s a public key).
8. Run `npm run web`, open Settings. It should say *Billing: RevenueCat Test Store*. Open the paywall and tap **Start Fork Pro**. RevenueCat’s Test Store purchase sheet appears. Complete it and Pro unlocks (sub-branches on the fork, extra comparison dimensions, no limits).

## 3. Re-record the demo with live AI and a real Test Store purchase (⏱ 5 min)

```bash
npm run build:web
node scripts/serve-dist.mjs &                         # serves on :8081
npm i --no-save playwright && npx playwright install chromium   # once
LIVE=1 node scripts/record-demo.mjs                   # needs ffmpeg on PATH
```
This overwrites `docs/demo/fork-demo.mp4`. For a voiced version, record your screen while following `docs/DEMO_SCRIPT.md`.

## 4. Upload the video (⏱ 5 min, 🔑 YouTube)

Upload `docs/demo/fork-demo.mp4` to YouTube (Unlisted is fine). Title: *Fork — explore the paths behind difficult decisions (RevenueCat Shipaton 2026)*. Copy the link.

## 5. Submit on Devpost (⏱ 15 min, 🔑 Devpost with your student email)

1. Make sure your Devpost profile uses your **student email** and you meet the Next Gen eligibility rules. Don’t add non-student teammates to the official team if you’re entering Next Gen.
2. Go to the RevenueCat Shipaton 2026 page → **Enter a submission / Create project**.
3. Paste the fields from [`DEVPOST.md`](DEVPOST.md): name, tagline, description, “Built with”.
4. Links: repo `https://github.com/Nailer/fork` and your YouTube URL.
5. Upload the screenshots listed in `DEVPOST.md`.
6. In the categories and awards questions, select **Next Gen** and **RevenueCat Design Award**, and mention them in the description too (already included).
7. **Save**, preview, then press **Submit**. Check that the project page says *Submitted*, not *Draft*.

## 6. (Optional) Native builds and stores (🔑 Expo, Apple, Google)

The Next Gen track doesn’t require a store release. If you want installable builds:

```bash
npx eas-cli@latest login
npx eas-cli@latest init                 # links the project, sets EAS_PROJECT_ID
npx eas-cli@latest build --profile preview --platform android    # installable APK
npx eas-cli@latest build --profile development --platform ios    # needs an Apple account
```
For store releases: set `APP_BUNDLE_ID` if you want a different id (default `io.github.nailer.fork`), add the App Store / Play apps in RevenueCat with real products attached to `fork_pro`, set `EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `_ANDROID_KEY`, then:
```bash
npx eas-cli@latest build --profile production --platform ios
npx eas-cli@latest submit --platform ios
```

## Status at hand-off

| Item | Status |
|---|---|
| App (iOS/Android/web code) | ✅ Built, typechecked, linted, 52 tests passing |
| Web build (`npm run build:web`) | ✅ Exports cleanly, full flow walked in Chromium with no console errors |
| AI proxy | ✅ Deployed to Supabase; ⏳ waiting for `ANTHROPIC_API_KEY` |
| RevenueCat | ✅ Integrated; ⏳ waiting for a `test_` key and dashboard products |
| Demo video | ✅ `docs/demo/fork-demo.mp4` (sample decision); ⏳ re-record with live AI and Pro |
| Screenshots, README, license, Devpost copy | ✅ |
| Native store builds | ⏳ Optional; need your Expo, Apple and Google accounts |
