// Turns the conventions used in docs/*.md into site markup, without changing any wording:
//  - relative .md links         → site URLs (/using-klinos/studio/lighting/#anchor); a missing target fails the build
//  - > **Tip|Note|Warning**     → callout box (prototype .callout)
//  - > **Try Klinos in your browser** → the Try it live card (text, demo poster, button)
//  - [Try this in the live demo](…try-it-live.md) at the start of a paragraph → a small "try" row
//  - **Mode:** …                → mode pills (prototype .modes); the original sentence stays for screen readers
//  - ![alt](/guides/<file>)     → the panel's in-app guide visuals, inlined (src/guides/, from scripts/extract-guides.mjs)
//  - <!-- Media to capture -->  → captured media (public/media/, from scripts/capture-media.mjs) or a placeholder;
//                                 item 1 after the opening paragraph, the rest at the end
//  - ```mermaid                 → <pre class="mermaid">, rendered in the browser
//  - Try it live page           → the live demo embed after the opening paragraph
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { visit, SKIP } from 'unist-util-visit';
import { capturedMedia, parseMediaComment } from '../../scripts/media-items.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const CONTENT = path.join(ROOT, 'src', 'content', 'docs');
const SOURCE = path.join(ROOT, 'docs');
const GUIDES = path.join(ROOT, 'src', 'guides');
const LIVE_SLUG = 'using-klinos/reference/try-it-live';
const LIVE_URL = `/${LIVE_SLUG}/`;
const TRY_CARD = 'Try Klinos in your browser';

// Production builds (npm run build) leave out media that has not been captured yet, so readers never see
// empty boxes. Dev and build:draft keep the placeholders visible. KLINOS_SHOW_PLACEHOLDERS=1 shows them anyway.
const HIDE_PLACEHOLDERS = process.env.npm_lifecycle_event === 'build' && process.env.KLINOS_SHOW_PLACEHOLDERS !== '1';

const esc = (s) =>
	String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const html = (value) => ({ type: 'html', value });

/* ---------- Icons (from the prototype) ---------- */
const ICON = {
	Studio:
		'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M8 1.8 13.5 5v6L8 14.2 2.5 11V5z"/><path d="M2.5 5 8 8.2 13.5 5M8 8.2v6"/></svg>',
	Photoreal:
		'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="1.8" y="4.2" width="12.4" height="9" rx="2"/><circle cx="8" cy="8.7" r="2.4"/><path d="M5.5 4.2 6.6 2.4h2.8l1.1 1.8"/></svg>',
	Playground:
		'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M3 4.5 11 2.6l2 8.9-8 1.9z"/></svg>',
	clip: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="6" width="22" height="16" rx="3"/><path d="M12 11v6l5-3z" fill="currentColor" stroke="none"/></svg>',
	shot: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="5" width="22" height="18" rx="3"/><circle cx="10" cy="11" r="2"/><path d="m4 20 6-5 4 3 4-4 6 5" stroke-linejoin="round"/></svg>',
	play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 3.2v9.6L12.8 8z" fill="currentColor"/></svg>',
	pause: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 3h2.4v10H4.5zM9.1 3h2.4v10H9.1z" fill="currentColor"/></svg>',
	try: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><rect x="1.8" y="2.8" width="12.4" height="10.4" rx="2"/><path d="M6.6 6v4l3.4-2z" fill="currentColor" stroke="none"/></svg>',
};
// Callout icons: Lucide lightbulb, info and triangle-alert (ISC), copied unchanged from lucide-static 1.49.0
// into src/icons/lucide/ (see LICENSES/lucide.txt). They use currentColor, so they take the callout's accent colour.
const lucide = (name) =>
	readFileSync(path.join(ROOT, 'src', 'icons', 'lucide', `${name}.svg`), 'utf8')
		.replace(/<!--[\s\S]*?-->\s*/, '')
		.replace('<svg', '<svg aria-hidden="true" focusable="false"')
		.trim();
