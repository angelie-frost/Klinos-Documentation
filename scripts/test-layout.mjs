// Layout test across the tablet/desktop switch (980/981px). Usage: node scripts/test-layout.mjs [baseUrl]   (a built site, e.g. npm run preview)
// At 800–980px there is no sidebar column: the content must sit centred with the same gutters as at 768px.
// At every width: no horizontal overflow, and the header items share one centreline (spread <= 1px).
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const BASE = process.argv[2] || 'http://localhost:4322';
// The version the header shows: its one source, src/config.ts.
const VERSION = readFileSync(new URL('../src/config.ts', import.meta.url), 'utf8').match(/KLINOS_VERSION = '([^']+)'/)[1];
const PAGES = [
	['Home', 'using-klinos/start-here/home/'],
	['Screen', 'using-klinos/studio/screen/'],
	['Lighting', 'using-klinos/studio/lighting/'],
	['Device library (tables)', 'using-klinos/reference/device-library/'],
];
const WIDTHS = [768, 800, 850, 900, 940, 980, 981, 1100];
const THEMES = ['light', 'dark'];

const browser = await chromium.launch({ channel: 'msedge' });
const results = [];
const rows = [];
const check = (name, ok, detail = '') => results.push({ check: name, result: ok ? 'PASS' : 'FAIL', detail });

for (const theme of THEMES) {
	const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
	await ctx.addInitScript((t) => {
		localStorage.setItem('klinos-whatsnew-v3', 'seen');
		localStorage.setItem('starlight-theme', t);
	}, theme);
	const p = await ctx.newPage();
	for (const [name, path] of PAGES) {
		for (const w of WIDTHS) {
			await p.setViewportSize({ width: w, height: 900 });
			await p.goto(`${BASE}/${path}`, { waitUntil: 'networkidle' });
			const m = await p.evaluate(() => {
				// Layout width: the viewport minus the site's always-shown 8px scrollbar.
				const cw = document.querySelector('.page').getBoundingClientRect().width;
				const vis = (e) => e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0;
				const r = (e) => e.getBoundingClientRect();
				const content = r(document.querySelector('main .sl-markdown-content'));
				const pad = parseFloat(getComputedStyle(document.querySelector('.content-panel')).paddingLeft);
				const maxW = parseFloat(getComputedStyle(document.querySelector('.content-panel .sl-container')).maxWidth);
				const frame = document.querySelector('.main-frame');
				const header = [...document.querySelectorAll('.k-header .brand, .k-header a.k-try-icon, .k-header button[data-open-modal], .k-header .right-group > *, .k-menu-btn')].filter(vis);
				const mids = header.map((e) => r(e).top + r(e).height / 2);
				const mtoc = document.querySelector('.k-mtoc');
				const pager = document.querySelector('.k-pager');
				const wide = [...document.querySelectorAll('main figure, main table, main pre, main .expressive-code, main .k-media, main .k-callout')].filter(vis);
				const outside = wide.filter((e) => r(e).left < content.left - 1 || r(e).right > content.right + 1).map((e) => e.tagName.toLowerCase() + '.' + [...e.classList].join('.'));
				return {
					cw,
					menu: vis(document.querySelector('.k-menu-btn')),
					contentInlineStart: getComputedStyle(document.documentElement).getPropertyValue('--sl-content-inline-start').trim() || '(unset)',
					framePad: parseFloat(getComputedStyle(frame).paddingInlineStart),
					left: content.left,
					width: content.width,
					right: cw - content.right,
					expected: Math.max(pad, (cw - maxW) / 2),
					overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - cw,
					spread: mids.length ? Math.max(...mids) - Math.min(...mids) : 0,
					mtoc: vis(mtoc) ? [r(mtoc).left, cw - r(mtoc).right] : null,
					pager: pager ? Math.max(Math.abs(r(pager).left - content.left), Math.abs(r(pager).right - content.right)) : null,
					outside,
				};
			});
			const tablet = w <= 980;
			const tag = `${theme} ${w} ${name}`;
			rows.push({ theme, width: w, page: name, layout: m.menu ? 'menu' : 'sidebar', '--sl-content-inline-start': m.contentInlineStart, 'frame pad-left': m.framePad, 'content left': Math.round(m.left), 'content width': Math.round(m.width), 'right gap': Math.round(m.right), expected: tablet ? Math.round(m.expected) : '-', overflow: m.overflow, spread: +m.spread.toFixed(2) });
			check(`${tag}: no horizontal overflow`, m.overflow <= 0, `${m.overflow}px`);
			check(`${tag}: header on one centreline`, m.spread <= 1, `${m.spread.toFixed(2)}px`);
			if (m.pager !== null) check(`${tag}: Previous/Next lines up with the content`, m.pager <= 1, `${m.pager.toFixed(1)}px off`);
			check(`${tag}: content blocks stay inside the column`, m.outside.length === 0, m.outside.join(', '));
			if (tablet) {
				check(`${tag}: menu layout`, m.menu);
				check(`${tag}: no sidebar offset on the frame`, m.framePad === 0, `${m.framePad}px`);
				check(`${tag}: content left gap is the tablet gutter`, Math.abs(m.left - m.expected) <= 1, `${Math.round(m.left)}px, expected ${Math.round(m.expected)}px`);
				check(`${tag}: content centred`, Math.abs(m.left - m.right) <= 1, `left ${Math.round(m.left)}, right ${Math.round(m.right)}`);
				if (m.mtoc) check(`${tag}: "On this page" row spans the viewport`, Math.abs(m.mtoc[0]) <= 0.5 && Math.abs(m.mtoc[1]) <= 0.5, JSON.stringify(m.mtoc.map(Math.round)));
			} else {
				check(`${tag}: sidebar layout`, !m.menu);
				check(`${tag}: content starts right of the sidebar`, m.left >= 264, `${Math.round(m.left)}px`);
			}
		}
	}
	await ctx.close();
}

