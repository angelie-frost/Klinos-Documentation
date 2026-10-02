// Turns the conventions used in docs/*.md into site markup, without changing any wording:
//  - relative .md links        → site URLs (/using-klinos/studio/lighting/#anchor); a missing target fails the build
//  - > **Tip|Note|Warning**    → callout box (prototype .callout)
//  - **Mode:** …               → mode pills (prototype .modes); the original sentence stays for screen readers
//  - <!-- Media to capture --> → media placeholders (prototype .clip); item 1 after the opening paragraph, the rest at the end
//  - ```mermaid                → <pre class="mermaid">, rendered in the browser
//  - Try it live               → the live demo embed after the opening paragraph
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { visit, SKIP } from 'unist-util-visit';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const CONTENT = path.join(ROOT, 'src', 'content', 'docs');
const SOURCE = path.join(ROOT, 'docs');
const MEDIA = path.join(ROOT, 'public', 'media');

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
	note: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="6.3"/><path d="M8 7.3v4M8 4.8v.1" stroke-linecap="round"/></svg>',
	tip: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="8" cy="8" r="6.3"/><path d="m5.4 8.2 1.8 1.8 3.5-3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
	warn: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M8 2.2 14.3 13H1.7z" stroke-linejoin="round"/><path d="M8 6.6v3.2M8 11.6v.1" stroke-linecap="round"/></svg>',
	clip: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="6" width="22" height="16" rx="3"/><path d="M12 11v6l5-3z" fill="currentColor" stroke="none"/></svg>',
	shot: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="5" width="22" height="18" rx="3"/><circle cx="10" cy="11" r="2"/><path d="m4 20 6-5 4 3 4-4 6 5" stroke-linejoin="round"/></svg>',
};
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

/* ---------- Callouts ---------- */
function calloutParts(node) {
	const para = node.children[0];
	if (para?.type !== 'paragraph') return null;
	const strong = para.children[0];
	if (strong?.type !== 'strong' || strong.children.length !== 1) return null;
	const label = strong.children[0].value;
	if (!CALLOUTS[label]) return null;
	const next = para.children[1];
	// The label must be alone on its line.
	if (next && !(next.type === 'break' || (next.type === 'text' && /^\s*\n/.test(next.value)))) return null;
	return { label, kind: CALLOUTS[label], para };
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
	return [
		html(`<aside class="callout ${kind}" aria-label="${label}">${ICON[kind]}<div class="callout-body"><p class="callout-title">${label}</p>`),
		...node.children,
		html('</div></aside>'),
	];
}

/* ---------- Mode pills ---------- */
function toModes(node) {
	const sentence = plainText(node).trim(); // "Mode: Studio (most controls also appear in Photoreal)"
	const rest = sentence.replace(/^Mode:\s*/, '');
	const qualifier = (rest.match(/\(([^)]*)\)/) || [])[1];
	const main = rest.replace(/\([^)]*\)/, '');
	const on = MODES.filter((m) => main.includes(m));
	const pills = MODES.map(
		(m) => `<span class="mode${on.includes(m) ? ' on' : ''}">${ICON[m]}${m}</span>`
	).join('');
	const note = qualifier ? `<span class="modes-note">${esc(qualifier)}</span>` : '';
	return html(
		`<div class="modes" data-pagefind-ignore><p class="sr-only">${esc(sentence)}</p><div class="modes-row" aria-hidden="true">${pills}${note}</div></div>`
	);
}

/* ---------- Media placeholders ---------- */
function parseMedia(comment) {
	const body = comment.replace(/^<!--\s*Media to capture:\s*/i, '').replace(/-->\s*$/, '');
	const items = [];
	for (const raw of body.split(/\r?\n/)) {
		const line = raw.trim();
		if (!line) continue;
		const m = line.match(/^(\d+)\.\s+(.*)$/);
		if (m) items.push({ n: Number(m[1]), text: m[2] });
		else if (items.length) items[items.length - 1].text += ' ' + line;
	}
	return items.map(({ n, text }) => {
		const cut = text.indexOf(': ');
		const head = cut > -1 ? text.slice(0, cut) : text;
		const desc = cut > -1 ? text.slice(cut + 2) : '';
		const [kind, ...extra] = head.split(/,\s*/);
		let seconds = null;
		let ratio = null;
		const notes = [];
		for (const e of extra) {
			let x;
			if ((x = e.match(/^(\d+(?:\.\d+)?)\s*s$/))) seconds = Number(x[1]);
			else if ((x = e.match(/^(\d+):(\d+)$/))) ratio = `${x[1]}/${x[2]}`;
			else notes.push(e);
		}
		return { n, kind: kind.trim(), notes, seconds, ratio, desc: desc.trim() };
	});
}

