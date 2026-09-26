// Records the Fork demo video: captions on the left, the real app (web build)
// running inside a phone frame on the right, captured frame-by-frame at 1080p.
//
//   npm run build:web && node scripts/serve-dist.mjs &      # app on :8081
//   FFMPEG=/path/to/ffmpeg node scripts/record-demo.mjs      # -> docs/demo/fork-demo.mp4
//
// Env:
//   LIVE=1       type a decision and generate it live (needs the AI proxy configured)
//   APP_URL      default http://localhost:8081
//   PLAYWRIGHT   path to playwright's index.mjs if it isn't resolvable
//   FFMPEG       ffmpeg binary (default: ffmpeg on PATH)
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright');
const APP = process.env.APP_URL ?? 'http://localhost:8081';
const LIVE = process.env.LIVE === '1';
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';
const root = process.cwd();
const outDir = join(root, 'docs', 'demo');
const frameDir = join(outDir, '.frames');
rmSync(frameDir, { recursive: true, force: true });
mkdirSync(frameDir, { recursive: true });

// Reuse the app's own font files from the web export so the stage matches the product.
const fontDir = readdirSync(join(root, 'dist/assets/node_modules/@expo-google-fonts/fraunces/600SemiBold'));
const fraunces = `/assets/node_modules/@expo-google-fonts/fraunces/600SemiBold/${fontDir.find((f) => f.endsWith('.ttf'))}`;
const interDir = readdirSync(join(root, 'dist/assets/node_modules/@expo-google-fonts/inter/500Medium'));
const inter = `/assets/node_modules/@expo-google-fonts/inter/500Medium/${interDir.find((f) => f.endsWith('.ttf'))}`;

