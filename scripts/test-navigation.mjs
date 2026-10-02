// Page-to-page navigation with cross-document View Transitions. Usage: node scripts/test-navigation.mjs [baseUrl]
// (a built site, e.g. npm run preview). Checks, in Edge (Chromium):
// - six clicks in a row in light and dark: a transition runs, the header and sidebar do not move or shift,
//   the sidebar keeps its scroll and highlights the new page, no console errors, focus starts at the top
//   (first Tab = "Skip to content"), and the theme is right on the first frame;
// - no transition on the first load, for #links, to/from Try it live, from the open tablet menu, under reduced
//   motion, or in a browser without support (emulated: opt-in removed and no Navigation API);
// - search, What's new, lightbox, mermaid, Try it live, theme toggle, the "On this page" row and the version
//   link still work on the first load and after several navigations;
// - prefetch on hover.
import { chromium } from 'playwright-core';

const BASE = process.argv[2] || 'http://localhost:4322';
const P = {
	screen: '/using-klinos/studio/screen/',
	lighting: '/using-klinos/studio/lighting/',
	about: '/using-klinos/start-here/about-klinos/',
	devices: '/using-klinos/studio/devices/',
	home: '/using-klinos/start-here/home/',
	live: '/using-klinos/reference/try-it-live/',
	changelog: '/using-klinos/reference/changelog/',
	architecture: '/maintaining-klinos/understand/architecture/',
};
const results = [];
const check = (name, ok, detail = '') => results.push({ check: name, result: ok ? 'PASS' : 'FAIL', detail: String(detail).slice(0, 90) });

// Recorded on every document: whether it was revealed with a transition, the theme at that moment, and
// layout shifts with their source nodes.
const INIT = ({ theme, seen }) => {
	if (seen) localStorage.setItem('klinos-whatsnew-v3', 'seen');
	if (theme) localStorage.setItem('starlight-theme', theme);
	addEventListener('pagereveal', (e) => {
		const log = JSON.parse(sessionStorage.getItem('k-reveals') || '[]');
		log.push({ path: location.pathname, vt: !!e.viewTransition, theme: document.documentElement.dataset.theme });
		sessionStorage.setItem('k-reveals', JSON.stringify(log));
	});
	window.__shifts = [];
	try {
		new PerformanceObserver((list) => {
			for (const entry of list.getEntries())
				for (const s of entry.sources || []) window.__shifts.push(s.node?.closest?.('header.header') ? 'header' : s.node?.closest?.('#starlight__sidebar') ? 'sidebar' : 'other');
		}).observe({ type: 'layout-shift', buffered: true });
	} catch {}
};
const lastReveal = (p) => p.evaluate(() => JSON.parse(sessionStorage.getItem('k-reveals') || '[]').at(-1));

const browser = await chromium.launch({ channel: 'msedge' });
const newPage = async (opts = {}, init = {}) => {
	const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...opts });
	await ctx.addInitScript(INIT, { seen: true, ...init });
	const p = await ctx.newPage();
	const errors = [];
	p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
	p.on('pageerror', (e) => errors.push(String(e)));
	return { ctx, p, errors };
};
const go = async (p, selector) => {
	const before = p.url();
	await p.click(selector);
	await p.waitForURL((u) => u.href !== before);
	await p.waitForLoadState('load');
	await p.waitForTimeout(350); // let the 200ms transition finish
};
const rect = (p, sel) => p.$eval(sel, (e) => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map((n) => Math.round(n * 10) / 10).join(','); });
const sidebarLink = (path) => `#starlight__sidebar a[href="${path}"]`;

