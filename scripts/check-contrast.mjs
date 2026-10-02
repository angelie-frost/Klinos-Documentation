// WCAG 2 contrast check for the text tokens in src/styles/tokens.css, in both themes.
// Fails (exit 1) when any text/background pair is below its target:
//   body and lede text >= 7:1, headings >= 7:1, muted text and callout titles >= 4.5:1.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const css = readFileSync(fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url)), 'utf8');

/** Custom properties declared in the first block whose selector matches exactly. */
function block(selector) {
	const start = css.indexOf(`${selector} {`);
	if (start < 0) throw new Error(`no "${selector}" block in tokens.css`);
	const body = css.slice(start, css.indexOf('\n}', start));
	return Object.fromEntries([...body.matchAll(/(--k-[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}
const light = block(':root');
const dark = { ...light, ...block(":root[data-theme='dark']") };

function resolve(tokens, name, depth = 0) {
	const v = tokens[name];
	if (!v) throw new Error(`token ${name} is not defined`);
	const ref = v.match(/^var\((--k-[\w-]+)\)$/);
	return ref && depth < 5 ? resolve(tokens, ref[1], depth + 1) : v;
}
function rgb(hex) {
	const h = hex.replace('#', '');
	const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
	return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
}
const lum = (hex) => {
	const [r, g, b] = rgb(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
	const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
};

// [text token, background token, minimum, what it is]
const PAIRS = [
	['--k-ink', '--k-surface', 7, 'headings, bold, links'],
	['--k-ink-lede', '--k-surface', 7, 'lede'],
	['--k-ink-body', '--k-surface', 7, 'body text'],
	['--k-ink-body', '--k-sunk', 7, 'body text in Note callouts, cards'],
	['--k-ink-body', '--k-stage', 7, 'body text on media/card stage'],
	['--k-ink-body', '--k-ok-bg', 7, 'body text in Tip callouts'],
	['--k-ink-body', '--k-warn-bg', 7, 'body text in Warning callouts'],
	['--k-ink-muted', '--k-surface', 4.5, 'captions, sidebar, On this page'],
	['--k-ink-muted', '--k-sunk', 4.5, 'muted text on sunk'],
	['--k-ink-muted', '--k-stage', 4.5, 'media captions'],
	['--k-ink', '--k-sunk', 4.5, 'Note callout title'],
	['--k-ok-text', '--k-ok-bg', 4.5, 'Tip callout title'],
	['--k-warn-text', '--k-warn-bg', 4.5, 'Warning callout title'],
];

const rows = [];
let failed = 0;
for (const [themeName, tokens] of [
	['light', light],
	['dark', dark],
]) {
	for (const [fg, bg, min, what] of PAIRS) {
		const a = resolve(tokens, fg);
		const b = resolve(tokens, bg);
		const r = ratio(a, b);
		const ok = r >= min;
		if (!ok) failed++;
		rows.push({ theme: themeName, text: `${fg} ${a}`, background: `${bg} ${b}`, ratio: r.toFixed(2), target: `${min}:1`, use: what, result: ok ? 'pass' : 'FAIL' });
	}
}
console.table(rows);
if (failed) {
	console.error(`check:contrast: ${failed} pair(s) below target.`);
	process.exit(1);
}
console.log(`check:contrast: all ${rows.length} pairs meet their targets.`);
