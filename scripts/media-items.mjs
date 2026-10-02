// Shared parser for the "Media to capture" HTML comments in docs/*.md.
// Used by src/plugins/remark-klinos.mjs (placeholders / real media) and scripts/capture-media.mjs.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('..', import.meta.url));
export const MEDIA_DIR = join(ROOT, 'public', 'media');

/** Parse one "<!-- Media to capture: 1. Clip, 6 s, 16:10: … -->" comment into items. */
export function parseMediaComment(comment) {
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
		const desc = cut > -1 ? text.slice(cut + 2).trim() : '';
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
		const k = kind.trim();
		return { n, kind: k, notes, seconds, ratio, desc, isClip: /clip/i.test(k) };
	});
}

/** Every media item in docs/, as [{ slug, title, items }]. */
export function allMediaItems() {
	const docs = join(ROOT, 'docs');
	const walk = (d) =>
		readdirSync(d, { withFileTypes: true }).flatMap((e) =>
			e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith('.md') ? [join(d, e.name)] : []
		);
	return walk(docs)
		.sort()
		.flatMap((file) => {
			const text = readFileSync(file, 'utf8');
			const comment = text.match(/<!--\s*Media to capture:[\s\S]*?-->/i);
			if (!comment) return [];
			const slug = file.slice(docs.length + 1).replace(/\\/g, '/').replace(/\.md$/, '');
			const title = (text.match(/^title:\s*(.*)$/m) || [])[1]?.trim() ?? slug;
			return [{ slug, title, items: parseMediaComment(comment[0]) }];
		});
}

/**
 * Captured media for one item, from public/media/<slug>/<n>.json (written by capture-media.mjs):
 * { type: 'image'|'video', w, h, light: {src, poster?}, dark: {src, poster?} }, paths relative to /media/<slug>/.
 * Falls back to a bare file <n>.<ext> dropped in by hand (no theme variants, no size).
 */
export function capturedMedia(slug, n) {
	const dir = join(MEDIA_DIR, slug);
	const meta = join(dir, `${n}.json`);
	if (existsSync(meta)) {
		const m = JSON.parse(readFileSync(meta, 'utf8'));
		const url = (f) => (f ? `/media/${slug}/${f}` : undefined);
		const variant = (v) => v && { src: url(v.src), poster: url(v.poster) };
		return { ...m, light: variant(m.light), dark: variant(m.dark ?? m.light) };
	}
	for (const ext of ['mp4', 'webm', 'webp', 'png', 'jpg', 'jpeg', 'gif']) {
		if (existsSync(join(dir, `${n}.${ext}`))) {
			const v = { src: `/media/${slug}/${n}.${ext}` };
			return { type: /^(mp4|webm)$/.test(ext) ? 'video' : 'image', light: v, dark: v };
		}
	}
	return null;
}
