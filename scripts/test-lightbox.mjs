// Measures the image zoom (lightbox): the enlarged image must be centred in the viewport within 1 px,
// and the page behind must not move when it opens. Esc, backdrop click and focus return are checked too.
// The close button: a true circle with a centred X, 12 px inside the frame's top-right corner, with an unclipped focus ring.
// Usage: node scripts/test-lightbox.mjs [baseUrl]   (default http://localhost:4322, e.g. `npm run preview`)
import { chromium } from 'playwright-core';

const BASE = process.argv[2] || 'http://localhost:4322';
const VIEWPORTS = [
	{ name: '1440x900', width: 1440, height: 900 },
	{ name: '390x844', width: 390, height: 844, isMobile: true, hasTouch: true },
];
const CASES = [
	{ name: 'landscape panel shot', page: 'using-klinos/reference/try-it-live', media: 'using-klinos/reference/try-it-live/1' },
	{ name: 'portrait image', page: 'using-klinos/studio/lighting', media: 'using-klinos/studio/lighting/4' },
	{ name: 'small image', page: 'using-klinos/panel/panel-cards', media: 'using-klinos/panel/panel-cards/4' },
	{ name: 'tall page, scrolled', page: 'using-klinos/playground/layouts', media: 'using-klinos/playground/layouts/2', scroll: true },
];

// Real scrollbars, as in a user's browser (headless hides them by default, which would skew the measurement:
// the page keeps a stable 8 px scrollbar gutter, and the visible area is clientWidth, not innerWidth).
const browser = await chromium.launch({ channel: 'msedge', ignoreDefaultArgs: ['--hide-scrollbars'] });
const rows = [];
let failed = 0;

