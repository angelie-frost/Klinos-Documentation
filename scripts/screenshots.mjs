// Screenshots pages with the locally installed Edge (or Chrome).
// Usage: node scripts/screenshots.mjs [outDir] [baseUrl] [slug ...] [--theme light|dark|both] [--phone] [--viewport]
//   --theme     which site theme to capture; default light (the site's default theme)
//   --phone     390×844 phone viewport instead of 1440×900
//   --viewport  capture only the first screen instead of the full page
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name, fallback) => {
	const i = args.indexOf(name);
	return i > -1 && args[i + 1] ? args[i + 1] : fallback;
};
const positional = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1] === '--theme'));
const [outDir = 'screenshots/latest', base = 'http://localhost:4321', ...slugs] = positional;
const themeOpt = option('--theme', 'light');
const themes = themeOpt === 'both' ? ['light', 'dark'] : [themeOpt];
const phone = flag('--phone');
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

for (const theme of themes) {
	const ctx = await browser.newContext(
		phone
			? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
			: { viewport: { width: 1440, height: 900 } }
	);
	// Light is the site default, so only dark needs to be stored.
	if (theme === 'dark') await ctx.addInitScript(() => localStorage.setItem('starlight-theme', 'dark'));
	const page = await ctx.newPage();
	for (const slug of pages) {
		await page.goto(`${base}/${slug}/`, { waitUntil: 'networkidle' });
		await page.evaluate(() => document.fonts.ready);
		// Scroll through once so lazy-loaded media loads before a full-page capture, then back to the top.
		await page.evaluate(async () => {
			for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) {
				scrollTo(0, y);
				await new Promise((r) => setTimeout(r, 120));
			}
			scrollTo(0, 0);
		});
		await page.waitForLoadState('networkidle');
		await page.waitForTimeout(600);
		const file = join(outDir, `${slug.split('/').pop()}-${theme}${phone ? '-phone' : ''}.png`);
		await page.screenshot({ path: file, fullPage: !flag('--viewport') });
		console.log(file);
	}
	await ctx.close();
}
await browser.close();
