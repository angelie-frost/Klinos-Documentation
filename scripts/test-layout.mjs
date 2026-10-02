// Layout test across the tablet/desktop switch (980/981px). Usage: node scripts/test-layout.mjs [baseUrl]   (a built site, e.g. npm run preview)
// At 800–980px there is no sidebar column: the content must sit centred with the same gutters as at 768px.
// At every width: no horizontal overflow, and the header items share one centreline (spread <= 1px).
import { chromium } from 'playwright-core';

const BASE = process.argv[2] || 'http://localhost:4322';
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
				const header = [...document.querySelectorAll('.k-header .brand, .k-header .k-version, .k-header a.k-try-icon, .k-header button[data-open-modal], .k-header .right-group > *, .k-menu-btn')].filter(vis);
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

// ---------- Header: the version next to the title ----------
const headerRows = [];
for (const theme of THEMES) {
	for (const touch of [false, true]) {
		const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 }, ...(touch ? { hasTouch: true, isMobile: true } : {}) });
		await ctx.addInitScript((t) => {
			localStorage.setItem('klinos-whatsnew-v3', 'seen');
			localStorage.setItem('starlight-theme', t);
		}, theme);
		const p = await ctx.newPage();
		for (const w of touch ? [980, 820, 768, 390, 360, 340] : [1100, 981, 980, 820, 768, 390, 360, 340]) {
			await p.setViewportSize({ width: w, height: 800 });
			await p.goto(`${BASE}/using-klinos/studio/screen/`, { waitUntil: 'networkidle' });
			const m = await p.evaluate(() => {
				const vis = (e) => e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0;
				const r = (e) => e.getBoundingClientRect();
				// The text baseline of an element: the top of its first text run plus the font's ascent.
				const canvas = document.createElement('canvas').getContext('2d');
				const baseline = (e) => {
					const text = [...e.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
					const range = document.createRange();
					range.selectNodeContents(text);
					const cs = getComputedStyle(e);
					canvas.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
					return range.getClientRects()[0].top + canvas.measureText(text.textContent).fontBoundingBoxAscent;
				};
				const v = document.querySelector('.k-header .k-version');
				const small = document.querySelector('.k-header .brand small');
				const titleEnd = vis(small) ? small : document.querySelector('.k-header .brand > span');
				const items = [...document.querySelectorAll('.k-header .brand, .k-header .k-version, .k-header a.k-try-icon, .k-header button[data-open-modal], .k-header .right-group > *, .k-menu-btn')].filter(vis);
				const mids = items.map((e) => r(e).top + r(e).height / 2);
				const header = r(document.querySelector('.k-header'));
				const lw = document.querySelector('.page').getBoundingClientRect().width;
				return {
					shown: vis(v),
					text: v.textContent,
					href: v.getAttribute('href'),
					label: v.getAttribute('aria-label'),
					copies: [...document.querySelectorAll('body *')].filter((e) => e.children.length === 0 && /^v3\.15$/.test(e.textContent.trim())).length,
					titleText: titleEnd.textContent,
					gap: vis(v) ? r(v).left + parseFloat(getComputedStyle(v).paddingLeft) - r(titleEnd).right : null,
					baselineDiff: vis(v) ? Math.abs(baseline(v) - baseline(titleEnd)) : null,
					oneLine: vis(v) ? v.getClientRects().length === 1 && r(v).height <= 48 : true,
					height: vis(v) ? r(v).height : null,
					fontSize: getComputedStyle(v).fontSize,
					font: getComputedStyle(v).fontFamily.split(',')[0],
					weight: getComputedStyle(v).fontWeight,
					underline: getComputedStyle(v).textDecorationLine,
					spread: Math.max(...mids) - Math.min(...mids),
					inHeader: items.every((e) => r(e).left >= header.left - 0.5 && r(e).right <= header.right + 0.5),
					overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - lw,
				};
			});
			const tag = `${theme} ${touch ? 'touch' : 'mouse'} ${w}: version`;
			headerRows.push({ theme, input: touch ? 'touch' : 'mouse', width: w, shown: m.shown, 'title before it': m.titleText, gap: m.gap?.toFixed(1), 'baseline diff': m.baselineDiff?.toFixed(2), height: m.height, spread: +m.spread.toFixed(2), overflow: m.overflow });
			check(`${tag} text, link and label`, m.text === 'v3.15' && m.href === '/using-klinos/reference/changelog/' && m.label === 'Version 3.15, open the changelog');
			check(`${tag} 12px Geist Mono, regular, no underline`, m.fontSize === '12px' && m.font.includes('Geist Mono') && m.weight === '400' && m.underline === 'none', `${m.fontSize} ${m.font} ${m.weight} ${m.underline}`);
			check(`${tag} shown once`, m.copies === 1,`${m.copies} copies`);
			check(`${tag} header fits: no overflow, items inside the header`, m.overflow <= 0 && m.inHeader, `${m.overflow}px`);
			check(`${tag} header on one centreline`, m.spread <= 1, `${m.spread.toFixed(2)}px`);
			if (w >= 360) {
				check(`${tag} shown`, m.shown);
				check(`${tag} 8px after the title`, Math.abs(m.gap - 8) <= 0.5, `${m.gap?.toFixed(1)}px`);
				check(`${tag} on the title's baseline`, m.baselineDiff <= 0.5, `${m.baselineDiff?.toFixed(2)}px`);
				check(`${tag} one line`, m.oneLine);
				if (touch) check(`${tag} tap target at least 44px tall`, m.height >= 44, `${m.height}px`);
			} else check(`${tag} hidden below 360px`, !m.shown);
			if (w === 1100 || (touch && w === 390)) {
				await p.hover('.k-header .k-version');
				const underline = await p.$eval('.k-header .k-version', (e) => getComputedStyle(e).textDecorationLine);
				check(`${tag} ${touch ? 'no underline on touch' : 'underline on mouse hover'}`, underline === (touch ? 'none' : 'underline'), underline);
				const cdp = await ctx.newCDPSession(p);
				await cdp.send('DOM.enable');
				await cdp.send('CSS.enable');
				const { root } = await cdp.send('DOM.getDocument');
				const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '.k-header .k-version' });
				await cdp.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: ['active'] });
				const bg = await p.$eval('.k-header .k-version', (e) => getComputedStyle(e).backgroundColor);
				check(`${tag} ${touch ? 'pressed background on touch' : 'no pressed background with a mouse'}`, touch ? bg !== 'rgba(0, 0, 0, 0)' : bg === 'rgba(0, 0, 0, 0)', bg);
				await cdp.detach();
			}
		}
		await ctx.close();
	}
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

await browser.close();
console.table(mtocRows.filter((r) => r.theme === 'light'));
console.table(alignRows.filter((r) => r.theme === 'light'));
console.table(rows.filter((r) => r.theme === 'light'));
console.table(headerRows.filter((r) => r.theme === 'light'));
const failed = results.filter((r) => r.result !== 'PASS');
if (failed.length) console.table(failed.slice(0, 40));
console.log(failed.length ? `${failed.length} of ${results.length} check(s) failed` : `all ${results.length} checks pass`);
process.exit(failed.length ? 1 : 0);
