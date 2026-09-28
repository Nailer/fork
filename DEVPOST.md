# Fork — Devpost submission (Next Gen track)

Paste-ready answers for the RevenueCat Shipaton 2026 Devpost form. Every claim matches the code in this repository. Items marked **[YOU]** need your own input.

---

## Quick fields

| Field | Answer |
|---|---|
| **Project name** | Fork |
| **Tagline** | Don’t ask what to choose. Explore what each choice changes. |
| **Track / award** | **Next Gen Award** (student). Optional extra: RevenueCat Design Award (select only if the form allows it without a store link). |
| **Platforms** | iOS & Android (Expo / React Native). Also runs on web for easy judging. |
| **Repository (public, MIT)** | https://github.com/Nailer/fork |
| **Demo video (< 2 min)** | **[YOU]** YouTube link (unlisted is fine) |
| **Try it** | `git clone https://github.com/Nailer/fork && cd fork && npm install && npm run web`. Works without any `.env`. |
| **Built with** | expo, react-native, typescript, expo-router, react-native-svg, revenuecat, react-native-purchases, claude, anthropic, supabase, deno, zod, zustand, jest, github-actions |

---

## Elevator pitch (short description)

Fork is an AI decision explorer. You describe a hard choice and Fork turns it into a branching map of 2–4 genuinely different paths. Each path shows what it changes, its tradeoffs, and what it assumes. You compare the paths on what matters to you, then **you** choose. Fork never picks for you and never pretends to predict the future.

---

## About the project

### Inspiration
When I’m stuck on a decision — buy now or wait, take the offer or stay — asking an AI chatbot gets me a verdict wrapped in a wall of text. It decides *for* me, sounds more certain than it should, and leaves me with a paragraph instead of a map. I wanted the opposite: an AI that structures the decision so I can see my options clearly, and then gets out of the way.

### What it does
**Describe → Analyze → Fork → Explore → Compare → Choose → Journal**

1. **Describe.** Type the decision in plain words. You can optionally add what matters most, a budget or a timeframe.
2. **Analyze.** The fork visibly grows while Claude structures the decision.
3. **Fork.** The decision appears as an animated tree. The root is your decision and each branch (A–D) is a path. Tap a branch: it thickens and pulses, the others recede, and a preview shows its cost, risk and flexibility.
4. **Explore.** Each path opens into scannable sections: what changes immediately (a timeline); upside, tradeoffs and what could go wrong; what the path *assumes*; how uncertain it is; what would change it; and questions worth answering.
5. **Compare.** A side-by-side matrix across the dimensions you pick (cost, time, flexibility, risk and more). Readings are qualitative (low, moderate or high, with a plain-language note), and the biggest difference is flagged. **No scores and no winner.**
6. **Choose.** Pick the path you lean toward, or “still deciding”, and add a note to your future self.
7. **Journal.** A private, on-device decision journal. Reopen a decision, see why you chose it, or explore it again.

For medical, legal or financial decisions, Fork adds a calm “worth talking to a professional” note.

### Why it isn’t “just ChatGPT”
- **A map, not a transcript.** The AI fills a strict schema that is validated before rendering, so the interface is a tree you can tap, not prose.
- **Honesty is built in.** Every path shows its assumptions and uncertainty, there are no invented percentages, and missing information is named.
- **Agency by design.** The model is instructed never to recommend or rank. The comparison sorts by *difference*, not by *quality*. The only “choose” button belongs to the user.
- **Memory.** The journal keeps the path you chose *and why*, so you can learn from your own decisions.

### How I built it
- **App:** Expo SDK 57, React Native 0.86, React 19, TypeScript and Expo Router. One codebase for iOS, Android and web.
- **Signature visual:** the fork tree is custom SVG (react-native-svg). Branches are drawn with animated stroke-dash offsets on a `requestAnimationFrame` clock, with gradients that flow from the trunk into each path’s colour, glowing nodes, and a selection halo on the native animation driver. Everything respects the OS “reduce motion” setting.
- **Design system:** my own tokens for colour, type scale, spacing, radii and elevation. Fraunces for display type, Inter for UI, original line icons, and an original app icon.
- **AI:** a **Supabase Edge Function** (Deno) proxies requests to **Claude** (`claude-opus-5`) using **structured outputs** with a JSON schema. It validates input, rate-limits, enforces a time budget under the platform limit, and re-validates the model’s output with **zod**. The app validates the result *again* with the same parser, which recovers JSON wrapped in prose or code fences, repairs harmless deviations, and rejects anything else. The model key never ships in the app.
- **State:** a small **zustand** store persisted to AsyncStorage. Decisions never leave the device, and Settings can delete everything.
- **Quality:** 52 **Jest** tests (schema validation, recovery from malformed AI output, usage limits, comparison logic, the AI client’s retry/timeout/offline/cancel paths, persistence, entitlement checks, purchase-error mapping, and app/server schema sync), plus strict TypeScript, ESLint with the React Compiler rules, and a GitHub Actions workflow that tests and deploys the web build.

### How RevenueCat powers Fork
RevenueCat runs Fork Pro’s subscription, entitlement, purchase and restore flow. That lets the app gate deeper exploration and unlimited history behind a real premium product.