function existingMedia(slug, n) {
	for (const ext of ['mp4', 'webm', 'png', 'jpg', 'jpeg', 'webp', 'gif']) {
		if (existsSync(path.join(MEDIA, slug, `${n}.${ext}`))) return { src: `/media/${slug}/${n}.${ext}`, ext };
	}
	return null;
}

function mediaFigure(item, slug, pageTitle) {
	const isClip = /clip/i.test(item.kind);
	const kindLabel = [item.kind, ...item.notes].join(', ');
	const title = isClip
		? 'Clip to record'
		: /pair/i.test(item.kind)
			? 'Screenshot pair to capture'
			: /optional/i.test(item.kind)
				? 'Optional screenshot'
				: 'Screenshot to capture';
	// Sentence-case the first word, but leave names like "iPhone" alone.
	const desc = /^[a-z](?![A-Z])/.test(item.desc) ? item.desc[0].toUpperCase() + item.desc.slice(1) : item.desc;
	const time =
		item.seconds != null
			? `<time datetime="PT${item.seconds}S">${Math.floor(item.seconds / 60)}:${String(item.seconds % 60).padStart(2, '0')}</time>`
			: '';
	const style = item.ratio ? ` style="aspect-ratio:${item.ratio}"` : '';
	const real = existingMedia(slug, item.n);
	let inner;
	if (real && /^(mp4|webm)$/.test(real.ext)) {
		inner = `<div class="clip-media"${style}><video src="${real.src}" autoplay muted loop playsinline controls aria-label="${esc(desc)}"></video></div>`;
	} else if (real) {
		inner = `<div class="clip-media"${style}><img src="${real.src}" alt="${esc(desc)}" loading="lazy"></div>`;
	} else {
		inner =
			`<div class="clip-media is-placeholder"${style} role="img" aria-label="${esc(title + ': ' + desc)}">` +
			`<div class="clip-ph">${isClip ? ICON.clip : ICON.shot}<b>${title}</b><span>${esc(desc)}</span></div></div>`;
	}
	return html(
		`<figure class="clip" data-media-id="${esc(slug)}/${item.n}" data-pagefind-ignore>${inner}` +
			`<figcaption><span>${esc(pageTitle)} · ${esc(kindLabel)}</span>${time}</figcaption></figure>`
	);
}

/* ---------- Live demo ---------- */
const LIVE_SLUG = 'using-klinos/reference/try-it-live';
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
		const title = file.data?.astro?.frontmatter?.title ?? '';

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
			const nodes = parts.map((p) =>
				/^\[VERIFY/.test(p) ? html(`<span class="verify">${esc(p)}</span>`) : { type: 'text', value: p }
			);
			parent.children.splice(index, 1, ...nodes);
			return [SKIP, index + nodes.length];
		});

		visit(tree, 'code', (node, index, parent) => {
			if (node.lang !== 'mermaid' || !parent) return;
			parent.children[index] = html(`<pre class="mermaid" data-mermaid>${esc(node.value)}</pre>`);
		});

		const top = tree.children;

		// Mode line: the first paragraph only.
		const modeIdx = top.findIndex((n) => n.type === 'paragraph');
		if (modeIdx > -1 && isModeParagraph(top[modeIdx])) top[modeIdx] = toModes(top[modeIdx]);

		// Media comments come out of the flow first; placed below.
		const media = [];
		for (let i = top.length - 1; i >= 0; i--) {
			const n = top[i];
			if (n.type === 'html' && /^<!--\s*Media to capture:/i.test(n.value)) {
				media.unshift(...parseMedia(n.value));
				top.splice(i, 1);
			}
		}

		// "Opening paragraph": the first paragraph before the first heading, skipping the mode line
		// and anything inside a callout (whose children sit between its opening and closing html nodes).
		const firstHeading = top.findIndex((n) => n.type === 'heading');
		const end = firstHeading === -1 ? top.length : firstHeading;
		let lede = -1;
		let inCallout = 0;
		for (let i = 0; i < end; i++) {
			const n = top[i];
			if (n.type === 'html' && n.value.startsWith('<aside class="callout')) inCallout++;
			else if (n.type === 'html' && n.value === '</div></aside>') inCallout--;
			else if (n.type === 'paragraph' && !inCallout) {
				lede = i;
				break;
			}
		}
		if (lede > -1) {
			top[lede].data = { ...top[lede].data, hProperties: { className: ['lede'] } };
		}
		const afterOpening = lede > -1 ? lede + 1 : Math.max(0, end);

		const early = [];
		if (slug === LIVE_SLUG) early.push(liveDemo());
		if (media.length) early.push(mediaFigure(media[0], slug, title));
		top.splice(afterOpening, 0, ...early);
		for (const item of media.slice(1)) top.push(mediaFigure(item, slug, title));
	};
}