const stage = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: F; src: url(${fraunces}); }
@font-face { font-family: I; src: url(${inter}); }
html,body { margin:0; width:1920px; height:1080px; background:#0A0B0F; overflow:hidden; color:#F3EFE6; }
body { background: radial-gradient(1200px 800px at 75% 40%, #151925 0%, #0A0B0F 70%); }
.left { position:absolute; left:150px; top:0; bottom:0; width:880px; display:flex; flex-direction:column; justify-content:center; }
.kicker { font-family:I; font-size:26px; letter-spacing:6px; text-transform:uppercase; color:#E9C46A; margin-bottom:28px; transition:opacity .5s; }
.cap { font-family:F; font-size:76px; line-height:1.08; letter-spacing:-1.5px; transition:opacity .45s, transform .45s; }
.sub { font-family:I; font-size:32px; line-height:1.45; color:#A9ADBA; margin-top:30px; transition:opacity .45s; max-width:820px; }
.hide { opacity:0; transform:translateY(12px); }
.phone { position:absolute; right:190px; top:50%; width:${390 * 1.12}px; height:${844 * 1.12}px; transform:translateY(-50%);
  border-radius:58px; padding:14px; background:#050608; box-shadow:0 0 0 2px #262A36, 0 40px 120px rgba(0,0,0,.6); }
.screen { width:390px; height:844px; transform:scale(1.12); transform-origin:0 0; border-radius:40px; overflow:hidden; background:#0A0B0F; }
iframe { width:390px; height:844px; border:0; display:block; }
.card { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#0A0B0F; transition:opacity .6s; z-index:5; text-align:center; }
.card .big { font-family:F; font-size:80px; line-height:1.12; max-width:1250px; letter-spacing:-1.5px; }
.card .small { font-family:I; font-size:30px; color:#A9ADBA; margin-top:36px; }
.gone { opacity:0; pointer-events:none; }
</style></head><body>
<div class="left"><div class="kicker" id="k">Fork</div><div class="cap" id="c"></div><div class="sub" id="s"></div></div>
<div class="phone"><div class="screen"><iframe id="app" src="${APP}/"></iframe></div></div>
<div class="card" id="card"><svg width="140" height="140" viewBox="0 0 64 64"><path d="M32 56 L32 34" stroke="#F3EFE6" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M32 34 C32 24 18 22 16 10" stroke="#F2B35B" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M32 34 C32 24 46 22 48 10" stroke="#6FD3C1" stroke-width="6" stroke-linecap="round" fill="none"/><circle cx="16" cy="10" r="4.6" fill="#F2B35B"/><circle cx="48" cy="10" r="4.6" fill="#6FD3C1"/></svg>
<div class="big" id="cb"></div><div class="small" id="cs"></div></div>
</body></html>`;
// Serve the stage from the app origin so fonts and the iframe share it.
writeFileSync(join(root, 'dist', 'stage.html'), stage);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const cdp = await context.newCDPSession(page);
const frames = [];
cdp.on('Page.screencastFrame', async ({ data, sessionId, metadata }) => {
  frames.push({ data, t: metadata.timestamp });
  await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});

await page.goto(`${APP}/stage.html`);
const app = page.frameLocator('#app');
const wait = (ms) => page.waitForTimeout(ms);
const caption = async (kicker, text, sub = '') => {
  await page.evaluate(() => ['k', 'c', 's'].forEach((id) => document.getElementById(id).classList.add('hide')));
  await wait(450);
  await page.evaluate(
    ([k, c, s]) => {
      document.getElementById('k').textContent = k;
      document.getElementById('c').textContent = c;
      document.getElementById('s').textContent = s;
      ['k', 'c', 's'].forEach((id) => document.getElementById(id).classList.remove('hide'));
    },
    [kicker, text, sub],
  );
};
const card = (big, small) =>
  page.evaluate(
    ([b, s]) => {
      document.getElementById('cb').textContent = b;
      document.getElementById('cs').textContent = s;
      document.getElementById('card').classList.remove('gone');
    },
    [big, small],
  );
const hideCard = () => page.evaluate(() => document.getElementById('card').classList.add('gone'));
const scroll = async (dy, steps = 18) => {
  const box = await page.locator('#app').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, dy / steps);
    await wait(28);
  }
};

await card('What if AI didn’t tell you what to choose — but let you explore what each choice changes?', '');
await wait(1200);
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, everyNthFrame: 1 });
await wait(4600);

await caption('Meet Fork', 'Every choice creates a different path.', 'An AI decision explorer that never picks for you.');
await hideCard();
await wait(3200);
await app.getByText('Skip').first().click();
await wait(900);

await caption('1 · Describe it', 'Say what you’re deciding, in your own words.', 'A sentence or two is enough. Context is optional.');
await app.getByLabel('Explore a decision').click();
await wait(700);
const question = 'Should I buy a new laptop now or keep my current one for another year?';
await app.getByLabel('Describe your decision').last().pressSequentially(question, { delay: 28 });
await wait(900);

if (LIVE) {
  await caption('2 · Fork builds your paths', 'Claude maps the decision into materially different paths.', 'Structured output, validated before anything renders.');
  await app.getByLabel('Build my paths').last().click();
  await app.getByText('Tap a path to explore').last().waitFor({ timeout: 120000 });
} else {
  await caption('2 · See the paths', 'Fork maps the decision into distinct paths.', 'Shown here: Fork’s bundled sample for this exact question.');
  await app.getByLabel('Go back').last().click();
  await wait(500);
  await app.getByLabel(/See an example fork/).last().click();
}
await wait(4600);

await caption('3 · Explore a path', 'Open any path to see what it changes.', 'Upside, tradeoffs, what could go wrong — and what it assumes.');
await app.getByLabel(/^Path A: .*Open details\.$/).last().click();
await wait(1500);
await scroll(900, 30);
await wait(1200);
await scroll(1100, 30);
await wait(1800);

await caption('4 · Compare', 'Compare paths on what matters to you.', 'Qualitative, grounded in assumptions. No scores. No verdicts.');
await app.getByLabel('Compare').last().click();
await wait(1400);
await app.getByLabel('Time', { exact: true }).last().click();
await wait(700);
await scroll(700, 24);
await wait(2400);

await caption('5 · You choose', 'Fork keeps the decision yours.', 'Pick the path you lean toward and note why — for future you.');
await app.getByLabel('Choose a path').last().click();
await wait(1000);
await scroll(1600, 40);
await wait(600);
await app.getByLabel(/^Path C:/).last().click();
await wait(500);
await app.getByLabel("Why I'm choosing this").last().pressSequentially('Cheapest way to find out if it’s hardware or software.', { delay: 22 });
await wait(600);
await app.getByLabel(/Keep this decision|Update decision/).last().click();
await wait(2000);
await app.getByLabel('Go to my decisions').last().click();
await wait(2400);

await caption('Fork Pro · powered by RevenueCat', 'Go deeper when a decision deserves it.', 'Unlimited decisions, full history, richer paths and comparisons — one subscription entitlement: fork_pro.');
await app.getByLabel('Go back').last().click();
await wait(700);
await app.getByLabel(/free explorations left this week|Fork Pro\./).last().click();
await wait(5200);

await card('Fork', 'Don’t ask what to choose. Explore what each choice changes.\ngithub.com/Nailer/fork · Built for RevenueCat Shipaton 2026');
await page.evaluate(() => (document.getElementById('cs').style.whiteSpace = 'pre-line'));
await wait(4000);
const stoppedAt = Date.now() / 1000; // screencast timestamps are epoch seconds
await cdp.send('Page.stopScreencast');
await browser.close();

// Assemble variable-timestamp frames into a constant 30fps H.264 video.
let list = '';
frames.forEach((f, i) => {
  const file = join(frameDir, `${String(i).padStart(5, '0')}.jpg`);
  writeFileSync(file, Buffer.from(f.data, 'base64'));
  // Frames only arrive when pixels change, so the last one holds until recording stopped.
  const next = frames[i + 1]?.t ?? Math.max(stoppedAt, f.t + 0.5);
  list += `file '${file}'\nduration ${Math.max(0.001, next - f.t).toFixed(4)}\n`;
});
list += `file '${join(frameDir, `${String(frames.length - 1).padStart(5, '0')}.jpg`)}'\n`;
writeFileSync(join(frameDir, 'list.txt'), list);
const out = join(outDir, 'fork-demo.mp4');
execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', join(frameDir, 'list.txt'),
  '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-movflags', '+faststart', out]);
rmSync(frameDir, { recursive: true, force: true });
const seconds = frames.length ? Math.max(stoppedAt, frames[frames.length - 1].t) - frames[0].t : 0;
console.log(`Wrote ${out} (${seconds.toFixed(1)}s, ${frames.length} frames)`);
