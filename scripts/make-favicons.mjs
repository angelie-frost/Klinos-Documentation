// Builds the favicons from Lucide's rotate-3d icon (ISC, copied from lucide-static 1.49.0; see LICENSES/lucide.txt):
//  - public/favicon.svg          the icon, stroke switching with the browser's light/dark setting
//  - public/favicon.ico          16, 32 and 48 px (PNG-encoded entries), white icon on an ink rounded square
//  - public/apple-touch-icon.png 180 px, white icon centred on an ink rounded square
// Rendering uses the locally installed Edge (playwright-core). Re-runnable.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const INK = '#0A0A0B';
const PAPER = '#EDEDED';
const icon = readFileSync(join(ROOT, 'src', 'icons', 'lucide', 'rotate-3d.svg'), 'utf8');
const inner = icon.match(/<svg[^>]*>([\s\S]*?)<\/svg>/)[1].trim();

// SVG favicon: stroke is currentColor, and the colour follows the browser theme.
const svgFavicon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<!-- Lucide rotate-3d (ISC), from lucide-static 1.49.0. See LICENSES/lucide.txt. -->
<style>svg{color:${INK}}@media (prefers-color-scheme:dark){svg{color:${PAPER}}}</style>
${inner}
</svg>
`;
writeFileSync(join(ROOT, 'public', 'favicon.svg'), svgFavicon);

/** The icon on an ink rounded square, as a PNG of the given size. */
async function tile(page, size, { radius, scale }) {
	const s = Math.round(size * scale);
	await page.setViewportSize({ width: size, height: size });
	await page.setContent(`<!doctype html><style>html,body{margin:0;background:transparent}
	div{width:${size}px;height:${size}px;border-radius:${radius}px;background:${INK};display:grid;place-items:center}
	svg{width:${s}px;height:${s}px;color:#fff}</style>
	<div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg></div>`);
	return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
}

/** ICO container with PNG-encoded images (supported by every current browser and Windows). */
function ico(images) {
	const header = Buffer.alloc(6 + 16 * images.length);
	header.writeUInt16LE(0, 0);
	header.writeUInt16LE(1, 2);
	header.writeUInt16LE(images.length, 4);
	let offset = header.length;
	images.forEach(({ size, png }, i) => {
		const e = 6 + 16 * i;
		header.writeUInt8(size >= 256 ? 0 : size, e);
		header.writeUInt8(size >= 256 ? 0 : size, e + 1);
		header.writeUInt8(0, e + 2);
		header.writeUInt8(0, e + 3);
		header.writeUInt16LE(1, e + 4);
		header.writeUInt16LE(32, e + 6);
		header.writeUInt32LE(png.length, e + 8);
		header.writeUInt32LE(offset, e + 12);
		offset += png.length;
	});
	return Buffer.concat([header, ...images.map((i) => i.png)]);
}

const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ deviceScaleFactor: 1 });
const sizes = [16, 32, 48];
const images = [];
for (const size of sizes) images.push({ size, png: await tile(page, size, { radius: Math.round(size * 0.22), scale: 0.78 }) });
writeFileSync(join(ROOT, 'public', 'favicon.ico'), ico(images));
writeFileSync(join(ROOT, 'public', 'apple-touch-icon.png'), await tile(page, 180, { radius: 40, scale: 0.62 }));
await browser.close();
console.log('[favicons] favicon.svg, favicon.ico (16/32/48), apple-touch-icon.png (180) written to public/');
