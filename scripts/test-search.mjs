// Behaviour test for site search. Usage: node scripts/test-search.mjs [baseUrl]   (a built site, e.g. npm run preview)
import { chromium } from 'playwright-core';

const BASE = process.argv[2] || 'http://localhost:4322';
const PAGE = `${BASE}/using-klinos/studio/lighting/`;
const browser = await chromium.launch({ channel: 'msedge' });
const results = [];
const check = (name, ok, detail = '') => results.push({ check: name, result: ok ? 'PASS' : 'FAIL', detail });
const isOpen = (p) => p.evaluate(() => !!document.querySelector('dialog.k-search-dialog[open]'));
const visible = (p, sel) => p.evaluate((s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; }, sel);
const newPage = async (opts) => {
	const ctx = await browser.newContext(opts);
	await ctx.addInitScript(() => localStorage.setItem('klinos-whatsnew-v3', 'seen'));
	const p = await ctx.newPage();
	await p.goto(PAGE, { waitUntil: 'networkidle' });
	return { ctx, p };
};

// ---------- Desktop, mouse ----------
{
	const { ctx, p } = await newPage({ viewport: { width: 1440, height: 900 } });
	// On desktop the trigger is the field at the top of the sidebar; the header has no search button.
	const trigger = p.locator('.k-sb-search');
	check('desktop: no search button in the header', !(await visible(p, '.k-header button[data-open-modal]')));
	check('sidebar field reads "Search docs" with the Ctrl+K chip', (await trigger.innerText()).includes('Search docs') && /^(Ctrl\+K|⌘K)$/.test((await p.textContent('.k-sb-search > kbd')).trim()));
	check('sidebar field aria-label "Search documentation"', (await trigger.getAttribute('aria-label')) === 'Search documentation');
	check('sidebar field shows the Ctrl K hint', await visible(p, '.k-sb-search > kbd'));
	await trigger.click();
	check('clicking the sidebar field opens the panel', await isOpen(p));
	check('placeholder "Search documentation"', (await p.getAttribute('[data-search-input]', 'placeholder')) === 'Search documentation');
	check('input text is 16px', (await p.$eval('[data-search-input]', (e) => getComputedStyle(e).fontSize)) === '16px');
	check('Esc hint shown, Close hidden (mouse)', (await visible(p, '.k-search-esc')) && !(await visible(p, '.k-search-close')));
	check('empty state: "Type to search" and 4 suggestions', (await visible(p, '[data-state="empty"]')) && (await p.locator('[data-suggest]').count()) === 4);
	await p.click('[data-suggest="Polished frame"]');
	await p.waitForSelector('#k-search-results li', { timeout: 8000 });
	check('a suggestion runs that search', (await p.inputValue('[data-search-input]')) === 'Polished frame' && (await p.locator('#k-search-results li').count()) > 0);
	await p.fill('[data-search-input]', 'lighting');
	await p.waitForFunction(() => document.querySelectorAll('#k-search-results li').length > 1);
	await p.waitForTimeout(300);
	const sel = () => p.evaluate(() => [...document.querySelectorAll('#k-search-results li')].findIndex((li) => li.getAttribute('aria-selected') === 'true'));
	const s0 = await sel();
	await p.keyboard.press('ArrowDown');
	const s1 = await sel();
	await p.keyboard.press('ArrowUp');
	const s2 = await sel();
	check('arrow keys move the selection', s0 === 0 && s1 === 1 && s2 === 0, `${s0} → ${s1} → ${s2}`);
	check('input points at the selected row (aria-activedescendant)', (await p.getAttribute('[data-search-input]', 'aria-activedescendant')) === 'k-sr-0');
	const target = await p.$eval('#k-search-results li a', (a) => a.getAttribute('href'));
	await Promise.all([p.waitForURL((u) => u.pathname + u.hash === target || u.href.endsWith(target), { timeout: 8000 }).catch(() => {}), p.keyboard.press('Enter')]);
	check('Enter opens the selected result', p.url().includes(target.split('#')[0]), target);
	// No results, Esc, focus return
	await p.goto(PAGE, { waitUntil: 'networkidle' });
	await p.keyboard.press('Control+k');
	check('Ctrl K opens the panel', await isOpen(p));
	await p.fill('[data-search-input]', 'zzqxv');
	await p.waitForFunction(() => !document.querySelector('[data-state="none"]').hidden, null, { timeout: 8000 });
	check('no-results state: message and tip', (await p.textContent('[data-state="none"]')).includes('No results for "zzqxv"'));
	await p.keyboard.press('Escape');
	check('Esc closes the panel', !(await isOpen(p)));
	await trigger.click();
	await p.keyboard.press('Escape');
	check('focus returns to the sidebar field', await p.evaluate(() => document.activeElement?.matches('.k-sb-search')));
	await ctx.close();
}

