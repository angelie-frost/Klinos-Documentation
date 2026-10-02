// Behaviour test for the "What's new in V3" card. Usage: node scripts/test-whatsnew.mjs [baseUrl]
import { chromium } from 'playwright-core';

const BASE = process.argv[2] || 'http://localhost:4322';
const HOME = `${BASE}/using-klinos/start-here/home/`;
const browser = await chromium.launch({ channel: 'msedge' });
const results = [];
const check = (name, ok, extra = '') => results.push({ check: name, result: ok ? 'PASS' : 'FAIL', detail: extra });
const visible = (p) => p.evaluate(() => !document.getElementById('whatsnew').hidden);
const fresh = (opts = {}) => browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });

// The six slides, in order, with the page each "Read more" opens.
const SLIDES = [
	['Editable lighting', '/using-klinos/studio/lighting/'],
	['Sharper preview', '/using-klinos/reference/try-it-live/'],
	['Polished frame and Surface texture', '/using-klinos/studio/devices/#polished-frame-phones-only'],
	['Photoreal mode', '/using-klinos/photoreal/photoreal/'],
	['Playground mode', '/using-klinos/playground/layouts/'],
	['Dark theme', '/using-klinos/start-here/about-klinos/#what-v3-added'],
];
const slideState = (p) =>
	p.evaluate(() => {
		const s = [...document.querySelectorAll('[data-wn-slide]')].find((x) => !x.hidden);
		return {
			title: s?.querySelector('.wn-slide-title')?.textContent.trim(),
			more: s?.querySelector('.wn-more')?.getAttribute('href'),
			img: !!s?.querySelector('img'),
			text: s?.querySelector('.wn-text')?.textContent.trim(),
			count: document.querySelector('[data-wn-count]').textContent.trim(),
			next: document.querySelector('[data-wn-next]').textContent.trim(),
		};
	});

