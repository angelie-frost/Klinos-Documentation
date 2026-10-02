// Lists every [VERIFY…] mark left in the page text of docs/ and fails (exit 1) while any remain.
// The frontmatter `lastUpdated: "[VERIFY: date]"` placeholders are not counted: the build replaces
// them with each file's git commit date (scripts/sync-content.mjs). They are reported for information.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DOCS = join(ROOT, 'docs');
const MARK = /\[VERIFY[^\]]*\]/g;

const walk = (dir) =>
	readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
		d.isDirectory() ? walk(join(dir, d.name)) : d.name.endsWith('.md') ? [join(dir, d.name)] : []
	);

const found = [];
let frontmatterMarks = 0;
for (const file of walk(DOCS).sort()) {
	const lines = readFileSync(file, 'utf8').split(/\r?\n/);
	let inFm = lines[0] === '---';
	lines.forEach((line, i) => {
		if (i > 0 && inFm && line === '---') {
			inFm = false;
			return;
		}
		const marks = line.match(MARK);
		if (!marks) return;
		if (inFm) frontmatterMarks += marks.length;
		else for (const m of marks) found.push(`${relative(ROOT, file).split(sep).join('/')}:${i + 1}  ${m}  ${line.trim()}`);
	});
}

if (frontmatterMarks) console.log(`(info) ${frontmatterMarks} frontmatter lastUpdated placeholders, replaced by git dates at build time`);
if (found.length) {
	console.error(`check:verify: ${found.length} [VERIFY] mark(s) left in page text:\n`);
	for (const f of found) console.error('  ' + f);
	console.error('\nResolve them in docs/ before a production build, or use `npm run build:draft` for a preview build.');
	process.exit(1);
}
console.log('check:verify: no [VERIFY] marks left in page text.');