// ---------- Header: logo and title left; section dropdown, What's new, Try it live and theme right; no version ----------
// Desktop (981px and up): the right group in that order, at least 10px between neighbours, the header search button
// hidden (search is in the sidebar). Tablet and phone: the Try it live icon and the search icon, 44px on touch.
// Every width: one centreline (spread <= 1px), everything inside the header, no overflow.
const headerRows = [];
for (const theme of THEMES) {
	for (const touch of [false, true]) {
		const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 }, ...(touch ? { hasTouch: true, isMobile: true } : {}) });
		await ctx.addInitScript((t) => {
			localStorage.setItem('klinos-whatsnew-v3', 'seen');
			localStorage.setItem('starlight-theme', t);
		}, theme);
		const p = await ctx.newPage();
		for (const w of touch ? [980, 820, 768, 390, 360] : [1440, 1100, 981]) {
			await p.setViewportSize({ width: w, height: 800 });
			await p.goto(`${BASE}/using-klinos/studio/screen/`, { waitUntil: 'networkidle' });
			const m = await p.evaluate(() => {
				const vis = (e) => !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0;
				const r = (e) => e.getBoundingClientRect();
				const header = r(document.querySelector('.k-header'));
				const items = [...document.querySelectorAll('.k-header .brand, .k-header a.k-try-icon, .k-header button[data-open-modal], .k-header .right-group > *, .k-menu-btn')].filter(vis);
				const mids = items.map((e) => r(e).top + r(e).height / 2);
				const right = [...document.querySelectorAll('.k-header .right-group > *')].filter(vis);
				const gaps = right.slice(1).map((e, i) => r(e).left - r(right[i]).right);
				const lw = document.querySelector('.page').getBoundingClientRect().width;
				return {
					spread: Math.max(...mids) - Math.min(...mids),
					inHeader: items.every((e) => r(e).left >= header.left - 0.5 && r(e).right <= header.right + 0.5),
					overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - lw,
					version: !!document.querySelector('.k-header .k-version'),
					toggle: !!document.querySelector('.k-header .k-tabs'),
					order: right.map((e) => (e.matches('k-section-menu') ? 'sections' : e.matches('.k-whatsnew') ? 'whatsnew' : e.matches('.k-try') ? 'try' : e.querySelector('.themebtn') || e.matches('klinos-theme-toggle, starlight-theme-select') ? 'theme' : e.tagName.toLowerCase())),
					minGap: gaps.length ? Math.min(...gaps) : null,
					trySolo: vis(document.querySelector('.k-header .k-try')),
					tryIcon: vis(document.querySelector('.k-header a.k-try-icon')) ? r(document.querySelector('.k-header a.k-try-icon')).height : 0,
					search: vis(document.querySelector('.k-header button[data-open-modal]')) ? r(document.querySelector('.k-header button[data-open-modal]')).height : 0,
					// No pill or circle anywhere in the header: every visible link or button's corner radius stays under half
					// its height.
					rounded: [...document.querySelectorAll('.k-header a, .k-header button')].filter(vis).filter((e) => parseFloat(getComputedStyle(e).borderTopLeftRadius) >= r(e).height / 2 - 0.5).map((e) => `${e.className || e.tagName} ${getComputedStyle(e).borderTopLeftRadius}/${r(e).height}`),
					tryRadius: [document.querySelector('.k-header .k-try'), document.querySelector('.k-header a.k-try-icon')].filter(vis).map((e) => getComputedStyle(e).borderTopLeftRadius),
					inputRadius: (() => {
						const probe = document.createElement('span');
						probe.style.borderTopLeftRadius = 'var(--k-r-nav)';
						document.body.append(probe);
						const v = getComputedStyle(probe).borderTopLeftRadius;
						probe.remove();
						return v;
					})(),
				};
			});
			const tag = `${theme} ${touch ? 'touch' : 'mouse'} ${w}: header`;
			headerRows.push({ theme, input: touch ? 'touch' : 'mouse', width: w, right: m.order.join(' / ') || '-', 'min gap': m.minGap?.toFixed(1) ?? '-', 'try icon': m.tryIcon, search: m.search, spread: +m.spread.toFixed(2), overflow: m.overflow });
			check(`${tag} has no version and no section toggle`, !m.version && !m.toggle);
			check(`${tag} on one centreline, inside the header, no overflow`, m.spread <= 1 && m.inHeader && m.overflow <= 0, `spread ${m.spread.toFixed(2)}, overflow ${m.overflow}`);
			check(`${tag}: no pill or circle shapes; Try it live ${w >= 981 ? 'button' : 'icon'} has the input radius`, m.rounded.length === 0 && m.tryRadius.length === 1 && m.tryRadius[0] === m.inputRadius, `${m.rounded.join('; ') || 'none'}; try ${m.tryRadius.join(',')}`);
			if (w >= 981) {
				check(`${tag}: section dropdown, What's new, Try it live, theme on the right, in that order`, m.order.join(',') === 'sections,whatsnew,try,theme' && m.trySolo, m.order.join(','));
				// The section dropdown: the trigger, then the open panel.
				const d = await p.evaluate(() => {
					const resolve = (prop, value) => {
						const probe = document.createElement('span');
						probe.style[prop] = value;
						document.body.append(probe);
						const c = getComputedStyle(probe)[prop];
						probe.remove();
						return c;
					};
					const t = document.querySelector('.k-header .k-secmenu-trigger');
					const wn = document.querySelector('.k-header .k-whatsnew');
					const look = (e) => {
						const c = getComputedStyle(e);
						return [c.fontSize, c.fontWeight, c.color, c.paddingTop, c.paddingRight, c.paddingBottom, c.paddingLeft, e.getBoundingClientRect().height].join(' ');
					};
					// The middle of a text line: the label, What's new and Try it live share one.
					const textMid = (e) => {
						const rg = document.createRange();
						rg.selectNodeContents(e);
						const b = rg.getClientRects()[0];
						return b.top + b.height / 2;
					};
					const tryText = [...document.querySelector('.k-header .k-try').childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
					const tryRange = document.createRange();
					tryRange.selectNodeContents(tryText);
					const tb = tryRange.getClientRects()[0];
					const tc = getComputedStyle(t);
					return {
						text: t.textContent.trim(),
						expanded: t.getAttribute('aria-expanded'),
						controls: t.getAttribute('aria-controls'),
						noBox: parseFloat(tc.borderTopWidth) === 0 && tc.backgroundColor === 'rgba(0, 0, 0, 0)',
						sameAsWhatsNew: look(t) === look(wn),
						looks: [look(t), look(wn)],
						mids: [textMid(t.querySelector('span')), textMid(wn), tb.top + tb.height / 2],
						chevron: !!t.querySelector('.k-secmenu-chev'),
						navActive: resolve('backgroundColor', 'var(--k-nav-active)'),
					};
				});
				check(`${tag}: section trigger has no box and looks exactly like "What's new" (font, weight, colour, padding, height), chevron after "Guide", aria-expanded false`, d.noBox && d.sameAsWhatsNew && d.chevron && d.text === 'Guide' && d.expanded === 'false' && !!d.controls, JSON.stringify(d.looks));
				check(`${tag}: "Guide", "What's new" and "Try it live" text on one line (±0.5px)`, Math.max(...d.mids) - Math.min(...d.mids) <= 0.5, d.mids.map((y) => y.toFixed(2)).join(' / '));
				await p.click('.k-header .k-secmenu-trigger');
				await p.waitForTimeout(120);
				const o = await p.evaluate((navActive) => {
					const t = document.querySelector('.k-header .k-secmenu-trigger');
					const panel = document.getElementById(t.getAttribute('aria-controls'));
					const pr = panel.getBoundingClientRect();
					const items = [...panel.querySelectorAll('.k-secmenu-item')].map((a) => {
						const desc = a.querySelector('.k-secmenu-desc');
						const lines = Math.round(desc.getBoundingClientRect().height / parseFloat(getComputedStyle(desc).lineHeight));
						return { title: a.querySelector('.k-secmenu-title').textContent.trim(), desc: desc.textContent.trim(), lines, href: a.getAttribute('href'), current: a.getAttribute('aria-current') === 'true', fill: getComputedStyle(a).backgroundColor === navActive };
					});
					return { expanded: t.getAttribute('aria-expanded'), shown: !panel.hidden, w: pr.width, rightDiff: pr.right - t.getBoundingClientRect().right, below: pr.top - t.getBoundingClientRect().bottom, items };
				}, d.navActive);
				check(`${tag}: panel opens (aria-expanded true), 280px, right edge on the trigger's, below it`, o.expanded === 'true' && o.shown && Math.abs(o.w - 280) <= 1 && Math.abs(o.rightDiff) <= 0.5 && o.below > 0, JSON.stringify({ w: o.w, rightDiff: o.rightDiff, below: o.below }));
				check(
					`${tag}: panel lists Guide and Develop with their descriptions (two lines at most) and first pages; Guide current (fill, aria-current)`,
					o.items.length === 2 &&
						o.items[0].title === 'Guide' && o.items[0].href === '/using-klinos/start-here/home/' && o.items[0].desc === 'How to use Klinos: the modes, the panel and everyday tasks.' &&
						o.items[1].title === 'Develop' && o.items[1].href === '/maintaining-klinos/understand/architecture/' && o.items[1].desc === 'How Klinos is built, maintained and released.' &&
						o.items.every((i) => i.lines <= 2) && o.items[0].current && o.items[0].fill && !o.items[1].current && !o.items[1].fill,
					JSON.stringify(o.items),
				);
				await p.keyboard.press('Escape');
				check(`${tag}: Esc closes it, focus back on the trigger`, await p.evaluate(() => { const t = document.querySelector('.k-header .k-secmenu-trigger'); return t.getAttribute('aria-expanded') === 'false' && document.activeElement === t; }));
				// 981–1100px keeps the narrow-band gap of 10px; wider, 16px.
				check(`${tag}: at least 10px between neighbours on the right`, m.minGap >= 10, `${m.minGap?.toFixed(1)}px`);
				check(`${tag}: no search button (search is in the sidebar)`, m.search === 0);
			} else {
				check(`${tag}: Try it live icon and search icon${touch ? ', 44px' : ''}`, touch ? m.tryIcon >= 44 && m.search >= 44 : m.tryIcon > 0 && m.search > 0, `${m.tryIcon} / ${m.search}`);
			}
		}
		await ctx.close();
	}
}

