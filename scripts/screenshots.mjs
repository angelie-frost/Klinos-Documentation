// Screenshots pages in dark and light with the locally installed Edge (or Chrome).
// Usage: node scripts/screenshots.mjs [outDir] [baseUrl] [slug ...]
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const viewportOnly = args.includes('--viewport');
const [outDir = 'screenshots/stage-1', base = 'http://localhost:4321', ...slugs] = args.filter((a) => a !== '--viewport');
const pages = slugs.length
	? slugs
	: ['using-klinos/start-here/home', 'using-klinos/studio/lighting', 'maintaining-klinos/understand/repository-guide'];

mkdirSync(outDir, { recursive: true });
let browser;
for (const channel of ['msedge', 'chrome']) {
	try {
		browser = await chromium.launch({ channel });
		break;
	} catch {}
}
if (!browser) throw new Error('No Edge or Chrome found for screenshots');

for (const theme of ['dark', 'light']) {
	const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme });
	await ctx.addInitScript((t) => localStorage.setItem('starlight-theme', t), theme);
	const page = await ctx.newPage();
	for (const slug of pages) {
		await page.goto(`${base}/${slug}/`, { waitUntil: 'networkidle' });
		await page.evaluate(() => document.fonts.ready);
		await page.waitForTimeout(400);
		const file = join(outDir, `${slug.split('/').pop()}-${theme}.png`);
		await page.screenshot({ path: file, fullPage: !viewportOnly });
		console.log(file);
	}
	await ctx.close();
}
await browser.close();