// ---------- 1. Six navigations in a row, light and dark (desktop) ----------
for (const theme of ['light', 'dark']) {
	const { ctx, p, errors } = await newPage({}, { theme });
	await p.goto(BASE + P.screen, { waitUntil: 'networkidle' });
	check(`${theme}: first load has no transition`, (await lastReveal(p))?.vt === false);
	const steps = [
		['sidebar link', () => sidebarLink(P.lighting)],
		['pager Next', () => '.k-pager-link[rel="next"]'],
		['sidebar link', () => sidebarLink(P.about)],
		['pager Previous', () => '.k-pager-link[rel="prev"]'],
		['sidebar link', () => sidebarLink(P.devices)],
		['version link', () => '.k-header .k-version'],
	];
	for (const [i, [how, sel]] of steps.entries()) {
		const tag = `${theme} nav ${i + 1} (${how})`;
		const header0 = await rect(p, 'header.header');
		const side0 = await rect(p, '#starlight__sidebar');
		const scroll0 = await p.$eval('#starlight__sidebar', (e) => e.scrollTop);
		await go(p, sel());
		const r = await lastReveal(p);
		check(`${tag}: transition ran`, r?.vt === true, r?.path);
		check(`${tag}: theme right on the first frame`, r?.theme === theme, r?.theme);
		check(`${tag}: header did not move`, (await rect(p, 'header.header')) === header0);
		check(`${tag}: sidebar did not move`, (await rect(p, '#starlight__sidebar')) === side0);
		const scroll1 = await p.$eval('#starlight__sidebar', (e) => e.scrollTop);
		const current = await p.evaluate((moved) => {
			const a = document.querySelector('#starlight__sidebar [aria-current="page"]');
			const s = document.getElementById('starlight__sidebar').getBoundingClientRect();
			const r = a?.getBoundingClientRect();
			return {
				href: a?.getAttribute('href'),
				path: location.pathname,
				visible: !!r && r.top >= s.top && r.bottom <= s.bottom,
				// Where the link would have been at the old scroll: out of view means the sidebar had to scroll to it.
				wasHidden: !!r && (r.top + moved < s.top || r.bottom + moved > s.bottom),
			};
		}, scroll1 - scroll0);
		check(`${tag}: sidebar keeps its scroll (moves only to bring the new page into view)`, Math.abs(scroll1 - scroll0) <= 1 || current.wasHidden, `${scroll0} → ${scroll1}`);
		check(`${tag}: new page highlighted and in view`, current.href === current.path && current.visible, current.href);
		const shifts = await p.evaluate(() => window.__shifts.filter((s) => s !== 'other'));
		check(`${tag}: no layout shift in header or sidebar`, shifts.length === 0, shifts.join(','));
		check(`${tag}: focus starts at the top of the page`, await p.evaluate(() => document.activeElement === document.body));
		await p.keyboard.press('Tab');
		check(`${tag}: first Tab is "Skip to content" (to the page heading)`, await p.evaluate(() => document.activeElement?.matches('.sl-skip-link') && document.activeElement.getAttribute('href') === '#_top'));
		await p.evaluate(() => document.activeElement?.blur()); // the focused skip link covers the header's left side
	}
	check(`${theme}: no console errors over six navigations`, errors.length === 0, errors.join(' | '));
	await ctx.close();
}

// ---------- 2. Sidebar scroll kept when scrolled, current page brought into view on a direct visit ----------
{
	const { ctx, p } = await newPage();
	await p.goto(BASE + P.screen, { waitUntil: 'networkidle' });
	await p.$eval('#starlight__sidebar', (e) => (e.scrollTop = 260));
	const target = await p.evaluate(() => {
		const s = document.getElementById('starlight__sidebar').getBoundingClientRect();
		const a = [...document.querySelectorAll('#starlight__sidebar a[href^="/"]')].find((a) => { const r = a.getBoundingClientRect(); return r.top > s.top + 40 && r.bottom < s.bottom - 40 && !a.hasAttribute('aria-current'); });
		return a.getAttribute('href');
	});
	await go(p, sidebarLink(target));
	check('scrolled sidebar: scroll kept after navigating', Math.abs((await p.$eval('#starlight__sidebar', (e) => e.scrollTop)) - 260) <= 1, target);
	await ctx.close();
	const { ctx: c2, p: p2 } = await newPage();
	await p2.goto(BASE + P.architecture, { waitUntil: 'networkidle' });
	const vis = await p2.evaluate(() => {
		const a = document.querySelector('#starlight__sidebar [aria-current="page"]');
		const s = document.getElementById('starlight__sidebar').getBoundingClientRect();
		const r = a.getBoundingClientRect();
		return r.top >= s.top && r.bottom <= s.bottom;
	});
	check('direct visit to a page low in the list: its link is in view', vis);
	await c2.close();
}