// ---------- Home: the current release links to its changelog entry and matches KLINOS_VERSION ----------
{
	const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
	await ctx.addInitScript(() => localStorage.setItem('klinos-whatsnew-v3', 'seen'));
	const p = await ctx.newPage();
	await p.goto(`${BASE}/using-klinos/start-here/home/`, { waitUntil: 'networkidle' });
	const anchor = `#v${VERSION.replace(/\./g, '')}`;
	const link = await p.evaluate(() => {
		const a = [...document.querySelectorAll('main a[href*="/changelog/#v"]')].find((x) => /current release/i.test(x.closest('p')?.textContent ?? ''));
		return a ? { text: a.textContent.trim(), href: a.getAttribute('href') } : null;
	});
	check(`Home: "The current release is v${VERSION}" links to the changelog's ${anchor}`, link?.text === `v${VERSION}` && link.href === `/using-klinos/reference/changelog/${anchor}`, JSON.stringify(link));
	await p.goto(`${BASE}/using-klinos/reference/changelog/`, { waitUntil: 'networkidle' });
	check(`Changelog: the ${anchor} entry exists`, await p.evaluate((id) => !!document.getElementById(id), anchor.slice(1)));
	await ctx.close();
}

// ---------- Home: the current release links to its changelog entry and matches KLINOS_VERSION ----------
{
	const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
	await ctx.addInitScript(() => localStorage.setItem('klinos-whatsnew-v3', 'seen'));
	const p = await ctx.newPage();
	await p.goto(`${BASE}/using-klinos/start-here/home/`, { waitUntil: 'networkidle' });
	const anchor = `#v${VERSION.replace(/\./g, '')}`;
	const link = await p.evaluate(() => {
		const a = [...document.querySelectorAll('main a[href*="/changelog/#v"]')].find((x) => /current release/i.test(x.closest('p')?.textContent ?? ''));
		return a ? { text: a.textContent.trim(), href: a.getAttribute('href') } : null;
	});
	check(`Home: "The current release is v${VERSION}" links to the changelog's ${anchor}`, link?.text === `v${VERSION}` && link.href === `/using-klinos/reference/changelog/${anchor}`, JSON.stringify(link));
	await p.goto(`${BASE}/using-klinos/reference/changelog/`, { waitUntil: 'networkidle' });
	check(`Changelog: the ${anchor} entry exists`, await p.evaluate((id) => !!document.getElementById(id), anchor.slice(1)));
	await ctx.close();
}

// ---------- Tablet/phone: the open "On this page" list sits above the page ----------
// For the centre of every visible list item, the topmost element must be that item (not page content), the
// list's background must be opaque, and it must fit on the screen. Scrolled to the top and scrolled down.
const mtocRows = [];
for (const theme of THEMES) {
	const ctx = await browser.newContext({ viewport: { width: 980, height: 900 }, hasTouch: true });
	await ctx.addInitScript((t) => {
		localStorage.setItem('klinos-whatsnew-v3', 'seen');
		localStorage.setItem('starlight-theme', t);
	}, theme);
	const p = await ctx.newPage();
	for (const w of [980, 900, 820, 768, 390]) {
		await p.setViewportSize({ width: w, height: w < 700 ? 844 : 900 });
		for (const [name, path] of [['Reordering (short list)', 'using-klinos/panel/panel-cards/'], ['Lighting (long list)', 'using-klinos/studio/lighting/']]) {
			for (const scrolled of [false, true]) {
				await p.goto(`${BASE}/${path}`, { waitUntil: 'networkidle' });
				if (scrolled) await p.evaluate(() => scrollTo(0, 1400));
				await p.waitForTimeout(150);
				const rowHitClosed = await p.evaluate(() => { const r = document.querySelector('.k-mtoc-row').getBoundingClientRect(); return !!document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('.k-mtoc-row'); });
				await p.$eval('.k-mtoc-row', (b) => b.click()); // a DOM click: a real tap fails when the bug covers the row
				await p.waitForTimeout(200);
				const m = await p.evaluate(() => {
					const list = document.getElementById('k-mtoc-list');
					const lr = list.getBoundingClientRect();
					const items = [...list.querySelectorAll('li')].filter((li) => { const r = li.getBoundingClientRect(); const y = r.top + r.height / 2; return y > lr.top && y < lr.bottom; });
					const covered = items.filter((li) => { const r = li.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !li.contains(hit); }).map((li) => { const r = li.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return `${li.textContent.trim().slice(0, 18)} ← ${hit?.tagName.toLowerCase()}.${(hit?.className + '').split(' ')[0]}`; });
					const bg = getComputedStyle(list).backgroundColor;
					const alpha = bg.startsWith('rgba') ? parseFloat(bg.split(',')[3]) : 1;
					const row = document.querySelector('.k-mtoc-row').getBoundingClientRect();
					const rowHit = document.elementFromPoint(row.left + row.width / 2, row.top + row.height / 2);
					return { items: items.length, covered, bg, alpha, fits: lr.bottom <= innerHeight + 0.5, scrolls: list.scrollHeight > list.clientHeight + 1, rowOnTop: !!rowHit?.closest('.k-mtoc-row') };
				});
				const tag = `${theme} ${w} ${name}${scrolled ? ' scrolled' : ''}: open list`;
				mtocRows.push({ theme, width: w, page: name, scrolled, items: m.items, covered: m.covered.length, bg: m.bg, fits: m.fits, 'scrolls inside': m.scrolls });
				check(`${tag}: every item is on top of the page`, m.items > 0 && m.covered.length === 0, m.covered.slice(0, 3).join('; '));
				check(`${tag}: opaque background`, m.alpha === 1, m.bg);
				check(`${tag}: fits on the screen`, m.fits);
				check(`${tag}: the row stays on top (closed and open)`, m.rowOnTop && rowHitClosed);
				await p.keyboard.press('Escape');
				check(`${tag}: Esc closes it`, await p.$eval('#k-mtoc-list', (l) => l.hidden));
			}
		}
	}
	// A list taller than the screen (Lighting on a short phone screen): capped to the screen, scrolls inside.
	await p.setViewportSize({ width: 390, height: 560 });
	await p.goto(`${BASE}/using-klinos/studio/lighting/`, { waitUntil: 'networkidle' });
	await p.tap('.k-mtoc-row');
	await p.waitForTimeout(200);
	const tall = await p.evaluate(() => {
		const l = document.getElementById('k-mtoc-list');
		const before = l.scrollTop;
		l.scrollTop = 10000;
		const last = l.querySelector('li:last-child').getBoundingClientRect();
		const hit = document.elementFromPoint(last.left + last.width / 2, last.top + last.height / 2);
		return { fits: l.getBoundingClientRect().bottom <= innerHeight + 0.5, scrolls: l.scrollHeight > l.clientHeight + 1, moved: l.scrollTop > before, lastOnTop: !!hit && l.contains(hit) };
	});
	check(`${theme} 390x560 long list: fits the screen and scrolls inside, last item reachable`, tall.fits && tall.scrolls && tall.moved && tall.lastOnTop, JSON.stringify(tall));
	await ctx.close();
}

