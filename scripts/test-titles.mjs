// Checks browser tab titles and og:title. Usage: node scripts/test-titles.mjs [baseUrl]
import { chromium } from 'playwright-core';

const BASE = process.argv[2] || 'http://localhost:4322';
const CASES = [
	['Home', 'using-klinos/start-here/home/', 'Klinos Docs'],
	['About Klinos', 'using-klinos/start-here/about-klinos/', 'About Klinos - Klinos Docs'],
	['Lighting', 'using-klinos/studio/lighting/', 'Lighting - Klinos Docs'],
	['Layouts', 'using-klinos/playground/layouts/', 'Layouts - Klinos Docs'],
	['404', 'does-not-exist/', '404 - Klinos Docs'],
	['Repository guide (maintainer)', 'maintaining-klinos/understand/repository-guide/', 'Repository guide - Klinos Docs'],
];
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage();
const rows = [];
for (const [name, path, expected] of CASES) {
	await page.goto(`${BASE}/${path}`);
	const title = await page.title();
	const og = await page.getAttribute('meta[property="og:title"]', 'content');
	const tw = await page.$('meta[name="twitter:title"]');
	rows.push({ page: name, title, 'og:title': og, 'twitter:title': tw ? await tw.getAttribute('content') : '(none emitted)', result: title === expected && og === expected ? 'PASS' : `FAIL (expected "${expected}")` });
}
await browser.close();
console.table(rows);
const failed = rows.filter((r) => r.result !== 'PASS').length;
console.log(failed ? `${failed} title(s) wrong` : `all ${rows.length} titles correct`);
process.exit(failed ? 1 : 0);
