// Measures the image zoom (lightbox): the enlarged image must be centred in the viewport within 1 px,
// and the page behind must not move when it opens. Esc, backdrop click and focus return are checked too.
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
await browser.close();
console.table(rows);
console.log(failed ? `${failed} case(s) failed` : `all ${rows.length} cases pass`);
process.exit(failed ? 1 : 0);