// ---------- Desktop: the content's first line and the rail's label share a top ----------
const alignRows = [];
for (const theme of THEMES) {
	const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
	await ctx.addInitScript((t) => {
		localStorage.setItem('klinos-whatsnew-v3', 'seen');
		localStorage.setItem('starlight-theme', t);
	}, theme);
	const p = await ctx.newPage();
	for (const w of [1152, 1280, 1440]) {
		await p.setViewportSize({ width: w, height: 900 });
		for (const [name, path] of [['Lighting', 'using-klinos/studio/lighting/'], ['Device library', 'using-klinos/reference/device-library/'], ['About', 'using-klinos/start-here/about-klinos/']]) {
			await p.goto(`${BASE}/${path}`, { waitUntil: 'networkidle' });
			const tops = () =>
				p.evaluate(() => {
					const textTop = (e) => { const r = document.createRange(); r.selectNodeContents(e); return r.getClientRects()[0].top; };
					const crumbs = document.querySelector('main .crumbs');
					const label = document.querySelector('.right-sidebar-panel h2');
					return { crumbs: crumbs.getBoundingClientRect().top, crumbsText: textTop(crumbs), label: label.getBoundingClientRect().top, labelText: textTop(label), header: document.querySelector('header.header').getBoundingClientRect().bottom };
				});
			const t = await tops();
			await p.evaluate(() => scrollTo(0, 1500));
			await p.waitForTimeout(100);
			const labelScrolled = (await tops()).label;
			const tag = `${theme} ${w} ${name}`;
			alignRows.push({ theme, width: w, page: name, header: t.header, 'breadcrumb top': t.crumbs, 'rail label top': t.label, 'breadcrumb text': +t.crumbsText.toFixed(1), 'label text': +t.labelText.toFixed(1), 'label after scroll': labelScrolled });
			check(`${tag}: breadcrumb and rail label share a top`, Math.abs(t.crumbs - t.label) <= 1, `${t.crumbs} vs ${t.label}`);
			check(`${tag}: their text starts at the same height`, Math.abs(t.crumbsText - t.labelText) <= 1, `${t.crumbsText.toFixed(1)} vs ${t.labelText.toFixed(1)}`);
			check(`${tag}: rail label stays put while scrolling`, Math.abs(labelScrolled - t.label) <= 0.5, `${t.label} → ${labelScrolled}`);
		}
	}
	await ctx.close();
}

