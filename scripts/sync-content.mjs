// Copies the source pages (docs/) into Starlight's content folder (src/content/docs/, generated),
// and the standalone panel (demo/preview.html) into public/demo/. Source files are never modified.
//
// The only change made to a page is in its frontmatter: `lastUpdated` holds the placeholder
// "[VERIFY: date]", which Starlight rejects, so it is replaced by the file's last git commit date,
// or removed when the file has no git history. The body is copied byte for byte.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readSidebar, slugFor } from './sidebar.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'docs');
const OUT = join(ROOT, 'src', 'content', 'docs');
const DEMO_SRC = join(ROOT, 'demo', 'preview.html');
const DEMO_OUT = join(ROOT, 'public', 'demo', 'preview.html');

// Pages rendered in full; null means every page. (Stage 1 used a short list and stubs for the rest.)
const READY = null;

function walk(dir) {
	return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
		d.isDirectory() ? walk(join(dir, d.name)) : d.name.endsWith('.md') ? [join(dir, d.name)] : []
	);
}

function gitDate(file) {
	try {
		const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', relative(ROOT, file)], {
			cwd: ROOT,
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore'],
		}).trim();
		return out || null;
	} catch {
		return null;
	}
}

/** Split "---\n…\n---\n" frontmatter from the body, keeping the body untouched. */
function splitFrontmatter(text, file) {
	const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
	if (!m) throw new Error(`${file}: no frontmatter`);
	return { fm: m[1], body: text.slice(m[0].length) };
}

function fmValue(fm, key) {
	const m = fm.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
	return m ? m[1].trim() : '';
}

const { pages } = readSidebar();
rmSync(OUT, { recursive: true, force: true });
// Astro caches rendered Markdown by file content, so changes to src/plugins/remark-klinos.mjs
// would not show until a page's text changed. Drop the cache so every run renders fresh.
for (const dir of ['.astro', join('node_modules', '.astro')]) rmSync(join(ROOT, dir, 'data-store.json'), { force: true });

const files = walk(SRC);
let full = 0;
let stubs = 0;
let dated = 0;
for (const file of files) {
	const rel = relative(SRC, file).replace(/\\/g, '/');
	const slug = slugFor(rel);
	if (!pages.has(slug)) console.warn(`[sync] ${rel} is not listed in sidebar.md`);
	const { fm, body } = splitFrontmatter(readFileSync(file, 'utf8'), rel);

	const date = gitDate(file);
	if (date) dated++;
	const newFm = fm
		.split(/\r?\n/)
		.filter((l) => !/^lastUpdated:/.test(l))
		.concat(date ? [`lastUpdated: ${date}`] : [])
		.join('\n');

	let out;
	if (!READY || READY.has(slug)) {
		out = `---\n${newFm}\n---\n${body}`;
		full++;
	} else {
		const title = fmValue(fm, 'title');
		const description = fmValue(fm, 'description');
		out =
			`---\ntitle: ${title}\ndescription: ${description}\n---\n\n` +
			`<div class="stub"><p>This page is written in Stage 2.</p><p>File: <code>docs/${rel}</code></p></div>\n`;
		stubs++;
	}
	const dest = join(OUT, rel);
	mkdirSync(dirname(dest), { recursive: true });
	writeFileSync(dest, out);
}

for (const slug of pages.keys()) {
	if (!existsSync(join(SRC, slug + '.md'))) throw new Error(`sidebar.md lists ${slug}.md, which does not exist`);
}

mkdirSync(dirname(DEMO_OUT), { recursive: true });
cpSync(DEMO_SRC, DEMO_OUT);

console.log(
	`[sync] ${files.length} pages (${full} full, ${stubs} stubs), ${dated} with a git date; demo copied to public/demo/preview.html`
);