// ---------- 3. Where no transition runs ----------
{
	const { ctx, p, errors } = await newPage();
	await p.goto(BASE + P.lighting, { waitUntil: 'networkidle' });
	await p.evaluate(() => (window.__sameDoc = true));
	await p.click('main a[href^="#"]:not([href="#_top"])');
	await p.waitForTimeout(300);
	check('#link: same page, no navigation', await p.evaluate(() => window.__sameDoc === true && !!location.hash));
	await go(p, '.k-header .k-try');
	check('to Try it live: skipped', (await lastReveal(p))?.vt === false);
	const frame = await p.waitForSelector('iframe[data-live-frame]');
	await p.waitForFunction(() => document.querySelector('iframe[data-live-frame]')?.contentDocument?.readyState === 'complete', null, { timeout: 15000 });
	check('Try it live: the demo loads', (await frame.getAttribute('src')) === '/demo/preview.html');
	await go(p, sidebarLink(P.screen));
	check('from Try it live: skipped', (await lastReveal(p))?.vt === false);
	check('no console errors (anchor, Try it live)', errors.length === 0, errors.join(' | '));
	await ctx.close();
}
for (const w of [820, 390]) {
	const { ctx, p, errors } = await newPage({ viewport: { width: w, height: 900 }, hasTouch: true, isMobile: w < 700 });
	await p.goto(BASE + P.screen, { waitUntil: 'networkidle' });
	const header0 = await rect(p, 'header.header');
	const row0 = await rect(p, '.k-mtoc');
	await go(p, '.k-pager-link[rel="next"]');
	check(`${w}: pager navigation has a transition`, (await lastReveal(p))?.vt === true);
	check(`${w}: header and "On this page" row did not move`, (await rect(p, 'header.header')) === header0 && (await rect(p, '.k-mtoc')) === row0);
	await p.tap('.k-menu-btn');
	await p.waitForTimeout(250);
	check(`${w}: menu open`, await p.evaluate(() => !!document.querySelector('#starlight__sidebar:popover-open')));
	await go(p, sidebarLink(P.lighting));
	check(`${w}: from the open menu: no transition (skipped)`, (await lastReveal(p))?.vt === false);
	check(`${w}: after navigating, the menu is closed and the new page highlighted`, await p.evaluate(() => !document.querySelector('#starlight__sidebar:popover-open') && document.querySelector('#starlight__sidebar [aria-current="page"]')?.getAttribute('href') === location.pathname));
	// With the "On this page" list open, leave the page from the header: the list closes, the page changes cleanly.
	await p.tap('.k-mtoc-row');
	await p.waitForTimeout(200);
	const listOpen = await p.$eval('#k-mtoc-list', (l) => !l.hidden);
	await go(p, '.k-header .k-version');
	const r = await lastReveal(p);
	check(`${w}: navigating with the "On this page" list open: list closed on the new page, no stray transition`, listOpen && new URL(p.url()).pathname === P.changelog && (await p.$eval('#k-mtoc-list', (l) => l.hidden)) && typeof r?.vt === 'boolean', `transition: ${r?.vt}`);
	check(`${w}: no console errors`, errors.length === 0, errors.join(' | '));
	await ctx.close();
}
{
	const { ctx, p } = await newPage({ reducedMotion: 'reduce' });
	await p.goto(BASE + P.screen, { waitUntil: 'networkidle' });
	await go(p, sidebarLink(P.lighting));
	const r = await lastReveal(p);
	check('reduced motion: no transition, new page shown at once', r?.vt === false && (await p.evaluate(() => getComputedStyle(document.querySelector('main')).opacity)) === '1');
	await ctx.close();
}
{
	// No support, emulated: the opt-in removed from every page and no Navigation API.
	const { ctx, p, errors } = await newPage();
	await ctx.route(/\/(using|maintaining)-klinos\/.*\/$/, async (route) => {
		const res = await route.fetch();
		await route.fulfill({ response: res, body: (await res.text()).replace(/@view-transition\s*\{[^}]*\}/, '') });
	});
	await ctx.addInitScript(() => Object.defineProperty(window, 'navigation', { value: undefined }));
	await p.goto(BASE + P.screen, { waitUntil: 'networkidle' });
	await go(p, sidebarLink(P.lighting));
	await go(p, '.k-pager-link[rel="next"]');
	check('no support (emulated): plain navigation, no transition, no errors', (await lastReveal(p))?.vt === false && errors.length === 0, errors.join(' | '));
	await ctx.close();
}