for (const [name, opts] of [
	['desktop', {}],
	['phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
]) {
	const ctx = await fresh(opts);
	const p = await ctx.newPage();
	await p.goto(HOME, { waitUntil: 'networkidle' });
	check(`${name}: six slides`, (await p.locator('[data-wn-slide]').count()) === 6);
	const seen = [];
	for (let i = 0; i < SLIDES.length; i++) {
		const s = await slideState(p);
		seen.push(s);
		if (i < SLIDES.length - 1) await p.click('[data-wn-next]');
	}
	check(`${name}: slides in order with the right Read more links`, seen.every((s, i) => s.title === SLIDES[i][0] && s.more === SLIDES[i][1]), seen.map((s) => s.title).join(' | '));
	check(`${name}: every slide has a picture and plain text (no Markdown)`, seen.every((s) => s.img && s.text && !/[[\]()*]/.test(s.text)));
	check(`${name}: counter reads 1 of 6 … 6 of 6, last button is Done`, seen[0].count === '1 of 6' && seen[5].count === '6 of 6' && seen[5].next === 'Done');
	const fit = await p.evaluate(() => {
		const card = document.getElementById('whatsnew').getBoundingClientRect();
		const nav = document.querySelector('.wn-nav').getBoundingClientRect();
		const foot = document.querySelector('.wn-foot');
		return { inside: nav.left >= card.left - 0.5 && nav.right <= card.right + 0.5, oneRow: [...document.querySelectorAll('.wn-nav > *')].every((e) => Math.abs(e.getBoundingClientRect().top - nav.top) < 6), noScroll: foot.scrollWidth <= foot.clientWidth + 1 };
	});
	check(`${name}: Back, counter and Done fit on one row inside the card`, fit.inside && fit.oneRow && fit.noScroll, JSON.stringify(fit));
	await p.click('[data-wn-prev]');
	check(`${name}: Back from the last slide shows 5 of 6`, (await slideState(p)).count === '5 of 6');
	await ctx.close();
}
{
	const ctx = await fresh({ reducedMotion: 'reduce' });
	const p = await ctx.newPage();
	await p.goto(HOME, { waitUntil: 'networkidle' });
	await p.click('[data-wn-next]');
	check('reduced motion: no slide animation', await p.evaluate(() => getComputedStyle([...document.querySelectorAll('[data-wn-slide]')].find((x) => !x.hidden)).animationName === 'none'));
	await ctx.close();
}

{
	const ctx = await fresh();
	const p = await ctx.newPage();
	const errors = [];
	p.on('pageerror', (e) => errors.push(e.message));
	await p.goto(HOME, { waitUntil: 'networkidle' });
	check('first visit shows it on Home', await visible(p));
	check('focus moves into the card', await p.evaluate(() => document.getElementById('whatsnew').contains(document.activeElement)));
	check('role=dialog with an accessible name', await p.evaluate(() => {
		const c = document.getElementById('whatsnew');
		return c.getAttribute('role') === 'dialog' && !!document.getElementById(c.getAttribute('aria-labelledby'))?.textContent.trim();
	}));
	check('page is not dimmed or blocked', await p.evaluate(() => !document.querySelector('dialog[open]') && getComputedStyle(document.getElementById('whatsnew')).position === 'fixed'));
	await p.click('[data-wn-next]');
	check('Next moves to slide 2', (await p.textContent('[data-wn-count]')).startsWith('2 of'));
	await p.click('[data-wn-prev]');
	check('Back returns to slide 1', (await p.textContent('[data-wn-count]')).startsWith('1 of'));
	await p.click('[data-wn-close]');
	check('Close hides it', !(await visible(p)));
	await p.reload({ waitUntil: 'networkidle' });
	check('after closing, it does not return after a reload', !(await visible(p)));
	await p.goto(`${BASE}/using-klinos/studio/lighting/`, { waitUntil: 'networkidle' });
	check('header button reopens it (on another page)', await (async () => {
		await p.click('.right-group [data-wn-open]');
		return visible(p);
	})());
	// keyboard: Esc closes and focus returns to the header button
	await p.keyboard.press('Escape');
	check('Esc closes it', !(await visible(p)));
	check('focus returns to the header button', await p.evaluate(() => document.activeElement?.matches('.right-group [data-wn-open]')));
	check('no page errors', errors.length === 0, errors.join('; '));
	await ctx.close();
}
{
	const ctx = await fresh();
	const p = await ctx.newPage();
	await p.goto(`${BASE}/using-klinos/studio/lighting/`, { waitUntil: 'networkidle' });
	check('not shown on Lighting (deep link)', !(await visible(p)));
	await p.goto(`${BASE}/using-klinos/reference/try-it-live/`, { waitUntil: 'networkidle' });
	check('not shown on Try it live', !(await visible(p)));
	await p.goto(`${BASE}/does-not-exist/`, { waitUntil: 'networkidle' });
	check('not shown on the 404 page', !(await visible(p)));
	await p.goto(`${HOME}#three-modes`, { waitUntil: 'networkidle' });
	check('not shown on a Home deep link (#hash)', !(await visible(p)));
	await ctx.close();
}
{
	// Keyboard only: Tab to the header button, Enter opens, Tab through the controls, Esc closes.
	const ctx = await fresh();
	await ctx.addInitScript(() => localStorage.setItem('klinos-whatsnew-v3', 'seen'));
	const p = await ctx.newPage();
	await p.goto(`${BASE}/using-klinos/studio/lighting/`, { waitUntil: 'networkidle' });
	let reached = false;
	for (let i = 0; i < 40 && !reached; i++) {
		await p.keyboard.press('Tab');
		reached = await p.evaluate(() => document.activeElement?.matches('.right-group [data-wn-open]'));
	}
	check('keyboard: Tab reaches the header button', reached);
	await p.keyboard.press('Enter');
	check('keyboard: Enter opens it', await visible(p));
	const stops = [];
	for (let i = 0; i < 6; i++) {
		await p.keyboard.press('Tab');
		stops.push(await p.evaluate(() => document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent.trim().slice(0, 40) || document.activeElement?.tagName));
	}
	check('keyboard: controls reachable in order', ['Close What\'s new', 'Read more about Editable lighting'].every((s) => stops.includes(s)) && stops.some((s) => /Next/.test(s)), stops.join(' → '));
	await p.keyboard.press('Escape');
	check('keyboard: Esc closes, focus back on the button', !(await visible(p)) && (await p.evaluate(() => document.activeElement?.matches('.right-group [data-wn-open]'))));
	await ctx.close();
}
{
	// "Don't show again" hides the header button after a reload.
	const ctx = await fresh();
	const p = await ctx.newPage();
	await p.goto(HOME, { waitUntil: 'networkidle' });
	await p.check('[data-wn-never]');
	await p.click('[data-wn-close]');
	await p.reload({ waitUntil: 'networkidle' });
	check('"Don\'t show again" hides the header button', await p.evaluate(() => document.querySelector('.right-group [data-wn-open]').hidden));
	check('stored with the versioned key', (await p.evaluate(() => localStorage.getItem('klinos-whatsnew-v3'))) === 'dismissed');
	await ctx.close();
}
{
	// Storage blocked: no errors, still opens and closes.
	const ctx = await fresh();
	await ctx.addInitScript(() => {
		const deny = () => {
			throw new DOMException('blocked', 'SecurityError');
		};
		Object.defineProperty(window, 'localStorage', { get: deny });
	});
	const p = await ctx.newPage();
	const errors = [];
	p.on('pageerror', (e) => errors.push(e.message));
	await p.goto(HOME, { waitUntil: 'networkidle' });
	const shown = await visible(p);
	await p.click('[data-wn-close]');
	check('storage blocked: shows and closes without errors', shown && !(await visible(p)) && errors.length === 0, errors.join('; '));
	await ctx.close();
}
{
	// Phone: a bottom sheet; the menu has the reopen button.
	const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
	const p = await ctx.newPage();
	await p.goto(HOME, { waitUntil: 'networkidle' });
	const box = await p.locator('#whatsnew').boundingBox();
	check('phone: bottom sheet across the width', (await visible(p)) && Math.round(box.width) === 390 && Math.round(box.y + box.height) === 844, `${Math.round(box.width)}x${Math.round(box.height)} at y=${Math.round(box.y)}`);
	await p.click('[data-wn-close]');
	await p.click('button.sl-menu-button');
	await p.click('#starlight__sidebar [data-wn-open]');
	check('phone: the menu button reopens it', await visible(p));
	await ctx.close();
}
await browser.close();
console.table(results);
const failed = results.filter((r) => r.result !== 'PASS').length;
console.log(failed ? `${failed} check(s) failed` : `all ${results.length} checks pass`);
process.exit(failed ? 1 : 0);