const CALLOUT_ICON = { tip: lucide('lightbulb'), note: lucide('info'), warn: lucide('triangle-alert') };
const MODES = ['Studio', 'Photoreal', 'Playground'];
const CALLOUTS = { Tip: 'tip', Note: 'note', Warning: 'warn' };

/* ---------- Helpers ---------- */
function slugOf(file) {
	const p = file.path || file.history?.[0];
	if (!p) return null;
	const rel = path.relative(CONTENT, p).replace(/\\/g, '/');
	return rel.startsWith('..') ? null : rel.replace(/\.mdx?$/, '');
}

function isModeParagraph(node) {
	const first = node?.type === 'paragraph' && node.children[0];
	return !!first && first.type === 'strong' && first.children[0]?.value === 'Mode:';
}

const plainText = (node) =>
	node.value ?? (node.children ? node.children.map(plainText).join('') : '');

const hasClass = (node, cls) => (node?.data?.hProperties?.className || []).includes(cls);
function addClass(node, cls) {
	node.data = node.data || {};
	node.data.hProperties = node.data.hProperties || {};
	node.data.hProperties.className = [...(node.data.hProperties.className || []), cls];
}

/* ---------- Links ---------- */
function rewriteLink(node, slug, file) {
	const url = node.url;
	if (!url || /^[a-z]+:|^\/\/|^#|^\//i.test(url)) return;
	const m = url.match(/^([^#?]+\.md)(#.*)?$/);
	if (!m) return;
	const target = path.posix.normalize(path.posix.join(path.posix.dirname(slug), m[1]));
	if (!existsSync(path.join(SOURCE, target))) {
		file.fail(`Broken link "${url}" in docs/${slug}.md: docs/${target} does not exist`, node);
	}
	node.url = `/${target.replace(/\.md$/, '')}/${m[2] || ''}`;
}

/* ---------- Media (captured files or placeholders) ---------- */
function mediaTag(variant, cls, m, desc) {
	const size = m.w && m.h ? ` width="${m.w}" height="${m.h}"` : '';
	if (m.type === 'video') {
		return (
			`<video class="${cls}" src="${variant.src}"${variant.poster ? ` poster="${variant.poster}"` : ''}${size}` +
			` muted loop playsinline preload="none" disablepictureinpicture aria-label="${esc(desc)}" data-media-video></video>`
		);
	}
	return `<img class="${cls}" src="${variant.src}"${size} alt="${esc(desc)}" loading="lazy" decoding="async">`;
}

/** Light/dark pair: CSS shows the one matching the site theme; the hidden one is never fetched. */
const themed = (m, desc) =>
	m.light.src === m.dark.src ? mediaTag(m.light, 'media-any', m, desc) : mediaTag(m.light, 'media-light', m, desc) + mediaTag(m.dark, 'media-dark', m, desc);

function mediaFigure(item, slug) {
	// Sentence-case the first word, but leave names like "iPhone" alone.
	const desc = /^[a-z](?![A-Z])/.test(item.desc) ? item.desc[0].toUpperCase() + item.desc.slice(1) : item.desc;
	const m = capturedMedia(slug, item.n);
	// A captured clip's real length wins over the length planned in the comment.
	const secs = m?.seconds ?? item.seconds;
	const time = secs != null ? `<time datetime="PT${secs}S">${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}</time>` : '';
	const caption = `<figcaption><span>${esc(desc)}</span>${time}</figcaption>`;
	const id = `${esc(slug)}/${item.n}`;

	if (m && m.type === 'video') {
		const ratio = m.w && m.h ? ` style="aspect-ratio:${m.w}/${m.h}"` : '';
		return html(
			`<figure class="clip has-media" data-media-id="${id}" data-pagefind-ignore><div class="clip-media is-video"${ratio}>${themed(m, desc)}</div>` +
				// The control sits in the caption row, so it never covers the panel's own buttons in the clip.
				`<figcaption><button class="media-toggle" type="button" aria-label="Play" data-media-toggle>${ICON.play}${ICON.pause}</button><span>${esc(desc)}</span>${time}</figcaption></figure>`
		);
	}
	if (m) {
		const ratio = m.w && m.h ? ` style="aspect-ratio:${m.w}/${m.h}"` : '';
		return html(
			`<figure class="clip has-media" data-media-id="${id}" data-pagefind-ignore><div class="clip-media is-image"${ratio}>` +
				`<button class="zoom" type="button" aria-label="Enlarge image: ${esc(desc)}" data-zoom>${themed(m, desc)}</button></div>${caption}</figure>`
		);
	}
	if (HIDE_PLACEHOLDERS) return null;
	const title = item.isClip
		? 'Clip to record'
		: /pair/i.test(item.kind)
			? 'Screenshot pair to capture'
			: /optional/i.test(item.kind)
				? 'Optional screenshot'
				: 'Screenshot to capture';
	const style = item.ratio ? ` style="aspect-ratio:${item.ratio}"` : '';
	return html(
		`<figure class="clip" data-media-id="${id}" data-pagefind-ignore>` +
			`<div class="clip-media is-placeholder"${style} role="img" aria-label="${esc(title + ': ' + desc)}">` +
			`<div class="clip-ph">${item.isClip ? ICON.clip : ICON.shot}<b>${title}</b><span>${esc(desc)}</span></div></div>${caption}</figure>`
	);
}

/* ---------- Callouts and the Try it live card ---------- */
function calloutParts(node) {
	const para = node.children[0];
	if (para?.type !== 'paragraph') return null;
	const strong = para.children[0];
	if (strong?.type !== 'strong' || strong.children.length !== 1) return null;
	const label = strong.children[0].value;
	if (!CALLOUTS[label] && label !== TRY_CARD) return null;
	const next = para.children[1];
	// The label must be alone on its line.
	if (next && !(next.type === 'break' || (next.type === 'text' && /^\s*\n/.test(next.value)))) return null;
	return { label, kind: CALLOUTS[label] ?? 'try', para };
}

function toCallout(node) {
	const parts = calloutParts(node);
	if (!parts) return null;
	const { label, kind, para } = parts;
	para.children.shift();
	const next = para.children[0];
	if (next?.type === 'break') para.children.shift();
	else if (next?.type === 'text') next.value = next.value.replace(/^\s*\n/, '');
	if (para.children.length === 0 || (para.children.length === 1 && !para.children[0].value?.trim() && para.children[0].type === 'text'))
		node.children.shift();

	if (kind === 'try') {
		// The card's link reads as the primary button; the demo poster sits beside the text.
		visit(node, 'link', (l) => addClass(l, 'try-btn'));
		const poster = capturedMedia(LIVE_SLUG, 1);
		const art = poster
			? `<a class="try-card-art" href="${LIVE_URL}" tabindex="-1" aria-hidden="true">${themed(poster, '')}</a>`
			: '';
		return [
			html(`<aside class="try-card" aria-label="${esc(label)}"><div class="try-card-body"><p class="try-card-title">${esc(label)}</p>`),
			...node.children,
			html(`</div>${art}</aside>`),
		];
	}
	return [
		// Grid: icon cell | title on row 1, body under the title (see .callout in klinos.css).
		html(`<aside class="callout ${kind}" aria-label="${label}"><span class="callout-icon">${CALLOUT_ICON[kind]}</span><p class="callout-title">${label}</p><div class="callout-body">`),
		...node.children,
		html('</div></aside>'),
	];
}

/* ---------- "Try this in the live demo" rows ---------- */
function markTryInline(node) {
	if (node.type !== 'paragraph') return false;
	const first = node.children[0];
	if (first?.type !== 'link' || first.url !== LIVE_URL || !/^Try this in the live demo/.test(plainText(first))) return false;
	addClass(node, 'try-inline');
	node.children.unshift(html(ICON.try));
	return true;
}

/* ---------- Mode pills ---------- */
function toModes(node) {
	const sentence = plainText(node).trim(); // "Mode: Studio (most controls also appear in Photoreal)"
	const rest = sentence.replace(/^Mode:\s*/, '');
	const qualifier = (rest.match(/\(([^)]*)\)/) || [])[1];
	const main = rest.replace(/\([^)]*\)/, '');
	const on = MODES.filter((m) => main.includes(m));
	const pills = MODES.map((m) => `<span class="mode${on.includes(m) ? ' on' : ''}">${ICON[m]}${m}</span>`).join('');
	const note = qualifier ? `<span class="modes-note">${esc(qualifier)}</span>` : '';
	return html(
		`<div class="modes" data-pagefind-ignore><p class="sr-only">${esc(sentence)}</p><div class="modes-row" aria-hidden="true">${pills}${note}</div></div>`
	);
}

/* ---------- In-app guide visuals ---------- */
function guideFile(url, file) {
	const name = url.replace(/^\/guides\//, '');
	const p = path.join(GUIDES, name);
	if (!/^[\w.-]+$/.test(name) || !existsSync(p)) {
		file.fail(`Guide visual "${url}" not found in src/guides/. Run: node scripts/extract-guides.mjs`);
	}
	return { name, body: readFileSync(p, 'utf8').replace(/^<!--[\s\S]*?-->\s*/, '').trim() };
}

function inlineGuides(tree, file) {
	visit(tree, 'image', (node, index, parent) => {
		if (!node.url?.startsWith('/guides/') || !parent) return;
		const { name, body } = guideFile(node.url, file);
		const alt = node.alt || '';

		// A strip of panel swatches (HTML fragment): replaces its paragraph.
		if (name.endsWith('.html')) {
			parent.children[index] = html(`<span class="guide-strip" role="img" aria-label="${esc(alt)}">${body}</span>`);
			return;
		}
		// A step icon at the start of a list item: icon tile + the rest of the line as the step text.
		if (parent.type === 'paragraph' && index === 0 && parent.children.length > 1) {
			parent.children.splice(0, 1, html(`<span class="guide-step-icon" aria-hidden="true">${body}</span><span class="guide-step-text">`));
			parent.children.push(html('</span>'));
			return;
		}
		// A figure on its own: rendered beside the paragraph that follows it (the panel's .helpfig).
		parent.children[index] = html(`<span class="guide-art">${body.replace('<svg', `<svg aria-label="${esc(alt)}" role="img"`)}</span>`);
	});

	// Pair a lone figure with the paragraph after it.
	for (let i = 0; i < tree.children.length - 1; i++) {
		const n = tree.children[i];
		if (n.type === 'paragraph' && n.children.length === 1 && n.children[0].type === 'html' && n.children[0].value.startsWith('<span class="guide-art">')) {
			const art = n.children[0].value;
			tree.children.splice(i, 1, html(`<div class="guide-fig">${art}<div class="guide-fig-text">`));
			const close = i + 2;
			tree.children.splice(close, 0, html('</div></div>'));
		}
		if (n.type === 'paragraph' && n.children.length === 1 && n.children[0].type === 'html' && n.children[0].value.startsWith('<span class="guide-strip"')) {
			tree.children[i] = html(n.children[0].value.replace('<span class="guide-strip"', '<div class="guide-strip"').replace(/<\/span>$/, '</div>'));
		}
	}
	// Lists made of guide steps get the panel's step layout.
	visit(tree, 'list', (list) => {
		const stepItems = list.children.filter((li) => li.children?.[0]?.children?.[0]?.value?.startsWith?.('<span class="guide-step-icon"'));
		if (stepItems.length && stepItems.length === list.children.length) addClass(list, 'guide-steps');
	});
}

/* ---------- Live demo ---------- */
const liveDemo = () =>
	html(`<div class="live" data-live-demo data-pagefind-ignore>
<div class="livebar"><span class="status" role="status"><i class="dot" data-live-dot></i><span data-live-text>Loading the Klinos panel…</span></span>
<button class="minibtn" type="button" data-live-reset>Reset</button></div>
<div class="liveframe"><iframe src="/demo/preview.html" title="Klinos panel, live demo" loading="lazy" data-live-frame></iframe></div>
</div>`);

/* ---------- Plugin ---------- */
export default function remarkKlinos() {
	return (tree, file) => {
		const slug = slugOf(file);
		if (!slug) return;

		visit(tree, ['link', 'definition'], (node) => rewriteLink(node, slug, file));

		// Callouts may sit at the top level or inside lists.
		visit(tree, 'blockquote', (node, index, parent) => {
			const replacement = toCallout(node);
			if (!replacement || !parent) return;
			parent.children.splice(index, 1, ...replacement);
			return [SKIP, index + replacement.length];
		});

		// [VERIFY: …] marks stay in the text, styled as the prototype's amber chip.
		visit(tree, 'text', (node, index, parent) => {
			if (!parent || !/\[VERIFY[^\]]*\]/.test(node.value)) return;
			const parts = node.value.split(/(\[VERIFY[^\]]*\])/).filter(Boolean);
			const nodes = parts.map((p) => (/^\[VERIFY/.test(p) ? html(`<span class="verify">${esc(p)}</span>`) : { type: 'text', value: p }));
			parent.children.splice(index, 1, ...nodes);
			return [SKIP, index + nodes.length];
		});

		visit(tree, 'code', (node, index, parent) => {
			if (node.lang !== 'mermaid' || !parent) return;
			parent.children[index] = html(`<pre class="mermaid" data-mermaid>${esc(node.value)}</pre>`);
		});

		inlineGuides(tree, file);

		const top = tree.children;

		// Mode line: the first paragraph only.
		const modeIdx = top.findIndex((n) => n.type === 'paragraph');
		if (modeIdx > -1 && isModeParagraph(top[modeIdx])) top[modeIdx] = toModes(top[modeIdx]);

		for (const n of top) markTryInline(n);

		// Media comments come out of the flow first; placed below.
		const media = [];
		for (let i = top.length - 1; i >= 0; i--) {
			const n = top[i];
			if (n.type === 'html' && /^<!--\s*Media to capture:/i.test(n.value)) {
				media.unshift(...parseMediaComment(n.value));
				top.splice(i, 1);
			}
		}

		// "Opening paragraph": the first paragraph before the first heading, skipping the mode line,
		// "try" rows and anything inside a callout or card (children sit between its opening and closing html nodes).
		const firstHeading = top.findIndex((n) => n.type === 'heading');
		const end = firstHeading === -1 ? top.length : firstHeading;
		let lede = -1;
		let inBox = 0;
		for (let i = 0; i < end; i++) {
			const n = top[i];
			if (n.type === 'html' && /^<aside class="(callout|try-card)/.test(n.value)) inBox++;
			else if (n.type === 'html' && /<\/aside>$/.test(n.value)) inBox--;
			else if (n.type === 'paragraph' && !inBox && !hasClass(n, 'try-inline')) {
				lede = i;
				break;
			}
		}
		if (lede > -1) addClass(top[lede], 'lede');
		let afterOpening = lede > -1 ? lede + 1 : Math.max(0, end);
		// The Try it live card belongs right under the opening paragraph; media follows it.
		if (top[afterOpening]?.type === 'html' && top[afterOpening].value.startsWith('<aside class="try-card')) {
			while (afterOpening < top.length && !(top[afterOpening].type === 'html' && /<\/aside>$/.test(top[afterOpening].value))) afterOpening++;
			afterOpening++;
		}

		const early = [];
		if (slug === LIVE_SLUG) early.push(liveDemo());
		if (media.length) early.push(mediaFigure(media[0], slug));
		top.splice(afterOpening, 0, ...early.filter(Boolean));
		for (const item of media.slice(1)) {
			const fig = mediaFigure(item, slug);
			if (fig) top.push(fig);
		}
	};
}
