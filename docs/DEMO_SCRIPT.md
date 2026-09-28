# Fork — demo video script (under 2 minutes)

Record on your own computer or phone, where RevenueCat is reachable, so the paywall shows the **real price** from the current offering. Use a fresh browser profile or incognito window, so onboarding shows and you start as a free user.

**Setup (web):** `npm install && npm run web`. Open DevTools (F12) → device toolbar (Ctrl/Cmd+Shift+M) → iPhone 14 Pro. Record the browser window (macOS: Cmd+Shift+5; Windows: Win+G or OBS).
**Automated alternative:** `LIVE=1 node scripts/record-demo.mjs` (see `FINAL_RELEASE.md`). It records the same flow with captions and cuts out the AI wait.

| Time | On screen | Voice-over |
|---|---|---|
| 0:00–0:08 | Onboarding: the fork draws itself | “What if AI didn’t tell you what to choose — but let you explore what each choice changes? This is Fork.” |
| 0:08–0:18 | Skip → Home. Type *“Should I buy a new laptop now or keep my current one for another year?”* in **What’s on your mind?** → **Build my paths** | “I describe a decision in my own words.” |
| 0:18–0:30 | Analysis: the fork grows while the stages advance (cut the wait in editing) → “Your fork is ready.” | “Fork maps it into genuinely different paths.” |
| 0:30–0:50 | The fork draws itself. **Tap branch B**: it glows, the others recede, and the preview card appears → **Explore this path** | “Each branch is a real option. Tap one and you see what it costs, how risky it is, how flexible it keeps you.” |
| 0:50–1:10 | Scroll the path: what changes immediately → **Weigh it up** (upside, tradeoffs, what could go wrong) → **What this path rests on** | “Every path shows its tradeoffs, what could go wrong, and exactly what it assumes. No fake percentages.” |
| 1:10–1:25 | **Compare** → toggle *Time* → point at **Biggest difference** | “I compare on what matters to me. The biggest difference is flagged. Fork never scores or picks a winner.” |
| 1:25–1:38 | **Choose a path** → pick a path → type a note → **Keep this decision** → **Go to my decisions** | “The decision stays mine, with a note to future me, saved in my journal.” |
| 1:38–1:52 | Back to Home → **Fork Pro** card → paywall with the real monthly price → tap **Continue with Fork Pro** → RevenueCat Test Store purchase → **PRO** badge | “Fork Pro, powered by RevenueCat, unlocks unlimited explorations, deeper paths and every comparison. It’s one subscription entitlement.” |
| 1:52–2:00 | Home with the PRO badge, or the fork | “Fork doesn’t decide for you. It helps you see what your decision changes.” |

Tips: keep each screen still for a beat after a tap, and trim the AI wait in editing (say “edited for time” in the caption). Don’t show API keys or dashboards.