for (const vp of VIEWPORTS) {
	for (const theme of ['light', 'dark']) {
		const ctx = await browser.newContext({
			viewport: { width: vp.width, height: vp.height },
			isMobile: !!vp.isMobile,
			hasTouch: !!vp.hasTouch,
		});
		if (theme === 'dark') await ctx.addInitScript(() => localStorage.setItem('starlight-theme', 'dark'));
		const page = await ctx.newPage();
		for (const c of CASES) {
			await page.goto(`${BASE}/${c.page}/`, { waitUntil: 'networkidle' });
			const btn = page.locator(`figure[data-media-id="${c.media}"] [data-zoom]`);
			if (c.scroll) await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
			await btn.scrollIntoViewIfNeeded();
			await page.waitForTimeout(300);
			// The visible page area: the window minus a classic scrollbar (clientWidth), read before the zoom opens.
			// (While it is open the page's overflow is hidden and Edge reports the full window width, but the
			// scrollbar gutter stays reserved, so the visible area does not change.)
			const before = await page.evaluate(() => ({ y: scrollY, vw: document.documentElement.clientWidth, left: document.querySelector('.main-frame, main')?.getBoundingClientRect().left ?? 0 }));
			await btn.click();
			await page.waitForFunction(() => {
				const i = document.querySelector('dialog.lightbox[open] img');
				return i && i.complete && i.naturalWidth > 0;
			});
			await page.waitForTimeout(150);
			const m = await page.evaluate((vw) => {
				const r = document.querySelector('dialog.lightbox img').getBoundingClientRect();
				const vh = innerHeight;
				return {
					dx: r.left + r.width / 2 - vw / 2,
					dy: r.top + r.height / 2 - vh / 2,
					w: Math.round(r.width),
					h: Math.round(r.height),
					inside: r.left >= 0 && r.top >= 0 && r.right <= vw + 0.5 && r.bottom <= vh + 0.5,
					y: scrollY,
					left: document.querySelector('.main-frame, main')?.getBoundingClientRect().left ?? 0,
					vw,
					windowDx: r.left + r.width / 2 - innerWidth / 2,
				};
			}, before.vw);
			const centred = Math.abs(m.dx) <= 1 && Math.abs(m.dy) <= 1;
			const still = m.y === before.y && Math.abs(m.left - before.left) <= 0.5;
			// Close with Esc, then reopen and close by clicking the backdrop corner.
			await page.keyboard.press('Escape');
			await page.waitForTimeout(150);
			const escClosed = await page.evaluate(() => !document.querySelector('dialog.lightbox').open);
			const focusBack = await page.evaluate(() => document.activeElement?.hasAttribute('data-zoom'));
			await btn.click();
			await page.waitForTimeout(150);
			await page.mouse.click(3, 3);
			await page.waitForTimeout(150);
			const backdropClosed = await page.evaluate(() => !document.querySelector('dialog.lightbox').open);
			const ok = centred && still && m.inside && escClosed && focusBack && backdropClosed;
			if (!ok) failed++;
			rows.push({
				viewport: vp.name,
				theme,
				case: c.name,
				'visible width': m.vw,
				'dx px': m.dx.toFixed(1),
				'dy px': m.dy.toFixed(1),
				size: `${m.w}x${m.h}`,
				'in view': m.inside ? 'yes' : 'NO',
				'page still': still ? 'yes' : 'NO',
				'esc/backdrop/focus': [escClosed, backdropClosed, focusBack].map((v) => (v ? 'ok' : 'NO')).join('/'),
				result: ok ? 'PASS' : 'FAIL',
			});
		}
		await ctx.close();
	}
}
// ---------- The close button ----------
// A true circle (36px with a mouse, 44px on touch); the X (its drawn pixels, from a screenshot) centred within
// 0.5 px; inside the frame, at least 12 px from each of its edges (12 px from top and right), and inside the
// viewport; never over a clip's controls; first focus inside the dialog, with aria-label "Close", and a focus
// ring (with its halo) that nothing clips. (Only still images open the lightbox; clips play in the page.)
const CLOSE_CASES = [{ ...CASES[0], name: 'live demo image' }, CASES[1]];
const closeRows = [];
for (const width of [1863, 1440, 980, 820, 390]) {
	for (const theme of ['light', 'dark']) {
		const touch = width < 700;
		const ctx = await browser.newContext({ viewport: { width, height: touch ? 844 : 900 }, isMobile: touch, hasTouch: touch });
		await ctx.addInitScript((t) => {
			localStorage.setItem('klinos-whatsnew-v3', 'seen');
			localStorage.setItem('starlight-theme', t);
		}, theme);
		const page = await ctx.newPage();
		for (const c of CLOSE_CASES) {
			await page.goto(`${BASE}/${c.page}/`, { waitUntil: 'networkidle' });
			const zoom = page.locator(`figure[data-media-id="${c.media}"] [data-zoom]`);
			await zoom.scrollIntoViewIfNeeded();
			// The visible width, read before the zoom opens (see above: while open, Edge reports the full window).
			const vw = await page.evaluate(() => document.documentElement.clientWidth);
			// Open from the keyboard, so the focus the dialog gives its first item shows the focus ring.
			await zoom.focus();
			await page.keyboard.press('Enter');
			await page.waitForTimeout(350);
			const box = await page.locator('.lightbox-close').boundingBox();
			const shot = await page.screenshot({ clip: box, scale: 'css' });
			const m = await page.evaluate(async ([b64, vw]) => {
				const btn = document.querySelector('.lightbox-close');
				const r = btn.getBoundingClientRect();
				// The X's drawn pixels: everything inside the circle (less its 1px border) that differs from the fill.
				const im = new Image();
				im.src = 'data:image/png;base64,' + b64;
				await im.decode();
				const cv = document.createElement('canvas');
				cv.width = im.width;
				cv.height = im.height;
				const g = cv.getContext('2d');
				g.drawImage(im, 0, 0);
				const d = g.getImageData(0, 0, cv.width, cv.height).data;
				const W = cv.width, H = cv.height;
				const lum = (i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
				const fill = lum((Math.round(H / 2) * W + Math.round(W * 0.12)) * 4);
				const rin = Math.min(W, H) / 2 - 3;
				let x0 = W, x1 = -1, y0 = H, y1 = -1;
				for (let y = 0; y < H; y++)
					for (let x = 0; x < W; x++) {
						const dx = x + 0.5 - W / 2, dy = y + 0.5 - H / 2;
						if (dx * dx + dy * dy > rin * rin || Math.abs(lum((y * W + x) * 4) - fill) <= 60) continue;
						x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
					}
				const frame = document.querySelector('dialog.lightbox').getBoundingClientRect();
				// A clip's controls (pause, time), if the lightbox ever shows one.
				const controls = [...document.querySelectorAll('dialog.lightbox [data-media-toggle], dialog.lightbox .clip-time, dialog.lightbox video')].map((e) => e.getBoundingClientRect());
				const cs = getComputedStyle(btn);
				// The ring's outer edge: outline offset + width, and the 6px halo under it.
				const reach = Math.max(parseFloat(cs.outlineOffset) + parseFloat(cs.outlineWidth), 6);
				const ring = { left: r.left - reach, top: r.top - reach, right: r.right + reach, bottom: r.bottom + reach };
				let clipped = ring.left < 0 || ring.top < 0 || ring.right > vw || ring.bottom > innerHeight;
				for (let e = btn.parentElement; e && e !== document.body; e = e.parentElement) {
					const o = getComputedStyle(e);
					if (o.overflow !== 'visible' && o.position !== 'static' && cs.position !== 'fixed') clipped = true;
				}
				return {
					w: r.width,
					h: r.height,
					dx: ((x0 + x1 + 1) / 2) * (r.width / W) - r.width / 2,
					dy: ((y0 + y1 + 1) / 2) * (r.height / H) - r.height / 2,
					inked: x1 >= 0,
					top: r.top,
					// From the visible edge: the page keeps its scrollbar gutter while the lightbox is open.
					right: vw - r.right,
					inside: r.left >= 0 && r.top >= 0 && r.right <= vw && r.bottom <= innerHeight,
					inset: { top: r.top - frame.top, right: frame.right - r.right, bottom: frame.bottom - r.bottom, left: r.left - frame.left },
					overControls: controls.some((c) => !(r.right <= c.left || r.left >= c.right || r.bottom <= c.top || r.top >= c.bottom)),
					coarse: matchMedia('(pointer: coarse)').matches,
					focused: document.activeElement === btn && btn.matches(':focus-visible'),
					ringShown: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2,
					clipped,
					label: btn.getAttribute('aria-label'),
				};
			}, [shot.toString('base64'), vw]);
			await page.keyboard.press('Escape');
			await page.waitForTimeout(150);
			const back = await page.evaluate(() => !document.querySelector('dialog.lightbox').open && !!document.activeElement?.hasAttribute('data-zoom'));
			const checks = {
				'true circle, 36 / 44 touch': m.w === m.h && m.w === (m.coarse ? 44 : 36),
				'X centred': m.inked && Math.abs(m.dx) <= 0.5 && Math.abs(m.dy) <= 0.5,
				'12px inside the frame': Math.abs(m.inset.top - 12) <= 0.5 && Math.abs(m.inset.right - 12) <= 0.5 && Object.values(m.inset).every((v) => v >= 11.5),
				'inside viewport': m.inside,
				'clear of clip controls': !m.overControls,
				'first focus, label': m.focused && m.label === 'Close',
				'ring unclipped': m.ringShown && !m.clipped,
				'Esc + focus back': back,
			};
			const ok = Object.values(checks).every(Boolean);
			if (!ok) failed++;
			closeRows.push({
				viewport: width,
				theme,
				case: c.name,
				'w x h': `${m.w}x${m.h}`,
				'X dx/dy': `${m.dx.toFixed(2)} / ${m.dy.toFixed(2)}`,
				'inset in frame top/right': `${Math.round(m.inset.top * 10) / 10} / ${Math.round(m.inset.right * 10) / 10}`,
				'viewport gap top/right': `${Math.round(m.top * 10) / 10} / ${Math.round(m.right * 10) / 10}`,
				failed: Object.entries(checks).filter(([, v]) => !v).map(([k]) => k).join(', ') || '-',
				result: ok ? 'PASS' : 'FAIL',
			});
		}
		await ctx.close();
	}
}

await browser.close();
console.table(rows);
console.table(closeRows);
const total = rows.length + closeRows.length;
console.log(failed ? `${failed} of ${total} case(s) failed` : `all ${total} cases pass`);
process.exit(failed ? 1 : 0);
