# Fork — Devpost submission copy

Paste-ready text for the RevenueCat Shipaton 2026 Devpost form. Every claim below matches the code in this repo.

---

## Project name
Fork

## Tagline (≤ 60 chars)
Explore the paths behind difficult decisions.

## Elevator pitch (one line)
Fork is an AI decision explorer that turns a hard choice into a branching map of paths you can explore and compare. It never picks for you and never pretends to predict the future.

## Awards we’re targeting
- **Next Gen Award** (student builder)
- **RevenueCat Design Award**

---

## About the project (Description field)

### Inspiration
When you’re stuck on a decision (buy now or wait, take the offer or stay), asking an AI chatbot gives you a verdict wrapped in a wall of text. It decides *for* you, sounds more certain than it should, and leaves you with a paragraph instead of a map. We wanted the opposite: an AI that helps you **see** your options clearly and then gets out of the way.

### What it does
You describe a decision in a sentence or two. Fork:

1. **Maps it into 2–4 materially different paths**, drawn as an animated branching tree. Your decision sits at the root and each path is a branch (A, B, C…).
2. **Opens each path into structured cards**: what changes immediately, potential upside, tradeoffs, what could go wrong, what the path assumes, how uncertain it is, and what would change it.
3. **Lets you compare paths on what matters to you.** You pick the dimensions (cost, time, flexibility, risk…) and the rows where the paths differ most rise to the top. Readings are qualitative (low, moderate, high, with plain-language labels). There are no scores and no winner.
4. **Lets you choose.** You pick the path you lean toward, or “still deciding”, add a note to your future self, and keep it in a private decision journal you can reopen or explore again later.

For medical, legal or financial decisions, Fork adds a calm “worth talking to a professional” note.

### How it’s different from asking ChatGPT
- **A product, not a transcript.** The model fills a strict schema that is validated before rendering. The UI is a fork you can tap into, not prose.
- **Epistemic honesty is built in.** Every path shows its assumptions and uncertainty. There are no invented percentages, missing information is named, and outcomes are always framed as possibilities.
- **Agency by design.** The model is instructed never to recommend or rank. The only “choose” button belongs to you.

### How we built it
- **App:** Expo SDK 57, React Native 0.86, TypeScript and Expo Router. It runs on iOS, Android and web from one codebase.
- **Signature visual:** the fork is custom SVG. Branch drawing is animated with stroke-dash offsets via `requestAnimationFrame`, so it looks identical on every platform and respects reduced motion.
- **AI:** a Supabase Edge Function proxies requests to **Claude** (`claude-opus-5`) using **structured outputs** with a JSON schema. The function validates input, rate-limits, re-validates the output with zod and never exposes the API key to the app. The app validates the result *again* with the same parser. That parser recovers JSON from prose or code fences, repairs harmless deviations, retries once on malformed output, and otherwise shows a friendly error.
- **State and storage:** a small zustand store persisted to AsyncStorage. Decisions stay on the device, and users can delete everything from Settings.
- **Quality:** 52 Jest tests (schema, recovery from malformed output, limits, comparison logic, the AI client’s retry/timeout/offline/cancel paths, persistence, entitlement and purchase-error mapping, and edge/app schema sync), plus strict TypeScript and ESLint with the React Compiler rules.

### How RevenueCat powers Fork
**RevenueCat powers Fork Pro’s subscription entitlement and purchase flow. That lets the app gate deeper decision exploration and saved decision history behind a legitimate premium product.**

- One entitlement, **`fork_pro`**, attached to a monthly package in the current offering.
- A single service module wraps `react-native-purchases` for configure, offerings, purchase, restore, the entitlement check, the customer-info listener, and cancelled/pending/failed handling. A `SubscriptionProvider` exposes `isPro` to the whole app and refreshes when the app returns to the foreground.
- **Free:** 3 explorations per rolling week, 2–3 paths, 4 comparison dimensions, and up to 5 saved decisions.
- **Fork Pro:** unlimited explorations, up to 4 paths each showing *where that path could split next*, 4 more comparison dimensions (effort, upside, short- and long-term impact), and unlimited journal history.
- **Upgrade moments happen where the value is:** the weekly limit, a full journal, a locked comparison dimension, or “see where each path could split next”. The paywall is honest: a visible close button, “Not now”, “Restore purchases”, and no fake savings.
- **Test vs production:** RevenueCat’s **Test Store** (a `test_` key) powers the purchase flow on web, Expo Go and dev builds. Store keys (`appl_`, `goog_`) take over in production builds.

### Challenges we ran into
- **Keeping AI output trustworthy in a UI.** Free text breaks layouts and invites overconfidence. We moved to structured outputs, one shared zod schema on server and client, and a recovery layer tested against truncated, fenced and malformed responses.
- **Making “no verdict” still feel useful.** The comparison had to help without scoring. Sorting by *where the paths differ most* lets the decision surface without Fork ever picking a winner.
- **A cross-platform signature animation.** We drew the fork with SVG dash offsets on a rAF clock, so it renders the same on iOS, Android and web, including in the recorded demo.

### Accomplishments we’re proud of
- A clear core loop: describe → fork → explore → compare → choose → journal.
- Monetization that feels like part of the product, not a bolted-on screen.
- Accessibility basics throughout: labels and roles, large touch targets, reduced motion, and meaning never carried by colour alone.

### What we learned
That the most valuable thing an AI can do in a decision isn’t answering. It’s structuring the question so the person can answer it themselves.

### What’s next
A server-side entitlement check for deep explorations, journal sync across devices, reminders to revisit a decision, an annual plan, and localisation.

---

## Built with
expo, react-native, typescript, expo-router, react-native-svg, revenuecat, react-native-purchases, claude, anthropic, supabase, deno, zod, zustand, jest, eas

## Links
- **Source (MIT):** https://github.com/Nailer/fork
- **Demo video:** _upload `docs/demo/fork-demo.mp4` to YouTube (unlisted is fine) and paste the link here_
- **Try it:** clone the repo, run `npm install && npm run web`, then tap “See an example” on the home screen

## Screenshots to upload (in this order)
`docs/screenshots/02-fork.png`, `03-path.png`, `04-compare.png`, `05-choose.png`, `07-paywall.png`, `01-home.png`, `06-journal.png`, `00-onboarding.png`

## Architecture (image or text for the gallery)
See the Mermaid diagram in the README (“AI architecture”).