// ---------- Sidebar: pinned search field; one section at a time; group labels, links; the menu's section control ----------
// Desktop (981px and up): only the search field is pinned at the top of the sidebar ("Search docs", a Ctrl+K chip),
// 56px; 28px from its bottom edge to the middle of the first group label. No section toggle in the sidebar (the
// section dropdown is in the header). The menu (980px and below) has the section control at its top: a full-width
// 44px trigger that expands inline to the two sections, items at least 52px. Only the current section's groups are
// shown. The rhythm, between the middles of text lines (1x, tolerance 2px): link to link 36px, label to first link
// 30–32px, last link to next label 48px; on touch 44 / 38 / 59.
const USING_GROUPS = ['Start here', 'Studio', 'Photoreal', 'Playground', 'Working with the panel', 'Reference'];
const MAINTAINING_GROUPS = ['Understand', 'Work on it', 'Ship it'];
const SECTION_NAMES = { Using: 'Guide', Maintaining: 'Develop' };
const sidebarRows = [];
for (const [label, ctxOpts, theme, path, section] of [
	['1440 light, Guide page', { viewport: { width: 1440, height: 1000 } }, 'light', 'using-klinos/studio/staging/', 'Using'],
	['1440 dark, Guide page', { viewport: { width: 1440, height: 1000 } }, 'dark', 'using-klinos/studio/staging/', 'Using'],
	['1440 light, Develop page', { viewport: { width: 1440, height: 1000 } }, 'light', 'maintaining-klinos/work-on-it/local-setup/', 'Maintaining'],
	['981 light, Guide page', { viewport: { width: 981, height: 900 } }, 'light', 'using-klinos/studio/staging/', 'Using'],
	['820 touch, menu open', { viewport: { width: 820, height: 1000 }, hasTouch: true }, 'light', 'using-klinos/studio/staging/', 'Using'],
	['390 touch, menu open, Develop', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, 'dark', 'maintaining-klinos/work-on-it/local-setup/', 'Maintaining'],
]) {
	const touch = !!ctxOpts.hasTouch;
	const ctx = await browser.newContext(ctxOpts);
	await ctx.addInitScript((t) => {
		localStorage.setItem('klinos-whatsnew-v3', 'seen');
		localStorage.setItem('starlight-theme', t);
	}, theme);
	const p = await ctx.newPage();
	await p.goto(`${BASE}/${path}`, { waitUntil: 'networkidle' });
	if (touch) {
		await p.tap('.k-menu-btn');
		await p.waitForTimeout(300);
	}
	const m = await p.evaluate((touch) => {
		const r = (e) => e.getBoundingClientRect();
		// The box of an element's (first) text line, and its middle.
		const line = (e) => {
			const rg = document.createRange();
			rg.selectNodeContents(e);
			return rg.getClientRects()[0];
		};
		const mid = (e) => {
			const b = line(e);
			return b.top + b.height / 2;
		};
		// A token as the browser resolves it.
		const resolve = (prop, value) => {
			const probe = document.createElement('span');
			probe.style[prop] = value;
			document.body.append(probe);
			const c = getComputedStyle(probe)[prop];
			probe.remove();
			return c;
		};
		const muted = resolve('color', 'var(--k-ink-muted)');
		const ink = resolve('color', 'var(--k-ink)');
		const pill = resolve('backgroundColor', 'var(--k-nav-active)');
		const surface = resolve('backgroundColor', 'var(--k-surface)');
		const inputRadius = resolve('borderTopLeftRadius', 'var(--k-r-nav)');
		const pane = document.getElementById('starlight__sidebar');
		const items = [...pane.querySelectorAll('.top-level > li')];
		const groups = items.map((it) => ({
			label: it.querySelector(':scope > details > summary .large')?.textContent.trim() ?? null,
			links: [...it.querySelectorAll('a span')].map((s) => s.textContent.trim()),
		}));
		const linkSteps = [];
		const labelSteps = [];
		const groupSteps = [];
		items.forEach((it, i) => {
			const lab = it.querySelector(':scope > details > summary .large');
			const spans = [...it.querySelectorAll('a span')];
			if (lab) labelSteps.push(mid(spans[0]) - mid(lab));
			for (let k = 1; k < spans.length; k++) linkSteps.push(mid(spans[k]) - mid(spans[k - 1]));
			if (i > 0 && lab) groupSteps.push(mid(lab) - mid([...items[i - 1].querySelectorAll('a span')].at(-1)));
		});
		const labels = [...pane.querySelectorAll('.top-level > li > details > summary .large')].map((l) => getComputedStyle(l));
		const links = [...pane.querySelectorAll('.top-level a')];
		const current = links.find((a) => a.getAttribute('aria-current') === 'page');
		const out = {
			groups,
			linkSteps,
			labelSteps,
			groupSteps,
			labelStyle: labels.every((c) => c.fontSize === '13px' && +c.fontWeight < 600 && c.textTransform === 'none' && (c.letterSpacing === 'normal' || parseFloat(c.letterSpacing) === 0) && c.color === muted),
			labelSample: `${labels[0].fontSize} ${labels[0].fontWeight} ${labels[0].textTransform} ${labels[0].letterSpacing} ${labels[0].color}`,
			linkStyle: links
				.filter((a) => a !== current)
				.every((a) => {
					const c = getComputedStyle(a);
					return c.fontSize === '14px' && c.color === ink && +c.fontWeight === 400;
				}),
			activePill: !!current && getComputedStyle(current).backgroundColor === pill && +getComputedStyle(current).fontWeight >= 600,
			rows: links.map((a) => a.getBoundingClientRect().height),
			toggle: !!pane.querySelector('.k-tabs, .k-sb-pinned k-section-menu'),
			surface,
			inputRadius,
		};
		if (!touch) {
			const field = document.querySelector('.k-sb-search');
			const f = r(field);
			const icon = r(field.querySelector('.k-icon'));
			const span = field.querySelector(':scope > span');
			const st = line(span);
			const chip = field.querySelector(':scope > kbd');
			const c = r(chip);
			const linkText = line(links.find((a) => a !== current).querySelector('span'));
			const label0 = pane.querySelector('.top-level > li > details > summary .large');
			const pinned = document.querySelector('.k-sb-pinned');
			out.field = {
				label: field.getAttribute('aria-label'),
				text: span.textContent.trim(),
				chip: chip.textContent.trim(),
				chipRadius: parseFloat(getComputedStyle(chip).borderTopLeftRadius),
				chipH: c.height,
				chipFont: parseFloat(getComputedStyle(chip).fontSize),
				edges: [f.left - r(current).left, f.right - r(current).right],
				iconToText: icon.left - linkText.left,
				insets: [icon.left - f.left, f.right - c.right],
				mids: [icon.top + icon.height / 2, st.top + st.height / 2, c.top + c.height / 2].map((y) => y - (f.top + f.height / 2)),
				clear: c.left - st.right,
			};
			out.pinnedH = r(pinned).height;
			out.pinnedOnlyField = pinned.children.length === 1 && pinned.firstElementChild === field;
			out.fieldToLabel = mid(label0) - f.bottom;
			out.fieldTop = f.top;
		}
		return out;
	}, touch);
	const range = (a) => [Math.min(...a), Math.max(...a)];
	const fmt = (a) => `${a[0].toFixed(1)}–${a[1].toFixed(1)}`;
	const [L, G, S] = touch ? [44, 38, 59] : [36, 31, 48];
	const ls = range(m.linkSteps);
	const lab = range(m.labelSteps);
	const gs = range(m.groupSteps);
	const rowsOk = touch ? m.rows.every((h) => h >= 44) : m.rows.every((h) => Math.abs(h - 36) <= 0.5);
	const names = m.groups.map((g) => g.label);
	const expected = section === 'Using' ? USING_GROUPS : MAINTAINING_GROUPS;
	const photo = m.groups.find((g) => g.label === 'Photoreal');
	const sectionName = SECTION_NAMES[section];
	sidebarRows.push({ case: label, groups: names.length, 'link→link': fmt(ls), 'label→link': fmt(lab), 'link→next label': fmt(gs), pinned: m.pinnedH ?? '-', 'field→label': m.fieldToLabel?.toFixed(1) ?? '-' });
	check(`sidebar ${label}: no section title, no section toggle, only the ${sectionName} groups`, !m.toggle && names.join('|') === expected.join('|'), names.join(', '));
	check(`sidebar ${label}: link to link ${L}px (±2), text middles`, ls[0] >= L - 2 && ls[1] <= L + 2, fmt(ls));
	check(`sidebar ${label}: group label to first link ${touch ? `${G}px (±2)` : '30–32px'}, text middles`, touch ? lab[0] >= G - 2 && lab[1] <= G + 2 : lab[0] >= 30 && lab[1] <= 32, fmt(lab));
	check(`sidebar ${label}: last link to next group label ${S}px (±2), text middles`, gs[0] >= S - 2 && gs[1] <= S + 2, fmt(gs));
	check(`sidebar ${label}: group labels 13px, regular, sentence case, muted`, m.labelStyle, m.labelSample);
	check(`sidebar ${label}: links 14px, ink, regular; the current one the pill at 600`, m.linkStyle && m.activePill);
	if (section === 'Using') check(`sidebar ${label}: Photoreal is a group with one link, "Overview", between Studio and Playground`, names.indexOf('Studio') < names.indexOf('Photoreal') && names.indexOf('Photoreal') < names.indexOf('Playground') && photo?.links.length === 1 && photo.links[0] === 'Overview', JSON.stringify(photo));
	check(`sidebar ${label}: rows ${touch ? 'at least 44px (touch)' : '36px, no link wraps'}`, rowsOk, fmt(range(m.rows)));
	if (touch) {
		// The section control at the top of the menu: a full-width 44px trigger, expanding inline.
		const before = await p.evaluate(() => {
			const t = document.querySelector('#starlight__sidebar .k-secmenu-trigger');
			const pane = document.querySelector('#starlight__sidebar .sidebar-content').getBoundingClientRect();
			return { text: t.textContent.trim(), h: t.getBoundingClientRect().height, w: t.getBoundingClientRect().width, paneW: pane.width, expanded: t.getAttribute('aria-expanded') };
		});
		check(`menu ${label}: section control at the top, full width, 44px, showing "${sectionName}"`, Math.abs(before.h - 44) <= 0.5 && before.text === sectionName && before.expanded === 'false' && before.w >= before.paneW - 48, JSON.stringify(before));
		await p.tap('#starlight__sidebar .k-secmenu-trigger');
		await p.waitForTimeout(150);
		const open = await p.evaluate(() => {
			const t = document.querySelector('#starlight__sidebar .k-secmenu-trigger');
			const panel = document.getElementById(t.getAttribute('aria-controls'));
			return { expanded: t.getAttribute('aria-expanded'), position: getComputedStyle(panel).position, items: [...panel.querySelectorAll('.k-secmenu-item')].map((a) => ({ t: a.querySelector('.k-secmenu-title').textContent.trim(), h: a.getBoundingClientRect().height, current: a.getAttribute('aria-current') === 'true', desc: !!a.querySelector('.k-secmenu-desc')?.textContent.trim() })) };
		});
		check(`menu ${label}: expands inline to Guide and Develop, each at least 52px with a description, the current one marked`, open.expanded === 'true' && open.position === 'static' && open.items.length === 2 && open.items.every((i) => i.h >= 52 && i.desc) && open.items.find((i) => i.current)?.t === sectionName, JSON.stringify(open));
	} else {
		const f = m.field;
		check(`field ${label}: "Search docs", aria-label "Search documentation", chip "Ctrl+K" (or ⌘K) at 11px or more`, f.text === 'Search docs' && f.label === 'Search documentation' && /^(Ctrl\+K|⌘K)$/.test(f.chip) && f.chipFont >= 11, `${f.text} / ${f.chip} ${f.chipFont}px`);
		check(`field ${label}: chip is a rounded rectangle, not a pill (radius above 0, at most the input radius, under half its height)`, f.chipRadius > 0 && f.chipRadius <= parseFloat(m.inputRadius) && f.chipRadius < f.chipH / 2, `${f.chipRadius}px on ${f.chipH}px`);
		check(`field ${label}: edges on the active pill's edges, icon on the links' text edge, chip inset = icon inset (±0.5)`, f.edges.every((d) => Math.abs(d) <= 0.5) && Math.abs(f.iconToText) <= 0.5 && Math.abs(f.insets[0] - f.insets[1]) <= 0.5, JSON.stringify({ edges: f.edges, iconToText: f.iconToText, insets: f.insets }));
		check(`field ${label}: icon, text and chip vertically centred (±0.5), at least 12px between the text and the chip`, f.mids.every((d) => Math.abs(d) <= 0.5) && f.clear >= 12, `${f.mids.map((d) => d.toFixed(2)).join(', ')}; clear ${f.clear.toFixed(1)}`);
		check(`sidebar ${label}: the pinned block is the search field only (56px); 28px (±2) from the field to the middle of the first label`, m.pinnedOnlyField && Math.abs(m.pinnedH - 56) <= 0.5 && Math.abs(m.fieldToLabel - 28) <= 2, `${m.pinnedH}px, ${m.fieldToLabel.toFixed(1)}px`);
		// Pinned: the field stays put while the links scroll under it.
		await p.$eval('#starlight__sidebar', (e) => (e.scrollTop = 300));
		await p.waitForTimeout(100);
		const after = await p.evaluate(() => {
			const pane = document.getElementById('starlight__sidebar');
			const block = document.querySelector('.k-sb-pinned').getBoundingClientRect();
			return { scrolled: pane.scrollTop, top: document.querySelector('.k-sb-search').getBoundingClientRect().top, bg: getComputedStyle(document.querySelector('.k-sb-pinned')).backgroundColor, under: [...pane.querySelectorAll('.top-level a')].some((a) => { const x = a.getBoundingClientRect(); return x.top < block.bottom && x.bottom > block.top; }) };
		});
		await p.$eval('#starlight__sidebar', (e) => (e.scrollTop = 0));
		check(`sidebar ${label}: search field pinned on a solid surface while the links scroll`, Math.abs(after.top - m.fieldTop) <= 0.5 && after.bg === m.surface && (after.scrolled === 0 || after.under), JSON.stringify(after));
	}
	// Hover changes a link's background with a mouse only.
	const link = p.locator('#starlight__sidebar .top-level a:not([aria-current])').first();
	const before = await link.evaluate((e) => getComputedStyle(e).backgroundColor);
	await link.hover();
	await p.waitForTimeout(200);
	const after = await link.evaluate((e) => getComputedStyle(e).backgroundColor);
	check(`sidebar ${label}: hover ${touch ? 'does nothing on touch' : 'shows with a mouse'}`, touch ? before === after : before !== after, `${before} → ${after}`);
	await ctx.close();
}