// ---------- Tablet and phone, touch ----------
for (const vp of [{ n: '820', w: 820, h: 1180 }, { n: '390', w: 390, h: 844 }]) {
	const { ctx, p } = await newPage({ viewport: { width: vp.w, height: vp.h }, isMobile: true, hasTouch: true });
	const trigger = p.locator('button[data-open-modal]');
	check(`${vp.n}: icon-only trigger, aria-label "Search documentation"`, !(await visible(p, 'button[data-open-modal] > span')) && (await trigger.getAttribute('aria-label')) === 'Search documentation');
	check(`${vp.n}: no sidebar field (the sidebar is the menu here)`, !(await visible(p, '.k-sb-search')));
	await p.keyboard.press('Control+k');
	check(`${vp.n}: Ctrl K opens the panel here too`, await isOpen(p));
	await p.keyboard.press('Escape');
	await p.waitForTimeout(150);
	await trigger.tap();
	check(`${vp.n}: the header icon opens it`, await isOpen(p));
	const box = await p.locator('.k-search-panel').boundingBox();
	const gaps = { left: box.x, right: vp.w - box.x - box.width, top: box.y, bottom: vp.h - box.y - box.height };
	check(`${vp.n}: floating panel, gap ≥ 16px on all sides`, Object.values(gaps).every((g) => g >= 16), JSON.stringify(Object.fromEntries(Object.entries(gaps).map(([k, v]) => [k, Math.round(v)]))));
	check(`${vp.n}: rounded corners`, parseFloat(await p.$eval('.k-search-panel', (e) => getComputedStyle(e).borderTopLeftRadius)) > 0);
	check(`${vp.n}: "Close" shown, Esc hint hidden (touch)`, (await visible(p, '.k-search-close')) && !(await visible(p, '.k-search-esc')));
	const closeBox = await p.locator('.k-search-close').boundingBox();
	check(`${vp.n}: Close is at least 44px tall`, closeBox.height >= 44, `${Math.round(closeBox.height)}px`);
	check(`${vp.n}: input text is 16px`, (await p.$eval('[data-search-input]', (e) => getComputedStyle(e).fontSize)) === '16px');
	await p.fill('[data-search-input]', 'the');
	await p.waitForFunction(() => document.querySelectorAll('#k-search-results li').length > 2, null, { timeout: 8000 });
	await p.waitForTimeout(300);
	const scroll = await p.evaluate(() => {
		const body = document.querySelector('.k-search-body');
		const panel = document.querySelector('.k-search-panel').getBoundingClientRect();
		return { scrollable: getComputedStyle(body).overflowY === 'auto', overflowing: body.scrollHeight > body.clientHeight, fits: panel.bottom <= innerHeight - 16 + 0.5 };
	});
	check(`${vp.n}: results scroll inside the panel, panel stays in view`, scroll.scrollable && scroll.fits, JSON.stringify(scroll));
	await p.touchscreen.tap(Math.round(vp.w / 2), vp.h - 6);
	await p.waitForTimeout(200);
	check(`${vp.n}: a tap outside closes it`, !(await isOpen(p)));
	await ctx.close();
}
// ---------- The field's line and focus, both themes ----------
// A light 1px line (--k-line2), no heavy inset line; focus shown by the search icon and caret in full ink (3:1 or
// more on the surface, checked by check:contrast), muted again when focus leaves the field.
for (const theme of ['light', 'dark']) {
	for (const vp of [{ n: '1440', w: 1440, h: 900 }, { n: '390 touch', w: 390, h: 844, touch: true }]) {
		const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, ...(vp.touch ? { isMobile: true, hasTouch: true } : {}) });
		await ctx.addInitScript((t) => {
			localStorage.setItem('klinos-whatsnew-v3', 'seen');
			localStorage.setItem('starlight-theme', t);
		}, theme);
		const p = await ctx.newPage();
		await p.goto(PAGE, { waitUntil: 'networkidle' });
		await (vp.touch ? p.locator('button[data-open-modal]').tap() : p.locator('.k-sb-search').click());
		await p.waitForTimeout(250);
		const state = () =>
			p.evaluate(() => {
				const resolve = (v) => {
					const probe = document.createElement('span');
					probe.style.color = `var(${v})`;
					document.body.append(probe);
					const c = getComputedStyle(probe).color;
					probe.remove();
					return c;
				};
				const field = document.querySelector('.k-search-field');
				const cs = getComputedStyle(field);
				return {
					focused: document.activeElement?.matches('[data-search-input]'),
					width: cs.borderBottomWidth,
					color: cs.borderBottomColor,
					line2: resolve('--k-line2'),
					inset: cs.boxShadow,
					icon: getComputedStyle(field.querySelector('.k-icon')).color,
					caret: getComputedStyle(field.querySelector('input')).caretColor,
					ink: resolve('--k-ink'),
					muted: resolve('--k-ink-muted'),
				};
			});
		const on = await state();
		const tag = `${theme} ${vp.n}`;
		check(`${tag}: field line is 1px --k-line2, no heavy inset line`, on.width === '1px' && on.color === on.line2 && (on.inset === 'none' || !/inset/.test(on.inset)), `${on.width} ${on.color} ${on.inset}`);
		check(`${tag}: focused field shows the icon and caret in full ink`, on.focused && on.icon === on.ink && on.caret === on.ink, `icon ${on.icon}, caret ${on.caret}`);
		await p.focus('[data-suggest="Lighting"]');
		const off = await state();
		check(`${tag}: focus elsewhere: the icon goes back to muted`, !off.focused && off.icon === off.muted, off.icon);
		await ctx.close();
	}
}

await browser.close();
console.table(results);
const failed = results.filter((r) => r.result !== 'PASS').length;
console.log(failed ? `${failed} check(s) failed` : `all ${results.length} checks pass`);
process.exit(failed ? 1 : 0);
