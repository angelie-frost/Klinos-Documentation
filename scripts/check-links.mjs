// Checks every internal link in the built site (dist/): each href/src must resolve to a built file,
// and each #fragment must match an id on the target page. External links are not fetched.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, posix, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));
if (!existsSync(DIST)) {
	console.error('check:links: dist/ not found. Run a build first.');
	process.exit(1);
}

const walk = (dir) =>
	readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)]));
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

const htmlFiles = walk(DIST).filter((f) => f.endsWith('.html') && !f.includes(join('demo', 'preview.html')));
const idCache = new Map();
function idsOf(file) {
	if (!idCache.has(file)) {
		const html = readFileSync(file, 'utf8');
		idCache.set(file, new Set([...html.matchAll(/\s(?:id|name)="([^"]+)"/g)].map((m) => decode(m[1]))));
	}
	return idCache.get(file);
}
function resolveFile(urlPath) {
	const p = join(DIST, decodeURIComponent(urlPath));
	if (existsSync(p) && statSync(p).isFile()) return p;
	const index = join(p, 'index.html');
	if (existsSync(index)) return index;
	if (existsSync(p + '.html')) return p + '.html';
	return null;
}

let checked = 0;
const problems = [];
for (const file of htmlFiles) {
	const html = readFileSync(file, 'utf8');
	const pageUrl = '/' + relative(DIST, file).split(sep).join('/').replace(/index\.html$/, '');
	for (const m of html.matchAll(/\s(href|src|poster)="([^"]*)"/g)) {
		const raw = decode(m[2]);
		if (!raw || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(raw)) continue; // external, data:, mailto:, etc.
		checked++;
		const [pathPart, hash = ''] = raw.split('#');
		const clean = pathPart.split('?')[0];
		const target = clean === '' ? file : resolveFile(clean.startsWith('/') ? clean : posix.join(posix.dirname(pageUrl + 'x'), clean));
		if (!target) {
			problems.push(`${pageUrl}  →  ${raw}  (no such page or file)`);
			continue;
		}
		if (hash && target.endsWith('.html') && !idsOf(target).has(decodeURIComponent(hash))) {
			problems.push(`${pageUrl}  →  ${raw}  (no element with id "${hash}")`);
		}
	}
}

if (problems.length) {
	console.error(`check:links: ${problems.length} broken link(s) out of ${checked} checked in ${htmlFiles.length} pages:\n`);
	for (const p of [...new Set(problems)]) console.error('  ' + p);
	process.exit(1);
}
console.log(`check:links: ${checked} internal links and anchors in ${htmlFiles.length} pages, all resolve.`);