// ---------- Cards (Home, About), the V2/V3 comparison table (About) and numbered steps (Lighting, Staging) ----------
const HOME_CARDS = [
	['Studio', '/using-klinos/studio/devices/'],
	['Photoreal', '/using-klinos/photoreal/photoreal/'],
	['Playground', '/using-klinos/playground/single-card/'],
];
const ABOUT_CARDS = ['Editable lighting', 'Staging and positioning', 'Sharper preview', 'Polished frame and Surface texture', 'Galaxy S26', 'Photoreal mode', 'Playground mode', 'Arrange the panel', 'Dark theme'];
const LIGHT_TITLES = ['Pick a Look', 'Check it against a neutral background', 'See where the lights are', 'Set the brightness', 'Fine-tune, if you need to'];
const cardsOn = (p) =>
	p.evaluate(() =>
		[...document.querySelectorAll('main ul.k-cards')].map((ul) => {
			const cards = [...ul.querySelectorAll(':scope > li > a.k-card')].map((a) => {
				const r = a.getBoundingClientRect();
				const d = a.querySelector('.k-card-desc');
				const lh = parseFloat(getComputedStyle(d).lineHeight);
				return { title: a.querySelector('.k-card-title').textContent, href: a.getAttribute('href'), top: Math.round(r.top), h: r.height, lines: Math.round(d.scrollHeight / lh), clipped: d.scrollHeight > d.clientHeight + 1, one: a.parentElement.children.length === 1 };
			});
			return { cols: getComputedStyle(ul).gridTemplateColumns.split(' ').length, cards };
		})
	);
for (const theme of THEMES) {
	for (const [w, h, touch] of [
		[1440, 900, false],
		[820, 1180, true],
		[390, 844, true],
	]) {
		const label = `${w}px ${theme}`;
		const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: w === 390 });
		await ctx.addInitScript((t) => {
			localStorage.setItem('klinos-whatsnew-v3', 'seen');
			localStorage.setItem('starlight-theme', t);
		}, theme);
		const p = await ctx.newPage();
		const cols = w >= 981 ? 3 : w >= 600 ? 2 : 1;
		const overflow = () => p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

		for (const [page, path, expectTitles] of [
			['Home', 'using-klinos/start-here/home/', HOME_CARDS.map((c) => c[0])],
			['About', 'using-klinos/start-here/about-klinos/', ABOUT_CARDS],
		]) {
			await p.goto(`${BASE}/${path}`, { waitUntil: 'networkidle' });
			await p.evaluate(() => document.fonts.ready);
			const [grid] = await cardsOn(p);
			const rowsOf = Object.values(Object.groupBy(grid.cards, (c) => c.top));
			check(`cards ${page} ${label}: ${expectTitles.length} cards in order, each one real <a href> filling its list item`, JSON.stringify(grid.cards.map((c) => c.title)) === JSON.stringify(expectTitles) && grid.cards.every((c) => c.href && c.one), grid.cards.map((c) => c.title).join(' | '));
			check(`cards ${page} ${label}: ${cols} column(s)`, grid.cols === cols && rowsOf[0].length === Math.min(cols, grid.cards.length), `${grid.cols} columns, first row ${rowsOf[0].length}`);
			check(`cards ${page} ${label}: equal heights in every row (±0.5px)`, rowsOf.every((r) => Math.max(...r.map((c) => c.h)) - Math.min(...r.map((c) => c.h)) <= 0.5), rowsOf.map((r) => r.map((c) => c.h.toFixed(1)).join('/')).join(', '));
			if (w === 1440) check(`cards ${page} ${label}: every description at most 3 lines and none cut off`, grid.cards.every((c) => c.lines <= 3 && !c.clipped), grid.cards.map((c) => c.lines).join(','));
			if (page === 'Home') check(`cards Home ${label}: each mode links to the first page of its sidebar group`, HOME_CARDS.every(([t, href]) => grid.cards.find((c) => c.title === t)?.href === href), grid.cards.map((c) => c.href).join(' '));
			if (page === 'Home' && w === 1440) {
				// Links go to real pages.
				const statuses = await Promise.all(grid.cards.map((c) => p.request.get(`${BASE}${c.href}`).then((r) => r.status())));
				check(`cards Home ${label}: every card link loads`, statuses.every((s) => s === 200), statuses.join(','));
			}
			if (page === 'About') {
				const t = await p.evaluate(() => {
					const table = document.querySelector('main .k-compare table');
					const r = (e) => e.getBoundingClientRect();
					const rows = [...table.querySelectorAll('tbody tr')];
					const firstRow = rows[0];
					return {
						caption: table.querySelector('caption')?.textContent,
						cols: [...table.querySelectorAll('thead th[scope="col"]')].map((e) => e.textContent),
						rowHeads: rows.every((tr) => tr.firstElementChild.matches('th[scope="row"]')),
						v3: getComputedStyle(firstRow.lastElementChild).backgroundColor,
						v2: getComputedStyle(firstRow.children[1]).backgroundColor,
						rowDisplay: getComputedStyle(firstRow).display,
						labels: [...firstRow.querySelectorAll('td')].map((td) => getComputedStyle(td, '::before').content),
						stacked: r(firstRow.children[1]).top > r(firstRow.firstElementChild).bottom - 1 && r(firstRow.lastElementChild).top > r(firstRow.children[1]).bottom - 1,
						inside: r(table).right <= r(document.querySelector('main .sl-markdown-content')).right + 1,
					};
				});
				const sunk = await p.evaluate(() => {
					const s = document.createElement('div');
					s.style.background = 'var(--k-sunk)';
					document.body.append(s);
					const c = getComputedStyle(s).backgroundColor;
					s.remove();
					return c;
				});
				check(`table About ${label}: caption, column headers V2 and V3, a row header on every row`, t.caption === 'V2 and V3 compared' && t.cols.join() === 'V2,V3' && t.rowHeads, JSON.stringify({ caption: t.caption, cols: t.cols }));
				check(`table About ${label}: the V3 column on --k-sunk, V2 not`, t.v3 === sunk && t.v2 !== sunk, `${t.v3} / ${t.v2}`);
				if (w === 390) check(`table About ${label}: rows stacked (label, then V2 and V3 lines with their labels), inside the column`, t.rowDisplay === 'block' && t.stacked && t.labels.join() === '"V2","V3"' && t.inside, JSON.stringify(t));
				else check(`table About ${label}: a real table row, side by side`, t.rowDisplay === 'table-row' && !t.stacked && t.inside, t.rowDisplay);
			}
			check(`cards ${page} ${label}: no horizontal scroll`, (await overflow()) <= 0, `${await overflow()}px`);
		}

		await p.goto(`${BASE}/using-klinos/studio/lighting/`, { waitUntil: 'networkidle' });
		await p.evaluate(() => document.fonts.ready);
		const s = await p.evaluate(() => {
			const ol = document.querySelector('main ol.k-steps');
			const items = [...ol.children];
			const r = (e) => e.getBoundingClientRect();
			return {
				tag: ol.tagName,
				cls: ol.className,
				lis: items.every((li) => li.tagName === 'LI'),
				badges: items.map((li) => {
					const b = li.querySelector('.k-step-num');
					const cs = getComputedStyle(b);
					return { n: b.textContent, w: r(b).width, h: r(b).height, radius: parseFloat(cs.borderTopLeftRadius) };
				}),
				lines: items.map((li) => {
					const a = getComputedStyle(li, '::after');
					return a.display !== 'none' && a.content !== 'none' && parseFloat(a.width) === 1;
				}),
				titles: items.map((li) => li.querySelector('.k-step-title')?.textContent),
				ownLine: items.every((li) => {
					const t = li.querySelector('.k-step-title');
					const next = t.nextElementSibling;
					return getComputedStyle(t).display === 'block' && r(next).top >= r(t).bottom - 0.5;
				}),
				level: items.every((li) => Math.abs(r(li.querySelector('.k-step-title')).top + 3.5 + 10.5 - (r(li.querySelector('.k-step-num')).top + 14)) <= 1.5),
				gaps: items.slice(1).map((li, i) => r(li).top - r(items[i]).bottom),
				textGap: r(items[0].querySelector('.k-step-body')).left - r(items[0].querySelector('.k-step-num')).right,
				bold4: items[3].querySelector('.k-step-body p > strong:first-child')?.textContent,
			};
		});
		check(`steps Lighting ${label}: a real <ol class="k-steps"> of 5 <li>, numbered 1–5`, s.tag === 'OL' && /k-steps/.test(s.cls) && s.lis && s.badges.map((b) => b.n).join('') === '12345', s.cls);
		check(`steps Lighting ${label}: badges equal 28px rounded squares (radius 8, not circles)`, s.badges.every((b) => b.w === 28 && b.h === 28 && b.radius === 8), JSON.stringify(s.badges[0]));
		check(`steps Lighting ${label}: a connecting line on every step but the last`, s.lines.slice(0, -1).every(Boolean) && !s.lines.at(-1), s.lines.join(','));
		check(`steps Lighting ${label}: titles without their full stop; "Brightness" stays bold in step 4`, JSON.stringify(s.titles) === JSON.stringify(LIGHT_TITLES) && s.bold4 === 'Brightness', s.titles.join(' | '));
		check(`steps Lighting ${label}: each title on its own line above its body, level with its badge`, s.ownLine && s.level);
		check(`steps Lighting ${label}: 28px between steps, 16px from badge to text`, s.gaps.every((g) => Math.abs(g - 28) <= 0.5) && Math.abs(s.textGap - 16) <= 0.5, `${s.gaps.map((g) => g.toFixed(1)).join(',')}; ${s.textGap}`);
		check(`steps Lighting ${label}: no horizontal scroll`, (await overflow()) <= 0, `${await overflow()}px`);

		await p.goto(`${BASE}/using-klinos/studio/staging/`, { waitUntil: 'networkidle' });
		const st = await p.evaluate(() => {
			const ol = document.querySelector('main ol.k-steps');
			return { n: ol.children.length, badges: ol.querySelectorAll('.k-step-num').length, titles: ol.querySelectorAll('.k-step-title').length };
		});
		check(`steps Staging ${label}: an untitled list gets badges and no titles`, st.n === 4 && st.badges === 4 && st.titles === 0, JSON.stringify(st));
		await ctx.close();
	}
}

