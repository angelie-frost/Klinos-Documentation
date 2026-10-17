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

// ---------- Header: logo and title left; What's new, Try it live and theme right; no version, no toggle ----------
// Desktop (981px and up): the right group in that order, at least 12px between neighbours, the header search button
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
					order: right.map((e) => (e.matches('.k-whatsnew') ? 'whatsnew' : e.matches('.k-try') ? 'try' : e.querySelector('.themebtn') || e.matches('klinos-theme-toggle, starlight-theme-select') ? 'theme' : e.tagName.toLowerCase())),
					minGap: gaps.length ? Math.min(...gaps) : null,
					trySolo: vis(document.querySelector('.k-header .k-try')),
					tryIcon: vis(document.querySelector('.k-header a.k-try-icon')) ? r(document.querySelector('.k-header a.k-try-icon')).height : 0,
					search: vis(document.querySelector('.k-header button[data-open-modal]')) ? r(document.querySelector('.k-header button[data-open-modal]')).height : 0,
				};
			});
			const tag = `${theme} ${touch ? 'touch' : 'mouse'} ${w}: header`;
			headerRows.push({ theme, input: touch ? 'touch' : 'mouse', width: w, right: m.order.join(' / ') || '-', 'min gap': m.minGap?.toFixed(1) ?? '-', 'try icon': m.tryIcon, search: m.search, spread: +m.spread.toFixed(2), overflow: m.overflow });
			check(`${tag} has no version and no section toggle`, !m.version && !m.toggle);
			check(`${tag} on one centreline, inside the header, no overflow`, m.spread <= 1 && m.inHeader && m.overflow <= 0, `spread ${m.spread.toFixed(2)}, overflow ${m.overflow}`);
			if (w >= 981) {
				check(`${tag}: What's new, Try it live, theme on the right, in that order`, m.order.join(',') === 'whatsnew,try,theme' && m.trySolo, m.order.join(','));
				// 981–1100px keeps the narrow-band gap of 10px (restored from before Stage 14); wider, 16px.
				const minGap = w <= 1100 ? 10 : 12;
				check(`${tag}: at least ${minGap}px between neighbours on the right`, m.minGap >= minGap, `${m.minGap?.toFixed(1)}px`);
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

// ---------- Sidebar: pinned search field and section toggle; one section at a time; group labels, links ----------
// Desktop (981px and up): a pinned block at the top of the sidebar, the search field ("Search docs", a Ctrl+K chip)
// and, 8px under it, the "User guide / Team handbook" toggle (the field's width, 36px, the input radius); 28px from
// the toggle's bottom to the middle of the first group label. The menu (980px and below) has the toggle at its top,
// 44px options. Only the current section's groups are shown. The rhythm, between the middles of text lines (1x,
// tolerance 2px): link to link 36px, label to first link 30–32px, last link to next label 48px; on touch 44 / 38 / 59.
const USING_GROUPS = ['Start here', 'Studio', 'Photoreal', 'Playground', 'Working with the panel', 'Reference'];
const MAINTAINING_GROUPS = ['Understand', 'Work on it', 'Ship it'];
const SECTION_NAMES = { Using: 'User guide', Maintaining: 'Team handbook' };
const sidebarRows = [];
for (const [label, ctxOpts, theme, path, section] of [
	['1440 light, User guide page', { viewport: { width: 1440, height: 1000 } }, 'light', 'using-klinos/studio/staging/', 'Using'],
	['1440 dark, User guide page', { viewport: { width: 1440, height: 1000 } }, 'dark', 'using-klinos/studio/staging/', 'Using'],
	['1440 light, Team handbook page', { viewport: { width: 1440, height: 1000 } }, 'light', 'maintaining-klinos/work-on-it/local-setup/', 'Maintaining'],
	['981 light, User guide page', { viewport: { width: 981, height: 900 } }, 'light', 'using-klinos/studio/staging/', 'Using'],
	['820 touch, menu open', { viewport: { width: 820, height: 1000 }, hasTouch: true }, 'light', 'using-klinos/studio/staging/', 'Using'],
	['390 touch, menu open, Team handbook', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, 'dark', 'maintaining-klinos/work-on-it/local-setup/', 'Maintaining'],
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
		const control = pane.querySelector(touch ? '.k-tabs-menu' : '.k-sb-pinned .k-tabs-sidebar');
		const tabs = [...control.querySelectorAll('.k-tab')].map((a) => {
			const c = getComputedStyle(a);
			const inner = r(a).width - 2 * parseFloat(c.borderLeftWidth) - parseFloat(c.paddingLeft) - parseFloat(c.paddingRight);
			return { text: a.textContent.trim(), href: a.getAttribute('href'), current: a.getAttribute('aria-current') === 'true', color: c.color, weight: +c.fontWeight, bg: c.backgroundColor, border: parseFloat(c.borderTopWidth) > 0 && c.borderTopColor !== 'rgba(0, 0, 0, 0)', w: r(a).width, h: r(a).height, oneLine: line(a).width <= inner + 0.5 && document.createRange().getClientRects && a.getClientRects().length === 1, fontSize: c.fontSize };
		});
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
			tabs,
			muted,
			ink,
			surface,
			control: { w: r(control).width, h: r(control).height, radius: getComputedStyle(control).borderTopLeftRadius },
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
			out.toggleGap = r(control).top - f.bottom;
			out.toggleToLabel = mid(label0) - r(control).bottom;
			out.fieldW = f.width;
			out.pinnedTop = [f.top, r(control).top];
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
	const tabCurrent = m.tabs.find((t) => t.current);
	const tabOther = m.tabs.find((t) => !t.current);
	const sectionName = SECTION_NAMES[section];
	sidebarRows.push({ case: label, groups: names.length, 'link→link': fmt(ls), 'label→link': fmt(lab), 'link→next label': fmt(gs), toggle: `${m.control.w.toFixed(1)}×${m.control.h.toFixed(1)}`, 'field→toggle': m.toggleGap?.toFixed(1) ?? '-', 'toggle→label': m.toggleToLabel?.toFixed(1) ?? '-' });
	check(`sidebar ${label}: no section title, only the ${sectionName} groups`, names.join('|') === expected.join('|'), names.join(', '));
	check(`sidebar ${label}: link to link ${L}px (±2), text middles`, ls[0] >= L - 2 && ls[1] <= L + 2, fmt(ls));
	check(`sidebar ${label}: group label to first link ${touch ? `${G}px (±2)` : '30–32px'}, text middles`, touch ? lab[0] >= G - 2 && lab[1] <= G + 2 : lab[0] >= 30 && lab[1] <= 32, fmt(lab));
	check(`sidebar ${label}: last link to next group label ${S}px (±2), text middles`, gs[0] >= S - 2 && gs[1] <= S + 2, fmt(gs));
	check(`sidebar ${label}: group labels 13px, regular, sentence case, muted`, m.labelStyle, m.labelSample);
	check(`sidebar ${label}: links 14px, ink, regular; the current one the pill at 600`, m.linkStyle && m.activePill);
	if (section === 'Using') check(`sidebar ${label}: Photoreal is a group with one link, "Overview", between Studio and Playground`, names.indexOf('Studio') < names.indexOf('Photoreal') && names.indexOf('Photoreal') < names.indexOf('Playground') && photo?.links.length === 1 && photo.links[0] === 'Overview', JSON.stringify(photo));
	check(`sidebar ${label}: rows ${touch ? 'at least 44px (touch)' : '36px, no link wraps'}`, rowsOk, fmt(range(m.rows)));
	// The section toggle.
	check(
		`toggle ${label}: "User guide" / "Team handbook"; "${sectionName}" raised (surface, hairline, ink, 500, aria-current), the other muted with no fill; right links`,
		m.tabs.length === 2 &&
			tabCurrent?.text === sectionName &&
			tabCurrent.color === m.ink &&
			tabCurrent.weight >= 500 &&
			tabCurrent.bg === m.surface &&
			tabCurrent.border &&
			tabOther.color === m.muted &&
			tabOther.bg === 'rgba(0, 0, 0, 0)' &&
			m.tabs.find((t) => t.text === 'User guide')?.href === '/using-klinos/start-here/home/' &&
			m.tabs.find((t) => t.text === 'Team handbook')?.href === '/maintaining-klinos/understand/architecture/',
		JSON.stringify(m.tabs.map((t) => [t.text, t.current, t.bg, t.color])),
	);
	check(`toggle ${label}: two equal halves, labels 13px on one line, track radius = input radius`, Math.abs(m.tabs[0].w - m.tabs[1].w) <= 0.5 && m.tabs.every((t) => t.oneLine && t.fontSize === '13px') && m.control.radius === m.inputRadius, `${m.tabs.map((t) => t.w.toFixed(1)).join(' / ')}, radius ${m.control.radius}`);
	if (touch) check(`toggle ${label}: options 44px tall in the menu`, m.tabs.every((t) => Math.abs(t.h - 44) <= 0.5), m.tabs.map((t) => t.h).join(', '));
	else {
		const f = m.field;
		check(`field ${label}: "Search docs", aria-label "Search documentation", chip "Ctrl+K" (or ⌘K) at 11px or more`, f.text === 'Search docs' && f.label === 'Search documentation' && /^(Ctrl\+K|⌘K)$/.test(f.chip) && f.chipFont >= 11, `${f.text} / ${f.chip} ${f.chipFont}px`);
		check(`field ${label}: chip is a rounded rectangle, not a pill (radius above 0, at most the input radius, under half its height)`, f.chipRadius > 0 && f.chipRadius <= parseFloat(m.inputRadius) && f.chipRadius < f.chipH / 2, `${f.chipRadius}px on ${f.chipH}px`);
		check(`field ${label}: edges on the active pill's edges, icon on the links' text edge, chip inset = icon inset (±0.5)`, f.edges.every((d) => Math.abs(d) <= 0.5) && Math.abs(f.iconToText) <= 0.5 && Math.abs(f.insets[0] - f.insets[1]) <= 0.5, JSON.stringify({ edges: f.edges, iconToText: f.iconToText, insets: f.insets }));
		check(`field ${label}: icon, text and chip vertically centred (±0.5), at least 12px between the text and the chip`, f.mids.every((d) => Math.abs(d) <= 0.5) && f.clear >= 12, `${f.mids.map((d) => d.toFixed(2)).join(', ')}; clear ${f.clear.toFixed(1)}`);
		check(`toggle ${label}: under the field, same width, 36px tall, 8px gap`, Math.abs(m.control.w - m.fieldW) <= 0.5 && Math.abs(m.control.h - 36) <= 0.5 && Math.abs(m.toggleGap - 8) <= 0.5, `${m.control.w}×${m.control.h}, gap ${m.toggleGap}`);
		check(`toggle ${label}: 28px (±2) from its bottom edge to the middle of the first group label`, Math.abs(m.toggleToLabel - 28) <= 2, m.toggleToLabel.toFixed(1));
		// Pinned together: both stay put while the links scroll under them.
		await p.$eval('#starlight__sidebar', (e) => (e.scrollTop = 300));
		await p.waitForTimeout(100);
		const after = await p.evaluate(() => {
			const pane = document.getElementById('starlight__sidebar');
			const block = document.querySelector('.k-sb-pinned').getBoundingClientRect();
			return { scrolled: pane.scrollTop, tops: [document.querySelector('.k-sb-search').getBoundingClientRect().top, document.querySelector('.k-sb-pinned .k-tabs').getBoundingClientRect().top], bg: getComputedStyle(document.querySelector('.k-sb-pinned')).backgroundColor, under: [...pane.querySelectorAll('.top-level a')].some((a) => { const x = a.getBoundingClientRect(); return x.top < block.bottom && x.bottom > block.top; }) };
		});
		await p.$eval('#starlight__sidebar', (e) => (e.scrollTop = 0));
		check(`sidebar ${label}: search and toggle pinned together on a solid surface while the links scroll`, after.tops.every((t, i) => Math.abs(t - m.pinnedTop[i]) <= 0.5) && after.bg === m.surface && (after.scrolled === 0 || after.under), JSON.stringify(after));
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

await browser.close();
console.table(sidebarRows);
console.table(mtocRows.filter((r) => r.theme === 'light'));
console.table(alignRows.filter((r) => r.theme === 'light'));
console.table(rows.filter((r) => r.theme === 'light'));
console.table(headerRows.filter((r) => r.theme === 'light'));
const failed = results.filter((r) => r.result !== 'PASS');
if (failed.length) console.table(failed.slice(0, 40));
console.log(failed.length ? `${failed.length} of ${results.length} check(s) failed` : `all ${results.length} checks pass`);
process.exit(failed.length ? 1 : 0);