- **Entitlement `fork_pro`,** unlocked by the product **`fork_pro_monthly`**, sold as the **Monthly** package in the **current offering**.
- **One service module** wraps `react-native-purchases`: configure, fetch offerings, purchase, restore, the entitlement check, the customer-info listener, and friendly handling of cancelled, pending and failed purchases.
- **A `SubscriptionProvider`** exposes `isPro` to the whole app. It refreshes when the app returns to the foreground and caches the last known entitlement so Pro users aren’t locked out offline.
- **The paywall shows the real price from RevenueCat,** a Free vs Pro table of features that genuinely exist, “Continue with Fork Pro”, “Restore purchases”, a visible close button and a renewal disclosure.
- **Upgrade moments appear where the value is:** the weekly limit, a full journal, a locked comparison dimension, or “see where each path could split next”.
- **Development uses RevenueCat’s Test Store** (a `test_` key) on web, Expo Go and dev builds. Production store keys (`appl_`, `goog_`) take over in store builds without code changes.

| | Free | Fork Pro |
|---|---|---|
| Explorations | 3 per rolling week | Unlimited |
| Paths per decision | Up to 3 | Up to 4 |
| Where each path could split next | — | Included |
| Comparison dimensions | 4 | All 8 |
| Decision journal | 5 decisions | Unlimited |

### Design (for the Design Award, if selected)
Look at these moments:
- **The fork drawing itself.** The trunk grows, branches extend in sequence, nodes bloom, then labels rise in.
- **Branch selection.** Tapping a node emphasises that branch with a pulsing halo, other branches recede, the backdrop tints to the path’s colour, and a preview card slides in.
- **Analysis.** Instead of a spinner, the fork keeps regrowing while honest stage labels advance. Only “Your fork is ready” is tied to the real result.
- **Compare.** Vertical three-step bars with the level in words, so meaning never relies on colour alone. The biggest difference is flagged.
- **Accessibility.** Screen-reader labels and roles, 44pt+ touch targets, reduced-motion support and dynamic type.

### Challenges I ran into
- **Making AI output trustworthy in a UI.** Free text breaks layouts and invites overconfidence. I moved to structured outputs, one zod schema shared by server and client, and a recovery layer tested against truncated, fenced and malformed responses.
- **Latency and platform limits.** Rich structured analysis can be slow. I found requests could outlive the edge function’s wall-clock limit because of stacked retries, so I rebuilt the function around a single time budget and made the client stop retrying after timeouts.
- **Making “no verdict” still useful.** Sorting comparisons by where paths differ most lets the decision surface without the app ever picking a winner.
- **One animation, three platforms.** Drawing SVG with dash offsets on a rAF clock keeps the signature animation identical on iOS, Android and web.

### Accomplishments I’m proud of
- A clear, complete loop from describe to journal, with real AI, real validation and a real subscription.
- Monetization that feels like part of the product, not a bolted-on screen.
- A visual identity built around one metaphor, branching paths, from the app icon to the loading state.

### What I learned
The most useful thing AI can do in a decision isn’t answering. It’s structuring the question so the person can answer it themselves. I also learned how much trust depends on showing assumptions and uncertainty.

### What’s next for Fork
- Server-side entitlement verification (RevenueCat REST API) before deep explorations
- Store builds with real App Store and Google Play products on the same `fork_pro` entitlement
- Journal sync across devices, reminders to revisit a decision, an annual plan, and localisation

---

## Likely form questions (answers ready)

**Which award(s) are you submitting for?**
Next Gen Award. **[YOU]** Add the RevenueCat Design Award only if the form lets you select it without a store link.

**Are you eligible for Next Gen?**
**[YOU]** Yes. I’m an active student, and my Devpost account uses my academic email **[school / email domain]**. *(If you’re under the age of majority where you live, you need a parent’s or guardian’s consent.)*

**How does your app use RevenueCat?**
RevenueCat powers the Fork Pro subscription. `react-native-purchases` fetches the current offering, purchases the Monthly package (`fork_pro_monthly`), restores purchases, and listens for the `fork_pro` entitlement. That entitlement unlocks unlimited explorations, up to four paths with sub-branches, all comparison dimensions and unlimited journal history. Development and the demo use RevenueCat’s Test Store.

**Link to your open-source repository and license?**
https://github.com/Nailer/fork — MIT License.

**Link to your demo video?**
**[YOU]** YouTube URL (under 2 minutes).

**What platforms does it run on?**
iOS and Android via Expo (Expo Go or a development build). It also runs on web, which is the easiest way for judges to try it.

**How can judges test it?**
`git clone https://github.com/Nailer/fork && cd fork && npm install && npm run web` (or `npx expo start`, then scan the QR code with Expo Go). No keys needed: live AI runs through the public edge function, and purchases use RevenueCat’s Test Store (no real money). Tap **See an example** for an offline sample.

**Did you use AI tools to build it?**
**[YOU]** Answer honestly for your process, for example: “I used Claude Code as a coding assistant for implementation, tests and documentation; product decisions, testing and the submission are mine.” In the app, Claude is the model behind decision analysis.

**Team members?**
**[YOU]** Solo, or list students only. A non-student official team member can make the project ineligible for Next Gen.

**Were you building in public?**
**[YOU]** Link any real posts (drafts are in `docs/BUILD_IN_PUBLIC.md`). Only claim what you actually posted.

**Anything else judges should know?**
The AI never recommends a choice; that’s deliberate. The sample decision is clearly labelled “Sample” and never presented as a live AI result.

---

## Screenshots to upload (in this order)
From `docs/screenshots/`: `05-fork-selected`, `04-fork`, `07-weigh-it-up`, `08-compare`, `03-analyzing`, `02-home`, `09-choose`, `10-journal`, `01-onboarding`, **plus one paywall screenshot you take yourself** (it needs RevenueCat reachable, so it shows the real price).