// ---------- Home: the "Try Klinos in your browser" banner (layout A: bleeding preview) ----------
// Side by side when the card is 680px or wider, stacked below that; the text and the window never overlap.
// Stacked: the window shows first (CSS order; the DOM keeps the text first), cut by the card's top and sides,
// 200–240px tall on phones and 260px otherwise, ending in a --k-line2 hairline above the text.
const bannerRows = [];
for (const theme of THEMES) {
	for (const [w, h, touch] of [
		[390, 844, true],
		[728, 1000, true],
		[768, 1000, true],
		[820, 1180, true],
		[900, 1000, true],
		[980, 1000, true],
		[981, 900, false],
		[1000, 900, false],
		[1024, 900, false],
		[1100, 900, false],
		[1200, 900, false],
		[1300, 900, false],
		[1440, 900, false],
		[1600, 900, false],
	]) {
		const label = `${w}px ${theme}`;
		const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: w === 390 });
		await ctx.addInitScript((t) => {
			localStorage.setItem('klinos-whatsnew-v3', 'seen');
			localStorage.setItem('starlight-theme', t);
		}, theme);
		const p = await ctx.newPage();
		await p.goto(`${BASE}/using-klinos/start-here/home/`, { waitUntil: 'networkidle' });
		await p.evaluate(() => document.fonts.ready);
		// Give the theme's panel image up to 5 s to load where it sits (no scrolling: the banner is in the first screen).
		await p.evaluate(() => {
			const img = [...document.querySelectorAll('main .try-window-shot img')].find((i) => getComputedStyle(i).display !== 'none');
			if (!img || img.complete) return;
			return Promise.race([new Promise((r) => img.addEventListener('load', r, { once: true })), new Promise((r) => setTimeout(r, 5000))]);
		});
		const b = await p.evaluate(() => {
			const card = document.querySelector('main aside.try-card');
			const q = (s) => card.querySelector(s);
			const r = (e) => e.getBoundingClientRect();
			const cs = (e) => getComputedStyle(e);
			// Words on the last rendered line of an element.
			const lastLineWords = (el) => {
				const words = [];
				const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
				for (let n; (n = walker.nextNode()); ) {
					for (const m of n.data.matchAll(/\S+/g)) {
						const range = document.createRange();
						range.setStart(n, m.index);
						range.setEnd(n, m.index + m[0].length);
						const rect = range.getClientRects()[0];
						if (rect) words.push(Math.round(rect.top));
					}
				}
				const last = Math.max(...words);
				return { lines: new Set(words).size, last: words.filter((t) => Math.abs(t - last) <= 2).length };
			};
			const clipped = ['.try-card-eyebrow', '.try-card-title', '.try-card-desc', 'a.try-btn'].filter((s) => {
				const e = q(s);
				return e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1 || r(e).right > r(card).right + 0.5 || r(e).left < r(card).left - 0.5;
			});
			const body = r(q('.try-card-body'));
			const textRight = Math.max(...['.try-card-eyebrow', '.try-card-title', '.try-card-desc', '.try-card-actions'].map((s) => r(q(s)).right));
			const textBottom = r(q('.try-card-actions')).bottom;
			const win = r(q('.try-window'));
			const c = r(card);
			const img = [...card.querySelectorAll('.try-window-shot img')].find((i) => cs(i).display !== 'none');
			const btn = q('a.try-btn');
			// The part of a box that shows inside the card (the card clips the window and the image).
			const shown = (b) => ({ w: Math.max(0, Math.min(b.right, c.right) - Math.max(b.left, c.left)), h: Math.max(0, Math.min(b.bottom, c.bottom) - Math.max(b.top, c.top)) });
			const wcs = cs(q('.try-window'));
			const side = cs(q('.try-card-inner')).display === 'grid';
			const eyebrowTop = r(q('.try-card-eyebrow')).top;
			const line2 = (() => {
				const s = document.createElement('div');
				s.style.color = 'var(--k-line2)';
				card.append(s);
				const v = cs(s).color;
				s.remove();
				return v;
			})();
			const focusable = card.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
			const h1 = r(document.querySelector('h1#_top'));
			return {
				side,
				winAbove: win.bottom <= eyebrowTop + 0.5,
				domTextFirst: !!(q('.try-card-body').compareDocumentPosition(q('.try-window')) & Node.DOCUMENT_POSITION_FOLLOWING),
				winH: win.height,
				gap: eyebrowTop - win.bottom,
				hairline: `${wcs.borderBottomWidth} ${wcs.borderBottomStyle} ${wcs.borderBottomColor === line2}`,
				focusable: focusable.length,
				dotsHidden: q('.try-window-bar').getAttribute('aria-hidden') === 'true',
				imgW: img ? r(img).width : 0,
				// Phones: the bottom of the button if the banner started where the page content starts (the h1).
				foldBtn: h1.top + scrollY + (r(btn).bottom - c.top),
				cardW: c.width,
				cardH: c.height,
				column: r(document.querySelector('main .sl-markdown-content')).width,
				radius: cs(card).borderTopLeftRadius,
				overflow: cs(card).overflow,
				noOverlap: side ? win.left >= textRight && win.left >= body.right - 0.5 : win.bottom <= eyebrowTop + 0.5,
				bleed: side ? win.right > c.right && win.bottom > c.bottom : win.left < c.left && win.right > c.right && win.top < c.top + card.clientTop,
				btnH: r(btn).height,
				btnRadius: cs(btn).borderTopLeftRadius,
				btnW: r(btn).width,
				bodyW: body.width,
				actionsW: r(q('.try-card-actions')).width,
				links: [...card.querySelectorAll('a')].map((a) => a.getAttribute('href')),
				winStyle: `${wcs.display}/${wcs.visibility}/${wcs.opacity}`,
				winShown: shown(win),
				imgShown: img ? shown(r(img)) : { w: 0, h: 0 },
				imgLoaded: !!img && img.complete && img.naturalWidth > 0,
				textMid: (r(q('.try-card-eyebrow')).top + r(q('.try-card-actions')).bottom) / 2 - c.top,
				title: lastLineWords(q('.try-card-title')),
				desc: lastLineWords(q('.try-card-desc')),
				descW: r(q('.try-card-desc')).width,
				clipped,
				img: img && { src: img.getAttribute('src'), alt: img.alt },
				eyebrow: q('.try-card-eyebrow').innerText,
				hscroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
			};
		});
		bannerRows.push({ width: w, theme, layout: b.side ? 'side by side' : 'stacked', card: `${b.cardW.toFixed(0)}×${b.cardH.toFixed(0)}`, text: b.bodyW.toFixed(0), desc: b.descW.toFixed(0), window: `${b.winShown.w.toFixed(0)}×${b.winShown.h.toFixed(0)}`, gap: b.side ? '' : b.gap.toFixed(0), title: `${b.title.lines} lines, last ${b.title.last}`, description: `${b.desc.lines} lines, last ${b.desc.last}` });
		check(`banner ${label}: the card fills the column, 16px radius, overflow hidden`, Math.abs(b.cardW - b.column) <= 1 && b.radius === '16px' && b.overflow === 'hidden', `${b.cardW} / ${b.column}, ${b.radius}, ${b.overflow}`);
		check(`banner ${label}: side by side only when the card is at least 680px wide, otherwise stacked`, b.side === b.cardW >= 680, `${b.side ? 'side' : 'stacked'} at ${b.cardW.toFixed(0)}px`);
		if (b.side) check(`banner ${label}: side by side at least 360px tall, the text block centred (±2px)`, b.cardH >= 360 && Math.abs(b.textMid - b.cardH / 2) <= 2, `${b.cardH}, text middle ${b.textMid.toFixed(1)}`);
		check(`banner ${label}: the window shows, with a real size (at least 240×200 inside the card)`, b.winStyle === 'block/visible/1' && b.winShown.w >= 240 && b.winShown.h >= 200, `${b.winStyle} ${JSON.stringify(b.winShown)}`);
		check(`banner ${label}: the panel image loaded and shows (at least 200×150 inside the card)`, b.imgLoaded && b.imgShown.w >= 200 && b.imgShown.h >= 150, `${b.imgLoaded} ${JSON.stringify(b.imgShown)}`);
		check(`banner ${label}: the text and the window don't overlap`, b.noOverlap);
		check(`banner ${label}: the window is cut by the card (${b.side ? 'right and bottom' : 'top and both sides'})`, b.bleed);
		if (!b.side) {
			const [lo, hi] = w < 600 ? [200, 240] : [259.5, 260.5];
			check(`banner ${label}: stacked: the window shows above the eyebrow; the DOM keeps the text first`, b.winAbove && b.domTextFirst);
			check(`banner ${label}: stacked: window ${w < 600 ? '200–240' : '260'}px tall, ending in a 1px --k-line2 hairline`, b.winH >= lo && b.winH <= hi && b.hairline === '1px solid true', `${b.winH}px, ${b.hairline}`);
			check(`banner ${label}: stacked: at least ${w < 600 ? 28 : 32}px from the hairline to the eyebrow`, b.gap >= (w < 600 ? 28 : 32) - 0.5, `${b.gap}px`);
			check(`banner ${label}: stacked: the panel image is cut, not shrunk (at least 600px wide)`, b.imgW >= 600, `${b.imgW}px`);
		}
		if (w === 390) check(`banner ${label}: phones: title, description and button fit in 844px if the banner starts at the top of the content`, b.foldBtn <= 844, `button bottom at ${b.foldBtn.toFixed(0)}px`);
		check(`banner ${label}: the button is the only focusable element; the window's dots are aria-hidden`, b.focusable === 1 && b.dotsHidden, `${b.focusable}`);
		check(`banner ${label}: no horizontal scroll`, b.hscroll <= 0, `${b.hscroll}px`);
		check(`banner ${label}: the primary button is ${touch ? 44 : 42}px tall with a 10px radius`, Math.abs(b.btnH - (touch ? 44 : 42)) <= 0.5 && b.btnRadius === '10px', `${b.btnH}px, ${b.btnRadius}`);
		if (w === 390) check(`banner ${label}: on phones the button is full width`, Math.abs(b.btnW - b.actionsW) <= 1, `${b.btnW} / ${b.actionsW}`);
		check(`banner ${label}: one link only, the button to Try it live (no text link)`, b.links.join() === '/using-klinos/reference/try-it-live/', b.links.join(' '));
		check(`banner ${label}: no orphan: the last line of the title and of the description has 2 or more words`, b.title.last >= 2 && b.desc.last >= 2, `title ${JSON.stringify(b.title)}, description ${JSON.stringify(b.desc)}`);
		check(`banner ${label}: no text clipped or outside the card`, b.clipped.length === 0, b.clipped.join(', '));
		check(`banner ${label}: the ${theme} panel image is the one shown, with its alt text`, b.img?.src === `/media/banner/try-live${theme === 'dark' ? '-dark' : ''}.webp` && /Klinos panel in the browser, showing an iPhone 17 Pro/.test(b.img.alt), JSON.stringify(b.img));
		check(`banner ${label}: eyebrow reads LIVE DEMO`, b.eyebrow === 'LIVE DEMO', b.eyebrow);
		await ctx.close();
	}
}

await browser.close();
console.table(bannerRows);
console.table(sidebarRows);
console.table(mtocRows.filter((r) => r.theme === 'light'));
console.table(alignRows.filter((r) => r.theme === 'light'));
console.table(rows.filter((r) => r.theme === 'light'));
console.table(headerRows.filter((r) => r.theme === 'light'));
const failed = results.filter((r) => r.result !== 'PASS');
if (failed.length) console.table(failed.slice(0, 40));
console.log(failed.length ? `${failed.length} of ${results.length} check(s) failed` : `all ${results.length} checks pass`);
process.exit(failed.length ? 1 : 0);