// ---------- 4. Features on the first load and after several navigations ----------
const features = async (p, label) => {
	// Search
	await p.click('button[data-open-modal]');
	await p.fill('[data-search-input]', 'lighting');
	await p.waitForFunction(() => document.querySelectorAll('#k-search-results li').length > 0, null, { timeout: 8000 }).catch(() => {});
	check(`${label}: search opens and finds results`, (await p.locator('#k-search-results li').count()) > 0);
	await p.keyboard.press('Escape');
	// Lightbox (on Screen)
	if (!p.url().endsWith(P.screen)) await go(p, sidebarLink(P.screen));
	await p.locator('figure[data-media-id] [data-zoom]').first().click();
	await p.waitForTimeout(300);
	const opened = await p.evaluate(() => document.querySelector('dialog.lightbox')?.open === true);
	await p.keyboard.press('Escape');
	await p.waitForTimeout(200);
	check(`${label}: lightbox opens and closes`, opened && (await p.evaluate(() => !document.querySelector('dialog.lightbox').open)));
	// Theme toggle, kept on the next page
	const t0 = await p.evaluate(() => document.documentElement.dataset.theme);
	await p.click('.k-header .themebtn');
	const t1 = await p.evaluate(() => document.documentElement.dataset.theme);
	await go(p, sidebarLink(P.architecture));
	const r = await lastReveal(p);
	check(`${label}: theme toggle switches and the next page keeps it`, t1 !== t0 && r?.theme === t1, `${t0} → ${t1}, next page ${r?.theme}`);
	// Mermaid (on Architecture)
	await p.waitForSelector('pre[data-mermaid][data-rendered] svg', { timeout: 15000 }).catch(() => {});
	check(`${label}: mermaid diagram renders`, (await p.locator('pre[data-mermaid][data-rendered] svg').count()) > 0);
	await p.click('.k-header .themebtn'); // back to the starting theme
	// Version link
	await go(p, '.k-header .k-version');
	check(`${label}: version link opens the changelog`, new URL(p.url()).pathname === P.changelog);
};
{
	const { ctx, p, errors } = await newPage();
	await p.goto(BASE + P.screen, { waitUntil: 'networkidle' });
	await features(p, 'first load');
	for (const sel of [sidebarLink(P.lighting), '.k-pager-link[rel="next"]', sidebarLink(P.about), sidebarLink(P.devices), '.k-pager-link[rel="prev"]']) await go(p, sel);
	await features(p, 'after 5 navigations');
	await go(p, '.k-header .k-try');
	await p.waitForFunction(() => document.querySelector('iframe[data-live-frame]')?.contentDocument?.readyState === 'complete', null, { timeout: 15000 }).catch(() => {});
	check('after navigations: Try it live demo loads', await p.evaluate(() => document.querySelector('iframe[data-live-frame]')?.contentDocument?.readyState === 'complete'));
	check('features: no console errors', errors.length === 0, errors.join(' | '));
	await ctx.close();
}
{
	// "On this page" row (tablet), first load and after navigations
	const { ctx, p } = await newPage({ viewport: { width: 820, height: 900 }, hasTouch: true });
	await p.goto(BASE + P.screen, { waitUntil: 'networkidle' });
	const row = async (label) => {
		await p.tap('.k-mtoc-row');
		await p.waitForTimeout(250);
		const open = await p.$eval('.k-mtoc-row', (b) => b.getAttribute('aria-expanded'));
		await p.tap('.k-mtoc-row');
		await p.waitForTimeout(250);
		check(`${label}: "On this page" row opens and closes`, open === 'true' && (await p.$eval('.k-mtoc-row', (b) => b.getAttribute('aria-expanded'))) === 'false');
	};
	await row('820 first load');
	for (const sel of ['.k-pager-link[rel="next"]', '.k-pager-link[rel="next"]', '.k-pager-link[rel="prev"]']) await go(p, sel);
	await row('820 after 3 navigations');
	await ctx.close();
}
{
	// What's new: opens once, only on a direct first visit to Home.
	const { ctx, p } = await newPage({}, { seen: false });
	await ctx.addInitScript(() => { if (!sessionStorage.getItem('k-wn-reset')) { sessionStorage.setItem('k-wn-reset', '1'); localStorage.removeItem('klinos-whatsnew-v3'); } });
	await p.goto(BASE + P.screen, { waitUntil: 'networkidle' });
	await go(p, sidebarLink(P.home));
	check("What's new: not opened when arriving at Home from another page", await p.evaluate(() => document.getElementById('whatsnew').hidden));
	await ctx.close();
	const { ctx: c2, p: p2 } = await newPage({}, { seen: false });
	await c2.addInitScript(() => { if (!sessionStorage.getItem('k-wn-reset')) { sessionStorage.setItem('k-wn-reset', '1'); localStorage.removeItem('klinos-whatsnew-v3'); } });
	await p2.goto(BASE + P.home, { waitUntil: 'networkidle' });
	await p2.waitForTimeout(400);
	const first = await p2.evaluate(() => !document.getElementById('whatsnew').hidden);
	await p2.click('[data-wn-close]');
	await go(p2, sidebarLink(P.screen));
	await go(p2, sidebarLink(P.home));
	await p2.goto(BASE + P.home, { waitUntil: 'networkidle' });
	await p2.waitForTimeout(400);
	check("What's new: opens on a direct first visit to Home, then never again", first && (await p2.evaluate(() => document.getElementById('whatsnew').hidden)));
	await c2.close();
}

// ---------- 5. Prefetch on hover ----------
{
	const { ctx, p } = await newPage();
	await p.goto(BASE + P.screen, { waitUntil: 'networkidle' });
	const fetched = [];
	p.on('request', (r) => fetched.push(new URL(r.url()).pathname));
	await p.hover(sidebarLink(P.lighting));
	await p.waitForTimeout(500);
	check('prefetch: hovering a link fetches its page', fetched.includes(P.lighting), fetched.join(' '));
	await ctx.close();
}

console.log(`Edge ${browser.version()}`);
await browser.close();
console.table(results);
const failed = results.filter((r) => r.result !== 'PASS').length;
console.log(failed ? `${failed} of ${results.length} check(s) failed` : `all ${results.length} checks pass`);
process.exit(failed ? 1 : 0);
