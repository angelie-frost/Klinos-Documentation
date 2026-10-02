// Captures the "Media to capture" items that can be produced from the standalone panel (demo/preview.html) alone.
// Writes public/media/<slug>/<n>.{webp|webm} (light panel), <n>-dark.* (dark panel), posters for clips,
// and <n>.json with type and size. The remark plugin picks these up and shows the variant matching the site theme.
//
// Never fakes anything that needs Figma (selection, Insert/Refresh on the canvas, the Layers panel, the canvas itself):
// those items are listed as "figma" and left for real captures.
//
// Usage: node scripts/capture-media.mjs [--only slug#n,slug#n] [--theme light|dark|both] [--list]
// Needs network: the panel loads Three.js from unpkg.com.
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { allMediaItems, MEDIA_DIR, ROOT } from './media-items.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
	const i = args.indexOf(name);
	return i > -1 ? args[i + 1] : fallback;
};
const ONLY = opt('--only', '') ? new Set(opt('--only').split(',')) : null;
const THEMES = { light: ['light'], dark: ['dark'], both: ['light', 'dark'] }[opt('--theme', 'both')];
const DEMO = pathToFileURL(join(ROOT, 'demo', 'preview.html')).href;
const VIEW = { width: 1056, height: 660 }; // 16:10, wide enough for the panel's side-by-side layout
const CLIP_BUDGET = 950_000; // bytes per clip, under 1 MB

/* ======================= Recipes ======================= */
// Each recipe: { kind: 'shot'|'pair'|'set'|'clip', prep?, target?, frames?, act?, seconds?, viewport? }
// or { figma: 'why it cannot be produced from the demo' }.
const STUDIO_CARD = (inner) => `section.card:has(${inner})`;
const R = {
	/* ---------- Start here ---------- */
	'using-klinos/start-here/home#1': { figma: 'a Figma frame selected and Insert mockup placing the result on the canvas' },
	'using-klinos/start-here/home#2': { kind: 'shot', target: '#modebar', pad: 8 },
	'using-klinos/start-here/home#3': { kind: 'shot', target: '#ver', pad: [14, 14, 14, 40] },
	'using-klinos/start-here/getting-started#1': { figma: 'selecting a frame in Figma, opening the plugin, and Insert mockup on the canvas' },
	'using-klinos/start-here/getting-started#2': { figma: "Figma's organization plugins list" },
	'using-klinos/start-here/getting-started#3': {
		figma: 'the footer button reads "Insert mockup" only inside Figma; the demo shows "Export PNG"',
	},
	'using-klinos/start-here/getting-started#4': { figma: 'a selected mockup on the Figma canvas (button reads Refresh mockup)' },
	'using-klinos/start-here/about-klinos#1': { figma: 'needs Klinos V2, which is not in this repository' },

	/* ---------- Studio: Devices ---------- */
	'using-klinos/studio/devices#1': {
		kind: 'clip',
		seconds: 6,
		// Build the Galaxy S26 once before recording: its first load takes several seconds.
		prep: async (h) => {
			await h.js(() => setDevice('galaxy'));
			await h.ready();
			await h.js(() => setDevice('phone17'));
			// The first open draws every device thumbnail (about 5 s); do it once off camera.
			await h.click('#devicebtn');
			await h.wait(300);
			await h.page.keyboard.press('Escape');
			await h.wait(300);
		},
		act: async (h) => {
			await h.click('#devicebtn');
			await h.wait(700);
			for (let i = 0; i < 3; i++) {
				await h.page.keyboard.press('ArrowDown');
				await h.wait(350);
			}
			await h.click('#devicemenu .drow[data-key="galaxy"]');
			await h.wait(900);
			for (const f of ['Silver Shadow', 'Sky Blue', 'Black']) {
				await h.clickText('#finishes button', f);
				await h.wait(850);
			}
		},
	},
	'using-klinos/studio/devices#2': {
		kind: 'shot',
		prep: async (h) => {
			await h.click('#devicebtn');
			await h.wait(400);
		},
		target: '#devicemenu',
		pad: 6,
	},
	'using-klinos/studio/devices#3': {
		kind: 'clip',
		seconds: 6,
		prep: async (h) => {
			await h.js(() => applyLook('stage'));
			await h.angle('Turn left');
			await h.check('#polishOn', true);
			await h.range('#polishAmt', 0);
			await h.scrollTo('#polishAmt');
		},
		act: async (h) => {
			await h.wait(500);
			await h.animateRange('#polishAmt', 0, 150, 4500, 12);
		},
	},
	'using-klinos/studio/devices#4': {
		skip: 'the grain is finer than the demo preview can show, even zoomed in; capture it from a 2x or 4x export of the MacBook body in Figma',
	},

	/* ---------- Studio: Framing ---------- */
	'using-klinos/studio/framing#1': {
		kind: 'clip',
		seconds: 6,
		prep: async (h) => h.scrollTo('#presetbtn'),
		act: async (h) => {
			for (const a of ['Flat', 'Turn left', 'Laid left', 'Steep']) {
				await h.angle(a);
				await h.wait(1400);
			}
		},
	},
	'using-klinos/studio/framing#2': {
		kind: 'clip',
		seconds: 5,
		act: async (h) => {
			await h.dragPreview([[-120, 0], [-60, -40], [40, -30]], 1800);
			await h.wait(300);
			await h.page.keyboard.down('Shift');
			await h.dragPreview([[0, 0], [140, 20], [160, 30]], 1800);
			await h.page.keyboard.up('Shift');
		},
	},
	'using-klinos/studio/framing#3': {
		kind: 'shot',
		prep: async (h) => {
			await h.check('#adjust', true);
			await h.scrollTo('#rx');
		},
		target: STUDIO_CARD('#rx'),
	},
	'using-klinos/studio/framing#4': {
		kind: 'set',
		minDiff: 0.3, // only the frame shape changes
		cols: 2,
		frames: ['4:5', '1:1', '4:3', '16:9'].map((r) => async (h) => h.clickText('#aspect button', r)),
		target: '#stage',
	},
	'using-klinos/studio/framing#5': {
		kind: 'shot',
		prep: async (h) => {
			await h.js(() => setDevice('laptop'));
			await h.scrollTo('#presetbtn');
			await h.click('#presetbtn');
			await h.wait(400);
		},
		target: '#presetmenu',
		pad: 6,
	},
	'using-klinos/studio/framing#6': {
		kind: 'clip',
		seconds: 6,
		prep: async (h) => {
			await h.check('#posOn', true);
			await h.scrollTo('#posX');
		},
		act: async (h) => {
			const x = await h.js(() => ({ min: +$('posX').min, v: +$('posX').value }));
			await h.animateRange('#posX', x.v, x.v + (x.min - x.v) * 0.66, 2600, 14);
			await h.wait(900);
			await h.click('#poscenter');
		},
	},

	/* ---------- Studio: Backdrop and shadow ---------- */
	'using-klinos/studio/backdrop-shadow#1': {
		kind: 'pair',
		frames: [async (h) => h.clickText('#bgmode button', 'Flat fill'), async (h) => h.clickText('#bgmode button', 'Studio sweep')],
		target: '#stage',
	},
	'using-klinos/studio/backdrop-shadow#2': {
		kind: 'pair',
		prep: async (h) => h.clickText('#bgmode button', 'Studio sweep'),
		frames: [async (h) => h.clickText('#reflstyle button', 'Classic'), async (h) => h.clickText('#reflstyle button', 'Mirror')],
		target: '#stage',
	},
	'using-klinos/studio/backdrop-shadow#3': {
		kind: 'clip',
		seconds: 5,
		prep: async (h) => {
			await h.check('#shadow', true);
			await h.check('#shadowFollow', false);
			await h.scrollTo('#shadowAngle');
		},
		act: async (h) => {
			const r = await h.js(() => ({ min: +$('shadowAngle').min, max: +$('shadowAngle').max }));
			await h.animateRange('#shadowAngle', r.min, r.max, 4200, 24);
		},
	},
	'using-klinos/studio/backdrop-shadow#4': {
		kind: 'clip',
		seconds: 4,
		prep: async (h) => {
			await h.check('#shadow', true);
			await h.check('#shadowFollow', false);
			await h.scrollTo('#shadowHeight');
		},
		act: async (h) => {
			await h.wait(1200);
			await h.check('#shadowFollow', true);
		},
	},
	'using-klinos/studio/backdrop-shadow#5': { figma: "Figma's checkerboard behind a transparent mockup on the canvas" },

	/* ---------- Studio: Lighting ---------- */
	'using-klinos/studio/lighting#1': {
		kind: 'clip',
		seconds: 6,
		prep: async (h) => h.scrollTo('#looks'),
		act: async (h) => {
			for (const l of ['Calibrated', 'Stage', 'Studio White', 'Warm', 'Keynote']) {
				await h.clickText('#looks button', l);
				await h.wait(1150);
			}
		},
	},
	'using-klinos/studio/lighting#2': {
		kind: 'shot',
		prep: async (h) => {
			await h.clickText('#envseg button', 'Lights');
			await h.check('#envSpheres', true);
		},
		target: '#stage',
	},
	'using-klinos/studio/lighting#3': {
		kind: 'clip',
		seconds: 5,
		prep: async (h) => {
			await h.click('#lightsdisc');
			await h.wait(300);
			await h.scrollTo('#plot');
		},
		act: async (h) => {
			const lamp = h.page.locator('#plot circle.lamp').first();
			const b = await lamp.boundingBox();
			const plot = await h.page.locator('#plot').boundingBox();
			const cx = plot.x + plot.width / 2;
			const cy = plot.y + plot.height / 2;
			const r = Math.hypot(b.x + b.width / 2 - cx, b.y + b.height / 2 - cy);
			const a0 = Math.atan2(b.y + b.height / 2 - cy, b.x + b.width / 2 - cx);
			await h.page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
			await h.page.mouse.down();
			for (let i = 1; i <= 40; i++) {
				const a = a0 + (i / 40) * Math.PI * 0.9;
				await h.page.mouse.move(cx + r * Math.cos(a), cy + r * Math.sin(a));
				await h.wait(90);
			}
			await h.page.mouse.up();
		},
	},
	'using-klinos/studio/lighting#4': {
		kind: 'shot',
		viewport: { width: 1056, height: 900 },
		prep: async (h) => {
			await h.click('#lightsdisc');
			await h.wait(300);
			await h.click('#lighthelp');
			await h.wait(400);
		},
		target: '#lighthelpmodal .helpbox',
	},

	/* ---------- Studio: Screen ---------- */
	'using-klinos/studio/screen#1': {
		kind: 'clip',
		seconds: 6,
		prep: async (h) => {
			await h.loadImages([await h.standIn(0, 720, 1560)]);
			await h.scrollTo('#imgZoom');
		},
		act: async (h) => {
			await h.animateRange('#imgZoom', 100, 200, 2400, 12);
			await h.wait(400);
			await h.dragPreview([[0, 0], [50, 30], [-30, 60]], 2200, { from: 'screen' });
		},
		check: async (h) => h.js(() => state.imgX !== 0 || state.imgY !== 0),
	},
	'using-klinos/studio/screen#2': {
		kind: 'clip',
		seconds: 4,
		prep: async (h) => h.loadImages([await h.standIn(0, 720, 1560)]),
		check: async (h) => h.js(() => state.imgZoom > 100),
		act: async (h) => {
			const c = await h.previewCenter();
			await h.page.mouse.move(c.x, c.y);
			await h.page.keyboard.down('Alt');
			for (let i = 0; i < 10; i++) {
				await h.page.mouse.wheel(0, -120);
				await h.wait(220);
			}
			await h.page.keyboard.up('Alt');
		},
	},
	'using-klinos/studio/screen#3': {
		kind: 'pair',
		frames: [async (h) => h.check('#glare', true), async (h) => h.check('#glare', false)],
		target: '#stage',
	},
	'using-klinos/studio/screen#4': {
		kind: 'shot',
		prep: async (h) => h.loadImages([await h.standIn(0, 800, 800)]),
		target: '#stage',
	},

	/* ---------- Studio: Match a photo ---------- */
	'using-klinos/studio/match-a-photo#1': { figma: 'needs a real photo of a device; none is in the repository' },
	'using-klinos/studio/match-a-photo#2': { figma: 'needs a real photo of a device; none is in the repository' },
	'using-klinos/studio/match-a-photo#3': { figma: 'needs a real photo of a device; none is in the repository' },
	'using-klinos/studio/match-a-photo#4': { figma: 'needs a real photo of a device; none is in the repository' },

	/* ---------- Studio: Staging ---------- */
	'using-klinos/studio/staging#1': {
		kind: 'clip',
		seconds: 8,
		prep: async (h) => h.scrollTo('#stagingbtn'),
		act: async (h) => {
			for (const s of ['Floating', 'Podium', 'Spotlight']) {
				await h.click('#stagingbtn');
				await h.wait(900);
				await h.clickText('#stagingmenu .tile', s);
				await h.wait(1500);
			}
		},
	},
	'using-klinos/studio/staging#2': {
		kind: 'shot',
		prep: async (h) => {
			await h.scrollTo('#stagingbtn');
			await h.click('#stagingbtn');
			await h.wait(500);
		},
		target: '#stagingmenu',
		pad: 6,
	},
	'using-klinos/studio/staging#3': {
		kind: 'clip',
		seconds: 5,
		prep: async (h) => h.scrollTo('#stagingbtn'),
		act: async (h) => {
			await h.click('#stagingbtn');
			await h.wait(700);
			await h.clickText('#stagingmenu .tile', 'Plinth');
			await h.wait(2000);
			await h.click('#stagingundo');
		},
	},
	'using-klinos/studio/staging#4': {
		kind: 'shot',
		prep: async (h) => {
			await h.js(() => applyStaging('floating'));
			await h.range('#stageFloat', 40);
		},
		target: '#stage',
	},

	/* ---------- Photoreal ---------- */
	'using-klinos/photoreal/photoreal#1': {
		kind: 'clip',
		seconds: 6,
		act: async (h) => {
			await h.wait(400);
			await h.click('#modebar button[data-mode="photoreal"]');
			await h.wait(1300);
			await h.clickText('#prdevices button', 'iPhone 17 Pro');
			await h.wait(1000);
			for (const f of ['Deep Blue', 'Cosmic Orange']) {
				await h.clickText('#prfinishes button', f);
				await h.wait(1100);
			}
		},
	},
	'using-klinos/photoreal/photoreal#2': {
		kind: 'shot',
		prep: async (h) => {
			await h.js(() => setMode('photoreal'));
			await h.clickText('#prdevices button', 'MacBook Pro 14');
		},
		target: '#stage',
	},
	'using-klinos/photoreal/photoreal#3': {
		kind: 'pair',
		prep: async (h) => {
			await h.js(() => setMode('photoreal'));
			await h.clickText('#prdevices button', 'iPhone 17 Pro');
			await h.check('#shadow', true);
			await h.range('#shadowOpacity', await h.js(() => +$('shadowOpacity').max));
		},
		frames: [
			async (h) => h.range('#shadowSoft', await h.js(() => +$('shadowSoft').min)),
			async (h) => h.range('#shadowSoft', await h.js(() => +$('shadowSoft').max)),
		],
		target: '#stage',
	},

	/* ---------- Playground (images come from "Use an image": neutral numbered stand-ins) ---------- */
	'using-klinos/playground/single-card#1': {
		kind: 'clip',
		seconds: 6,
		prep: async (h) => {
			await h.js(() => setMode('playground'));
			await h.loadImages([await h.standIn(0, 640, 400)]);
			await h.scrollTo('#plpresets');
		},
		act: async (h) => {
			for (const p of ['Front', 'Hero', 'Turn left', 'Lay flat']) {
				await h.clickText('#plpresets button', p);
				await h.wait(1400);
			}
		},
	},
	'using-klinos/playground/single-card#2': {
		kind: 'clip',
		seconds: 5,
		prep: async (h) => {
			await h.js(() => setMode('playground'));
			await h.loadImages([await h.standIn(0, 640, 400)]);
		},
		act: async (h) => {
			await h.dragPreview([[-100, 0], [-40, -30], [50, -20]], 1800);
			await h.wait(300);
			await h.page.keyboard.down('Shift');
			await h.dragPreview([[0, 0], [130, 25], [150, 30]], 1800);
			await h.page.keyboard.up('Shift');
		},
	},
	'using-klinos/playground/single-card#3': {
		kind: 'shot',
		prep: async (h) => {
			await h.js(() => setMode('playground'));
			await h.loadImages([await h.standIn(0, 640, 400)]);
		},
		target: 'selection-card',
	},
	'using-klinos/playground/single-card#4': {
		kind: 'pair',
		prep: async (h) => {
			await h.js(() => setMode('playground'));
			await h.loadImages([await h.standIn(0, 640, 400)]);
		},
		frames: [
			async (h) => h.check('#plTransparent', true),
			async (h) => {
				await h.check('#plTransparent', false);
				await h.check('#plShadow', true);
			},
		],
		target: '#stage',
	},
	'using-klinos/playground/single-card#5': { figma: 'selecting an inserted image on the Figma canvas and Refresh image' },
	'using-klinos/playground/layouts#1': {
		kind: 'clip',
		seconds: 8,
		prep: async (h) => {
			await h.playgroundFive();
			await h.scrollTo('#pllayouts');
		},
		act: async (h) => {
			for (const l of ['Arc', 'Cover flow', 'Fan', 'Cylinder', 'Tunnel', 'Stack']) {
				await h.clickText('#pllayouts .plchip', l);
				await h.wait(1250);
			}
		},
	},
	'using-klinos/playground/layouts#2': {
		kind: 'set',
		cols: 3,
		prep: async (h) => h.playgroundFive(),
		frames: ['Arc', 'Cover flow', 'Fan', 'Cylinder', 'Tunnel', 'Stack'].map((l) => async (h) => h.clickText('#pllayouts .plchip', l)),
		target: '#stage',
	},
	'using-klinos/playground/layouts#3': {
		kind: 'clip',
		seconds: 5,
		prep: async (h) => {
			await h.playgroundFive();
			await h.clickText('#pllayouts .plchip', 'Fan');
			await h.scrollTo('selection-card');
		},
		act: async (h) => {
			const grips = h.page.locator('#card-plsource .plgrip');
			const from = await grips.nth(0).boundingBox();
			const to = await grips.nth(3).boundingBox();
			await h.page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
			await h.page.mouse.down();
			const steps = 30;
			for (let i = 1; i <= steps; i++) {
				await h.page.mouse.move(from.x + from.width / 2, from.y + from.height / 2 + ((to.y - from.y + 8) * i) / steps);
				await h.wait(60);
			}
			await h.page.mouse.up();
		},
	},
	'using-klinos/playground/layouts#4': {
		kind: 'clip',
		seconds: 6,
		prep: async (h) => {
			await h.playgroundFive();
			await h.clickText('#pllayouts .plchip', 'Fan');
			await h.scrollTo('#pllayoutparams');
		},
		act: async (h) => {
			const id = await h.firstLayoutSlider();
			const r = await h.js((id) => ({ v: +$(id).value, max: +$(id).max }), id);
			await h.animateRange('#' + id, r.v, r.max, 1800, 10);
			await h.wait(600);
			await h.click('#plresetlayout');
			await h.wait(1300);
			await h.click('#plundo');
		},
	},
	'using-klinos/playground/insert#1': { figma: 'Insert as layers and the Figma Layers panel' },
	'using-klinos/playground/insert#2': { figma: 'Insert as layers is hidden in the standalone demo' },
	'using-klinos/playground/insert#3': { figma: 'selecting an inserted frame on the Figma canvas and Rebuild layers' },
	'using-klinos/playground/insert#4': { capped: true, kind: 'shot', target: '#status', pad: 6 },
	'using-klinos/playground/exploded#1': { figma: 'Exploded is only offered for a real Figma frame; not available in the demo' },
	'using-klinos/playground/exploded#2': { figma: 'Exploded is only offered for a real Figma frame; not available in the demo' },
	'using-klinos/playground/exploded#3': { figma: 'Exploded is only offered for a real Figma frame; not available in the demo' },
	'using-klinos/playground/exploded#4': { figma: 'Exploded is only offered for a real Figma frame; not available in the demo' },
	'using-klinos/playground/exploded#5': { figma: 'Exploded is only offered for a real Figma frame; not available in the demo' },
	'using-klinos/playground/guide-reset#1': {
		kind: 'clip',
		seconds: 5,
		prep: async (h) => {
			await h.js(() => setMode('playground'));
			await h.scrollTo('#plhelp');
		},
		act: async (h) => {
			await h.wait(400);
			await h.click('#plhelp');
			await h.wait(1000);
			for (let i = 0; i < 6; i++) {
				await h.js(() => document.querySelector('#plhelpmodal .helpbody').scrollBy(0, 70));
				await h.wait(250);
			}
			await h.wait(500);
			await h.click('#plhelpok');
		},
	},
	'using-klinos/playground/guide-reset#2': {
		kind: 'shot',
		viewport: { width: 1056, height: 940 },
		prep: async (h) => {
			await h.js(() => setMode('playground'));
			await h.click('#plhelp');
			await h.wait(400);
		},
		target: '#plhelpmodal .helpbox',
	},
	'using-klinos/playground/guide-reset#3': {
		kind: 'clip',
		seconds: 6,
		prep: async (h) => {
			await h.playgroundFive();
			await h.clickText('#pllayouts .plchip', 'Arc');
			await h.scrollTo('#pllayoutparams');
		},
		act: async (h) => {
			const ids = await h.layoutSliders();
			for (const id of ids.slice(0, 2)) {
				const r = await h.js((id) => ({ v: +$(id).value, min: +$(id).min, max: +$(id).max }), id);
				await h.animateRange('#' + id, r.v, r.v + (r.max - r.v) * 0.7, 1100, 8);
				await h.wait(200);
			}
			await h.wait(400);
			await h.click('#plresetlayout');
			await h.wait(1200);
			await h.click('#plundo');
		},
	},
	'using-klinos/playground/guide-reset#4': {
		kind: 'clip',
		seconds: 4,
		prep: async (h) => {
			await h.playgroundFive();
			await h.clickText('#pllayouts .plchip', 'Arc');
			await h.scrollTo('#pllayoutparams');
			const id = await h.layoutSliderByLabel('Spacing');
			const r = await h.js((id) => ({ v: +$(id).value, max: +$(id).max }), id);
			await h.range('#' + id, r.v + (r.max - r.v) * 0.6);
		},
		act: async (h) => {
			await h.wait(1200);
			const id = await h.layoutSliderByLabel('Spacing');
			await h.dblclickSliderValue(id);
		},
	},

	/* ---------- Working with the panel ---------- */
	'using-klinos/panel/exporting#1': { figma: 'Insert mockup placing the mockup on the Figma canvas' },
	'using-klinos/panel/exporting#2': { figma: 'selecting an existing mockup on the Figma canvas and Refresh mockup' },
	'using-klinos/panel/exporting#3': { figma: 'pasting onto the Figma canvas' },
	'using-klinos/panel/exporting#4': { capped: true, kind: 'shot', target: '#status', pad: 6 },
	'using-klinos/panel/exporting#5': { figma: "Figma's own export of an inserted mockup" },
	'using-klinos/panel/panel-cards#1': {
		kind: 'clip',
		seconds: 6,
		prep: async (h) => h.scrollTo('#card-lighting'),
		act: async (h) => {
			const grip = await h.page.locator('#card-lighting .grip').first().boundingBox();
			const dev = await h.page.locator('#card-device').boundingBox();
			await h.page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
			await h.page.mouse.down();
			const steps = 40;
			const ty = dev.y + dev.height + 6;
			for (let i = 1; i <= steps; i++) {
				await h.page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2 + ((ty - grip.y) * i) / steps);
				await h.wait(70);
				if (await h.js(() => document.querySelector('#card-lighting').previousElementSibling?.id === 'card-device')) break;
			}
			await h.wait(300);
			await h.page.mouse.up();
		},
	},
	'using-klinos/panel/panel-cards#2': {
		kind: 'shot',
		prep: async (h) => {
			await h.scrollTo('#card-lighting');
			await h.click('#card-lighting .grip');
			await h.wait(300);
		},
		target: '#cardmenu',
		pad: 2,
	},
	'using-klinos/panel/panel-cards#3': {
		kind: 'clip',
		seconds: 4,
		prep: async (h) => h.scrollTo('#card-lighting'),
		act: async (h) => {
			await h.page.locator('#card-lighting .grip').first().focus();
			await h.wait(700);
			for (let i = 0; i < 2; i++) {
				await h.page.keyboard.press('Alt+ArrowUp');
				await h.wait(1100);
			}
		},
	},
	'using-klinos/panel/panel-cards#4': {
		kind: 'shot',
		prep: async (h) => {
			await h.js(() => moveCard('card-lighting', 'up'));
			await h.scrollTo('#resetorder');
		},
		target: '#resetorder',
		pad: [16, 16, 16, 16],
	},

	/* ---------- Reference: Try it live ---------- */
	'using-klinos/reference/try-it-live#1': { kind: 'shot', target: null },
	'using-klinos/reference/try-it-live#2': {
		kind: 'clip',
		seconds: 6,
		act: async (h) => {
			await h.wait(500);
			await h.loadImages([await h.standIn(0, 720, 1560)], false);
			await h.wait(1600);
			await h.click('#go');
			await h.wait(2600);
		},
	},
};

/* ======================= Helpers ======================= */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitReady(page) {
	await page.waitForFunction(
		() =>
			typeof THREE !== 'undefined' &&
			glOK &&
			settleTimer === null &&
			draftFrame === 0 &&
			ssNow === SS &&
			Object.keys(prLoading).length === 0 &&
			!/^Loading/.test(document.getElementById('statustext').textContent),
		null,
		{ timeout: 30000, polling: 100 }
	);
	await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
	await sleep(150);
}

function helpers(page, tool) {
	const h = {
		page,
		selectionCard: '#card-plsource',
		wait: sleep,
		js: (fn, arg) => page.evaluate(fn, arg),
		ready: () => waitReady(page),
		resolve: (sel) => (sel === 'selection-card' ? h.selectionCard : sel),
		async click(sel) {
			// force: the panel re-renders continuously, so Playwright's 'stable' wait can stall for seconds.
			await page.locator(h.resolve(sel)).first().click({ force: true });
		},
		async clickText(sel, text) {
			const loc = page.locator(sel).filter({ hasText: text });
			const exact = page.locator(sel).filter({ hasText: new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) });
			await ((await exact.count()) ? exact : loc).first().click({ force: true });
		},
		async check(sel, on) {
			const el = page.locator(sel).first();
			if ((await el.isChecked()) !== on) await el.click({ force: true });
		},
		async range(sel, v) {
			await page.evaluate(
				([s, v]) => {
					const el = document.querySelector(s);
					el.value = v;
					el.dispatchEvent(new Event('input', { bubbles: true }));
					el.dispatchEvent(new Event('change', { bubbles: true }));
				},
				[sel, v]
			);
		},
		async animateRange(sel, from, to, ms, steps) {
			for (let i = 0; i <= steps; i++) {
				await h.range(sel, from + ((to - from) * i) / steps);
				await sleep(ms / steps);
			}
		},
		async angle(name) {
			await page.evaluate((n) => pickAngle(n), name);
		},
		async scrollTo(sel) {
			await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: 'center' }), h.resolve(sel));
			await sleep(150);
		},
		async previewCenter() {
			const b = await page.locator('#preview').boundingBox();
			return { x: b.x + b.width / 2, y: b.y + b.height / 2, b };
		},
		async dragPreview(points, ms, { from = 'center' } = {}) {
			const c = await h.previewCenter();
			const start = from === 'screen' ? { x: c.x, y: c.y - c.b.height * 0.08 } : c;
			await page.mouse.move(start.x + points[0][0], start.y + points[0][1]);
			await page.mouse.down();
			const per = Math.max(1, Math.round(ms / 60 / (points.length - 1)));
			for (let k = 1; k < points.length; k++) {
				const [x0, y0] = points[k - 1];
				const [x1, y1] = points[k];
				for (let i = 1; i <= per; i++) {
					await page.mouse.move(start.x + x0 + ((x1 - x0) * i) / per, start.y + y0 + ((y1 - y0) * i) / per);
					await sleep(60);
				}
			}
			await page.mouse.up();
		},
		async zoomPreview(times, dy = 0) {
			const c = await h.previewCenter();
			await page.mouse.move(c.x, c.y + c.b.height * dy);
			for (let i = 0; i < times; i++) {
				await page.mouse.wheel(0, -240);
				await sleep(120);
			}
		},
		/** A neutral, clearly generic stand-in "screen": grey UI blocks and a big number. */
		async standIn(i, w, hgt) {
			const b64 = await tool.evaluate(
				({ i, w, h }) => {
					const c = document.createElement('canvas');
					c.width = w;
					c.height = h;
					const g = c.getContext('2d');
					const tints = ['#dfe3ea', '#e4e0ea', '#dfe9e4', '#eae5dc', '#e0e6ec'];
					g.fillStyle = tints[i % tints.length];
					g.fillRect(0, 0, w, h);
					const u = Math.min(w, h) / 20;
					g.fillStyle = 'rgba(40,44,52,.18)';
					g.fillRect(u, u, w - 2 * u, u * 1.4);
					for (let k = 0; k < 3; k++) g.fillRect(u, h - u * (4 + k * 2.2), w * 0.55, u * 1.1);
					g.fillStyle = 'rgba(40,44,52,.55)';
					g.font = `600 ${Math.round(Math.min(w, h) * 0.32)}px Segoe UI, Arial, sans-serif`;
					g.textAlign = 'center';
					g.textBaseline = 'middle';
					g.fillText(String(i + 1), w / 2, h / 2);
					return c.toDataURL('image/png').split(',')[1];
				},
				{ i, w, h: hgt }
			);
			return { name: `Screen ${i + 1}.png`, mimeType: 'image/png', buffer: Buffer.from(b64, 'base64') };
		},
		async loadImages(files, wait = true) {
			await page.setInputFiles('#loadfile', files);
			if (wait) {
				await sleep(400);
				await waitReady(page);
			}
		},
		async playgroundFive() {
			await page.evaluate(() => setMode('playground'));
			const files = [];
			for (let i = 0; i < 5; i++) files.push(await h.standIn(i, 360, 780));
			await h.loadImages(files);
			await h.check('#plLayoutOn', true);
			await waitReady(page);
		},
		async layoutSliders() {
			return page.evaluate(() => [...document.querySelectorAll('#pllayoutparams input[type=range]')].filter((e) => e.offsetParent).map((e) => e.id));
		},
		async firstLayoutSlider() {
			return (await h.layoutSliders())[0];
		},
		async layoutSliderByLabel(label) {
			return page.evaluate((label) => {
				const rows = [...document.querySelectorAll('#pllayoutparams input[type=range]')];
				const hit = rows.find((e) => (e.closest('label, .row, div')?.textContent || '').includes(label));
				return (hit || rows[0]).id;
			}, label);
		},
		async dblclickSliderValue(id) {
			const target = await page.evaluate((id) => {
				const el = document.getElementById(id);
				const row = el.closest('.row, label, div');
				const v = [...row.querySelectorAll('*')].find((n) => n !== el && n.title && /Double-click/.test(n.title));
				if (!v) return null;
				v.setAttribute('data-capture-dbl', '');
				return true;
			}, id);
			if (target) await page.locator('[data-capture-dbl]').first().dblclick();
		},
	};
	return h;
}

/* ---------- Image + video encoding in a helper page ---------- */
async function toWebP(tool, pngs, cols = 2, maxWidth = 2400) {
	return Buffer.from(
		await tool.evaluate(
			async ({ pngs, cols, maxWidth }) => {
				const imgs = await Promise.all(pngs.map(async (b) => createImageBitmap(await (await fetch('data:image/png;base64,' + b)).blob())));
				const gap = imgs.length > 1 ? 32 : 0;
				const rows = Math.ceil(imgs.length / cols);
				const n = Math.min(cols, imgs.length);
				const cw = Math.max(...imgs.map((i) => i.width));
				const ch = Math.max(...imgs.map((i) => i.height));
				let W = n * cw + (n - 1) * gap;
				let H = rows * ch + (rows - 1) * gap;
				const s = Math.min(1, maxWidth / W);
				const c = document.createElement('canvas');
				c.width = Math.round(W * s);
				c.height = Math.round(H * s);
				const g = c.getContext('2d');
				g.imageSmoothingQuality = 'high';
				imgs.forEach((im, k) => {
					const x = (k % cols) * (cw + gap);
					const y = Math.floor(k / cols) * (ch + gap);
					g.drawImage(im, x * s, y * s, im.width * s, im.height * s);
				});
				const url = c.toDataURL('image/webp', 0.86);
				return { b64: url.split(',')[1], w: c.width, h: c.height };
			},
			{ pngs: pngs.map((b) => b.toString('base64')), cols, maxWidth }
		).then((r) => {
			toWebP.last = r;
			return r.b64;
		}),
		'base64'
	);
}

/** Smallest mean absolute difference (0–255) between consecutive frames, on a 96 px thumbnail. */
async function framesDiffer(tool, pngs) {
	return tool.evaluate(async (pngs) => {
		const px = await Promise.all(
			pngs.map(async (b) => {
				const im = await createImageBitmap(await (await fetch('data:image/png;base64,' + b)).blob());
				const c = new OffscreenCanvas(96, 96);
				const g = c.getContext('2d');
				g.drawImage(im, 0, 0, 96, 96);
				return g.getImageData(0, 0, 96, 96).data;
			})
		);
		let min = Infinity;
		for (let k = 1; k < px.length; k++) {
			let sum = 0;
			for (let i = 0; i < px[k].length; i++) sum += Math.abs(px[k][i] - px[k - 1][i]);
			min = Math.min(min, sum / px[k].length);
		}
		return min;
	}, pngs.map((b) => b.toString('base64')));
}

async function encodeClip(tool, frames, seconds) {
	const bitrate = Math.min(1_400_000, Math.floor((CLIP_BUDGET * 8) / seconds / 1.08));
	const r = await tool.evaluate(
		async ({ frames, seconds, bitrate, W, H }) => {
			const c = document.createElement('canvas');
			c.width = W;
			c.height = H;
			const g = c.getContext('2d');
			const bmps = await Promise.all(frames.map(async (f) => createImageBitmap(await (await fetch('data:image/jpeg;base64,' + f.data)).blob())));
			g.drawImage(bmps[0], 0, 0, W, H);
			const poster = c.toDataURL('image/webp', 0.86).split(',')[1];
			const rec = new MediaRecorder(c.captureStream(30), { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: bitrate });
			const chunks = [];
			rec.ondataavailable = (e) => chunks.push(e.data);
			const stopped = new Promise((res) => (rec.onstop = res));
			rec.start();
			const t0 = frames[0].ts;
			const start = performance.now();
			let i = 0;
			await new Promise((res) => {
				const tick = () => {
					const t = (performance.now() - start) / 1000;
					while (i + 1 < frames.length && frames[i + 1].ts - t0 <= t) i++;
					g.drawImage(bmps[i], 0, 0, W, H);
					if (t >= seconds) res();
					else requestAnimationFrame(tick);
				};
				tick();
			});
			rec.stop();
			await stopped;
			const buf = new Uint8Array(await new Blob(chunks).arrayBuffer());
			let s = '';
			for (let k = 0; k < buf.length; k += 0x8000) s += String.fromCharCode(...buf.subarray(k, k + 0x8000));
			return { video: btoa(s), poster };
		},
		{ frames, seconds, bitrate, W: VIEW.width, H: VIEW.height }
	);
	return { video: Buffer.from(r.video, 'base64'), poster: Buffer.from(r.poster, 'base64') };
}

async function grab(page, target, pad = 0) {
	if (!target) return page.screenshot();
	const loc = page.locator(target).first();
	await loc.scrollIntoViewIfNeeded().catch(() => {});
	const b = await loc.boundingBox();
	if (!b) throw new Error(`target ${target} not visible`);
	const [t, r, bo, l] = Array.isArray(pad) ? pad : [pad, pad, pad, pad];
	const vp = page.viewportSize();
	const x = Math.max(0, b.x - l);
	const y = Math.max(0, b.y - t);
	return page.screenshot({
		clip: { x, y, width: Math.min(vp.width - x, b.width + l + r), height: Math.min(vp.height - y, b.height + t + bo) },
	});
}

/* ======================= Run ======================= */
const manifest = allMediaItems().flatMap((p) => p.items.map((it) => ({ ...it, slug: p.slug, title: p.title, key: `${p.slug}#${it.n}` })));
const report = { captured: [], figma: [], missing: [], failed: [] };

if (args.includes('--list')) {
	for (const it of manifest) {
		const r = R[it.key];
		console.log(`${r ? (r.figma ? 'figma ' : r.skip ? 'skip  ' : 'recipe') : 'NONE  '}  ${it.key}  ${it.kind}: ${it.desc}`);
	}
	process.exit(0);
}

const browser = await chromium.launch({ channel: 'msedge', args: ['--autoplay-policy=no-user-gesture-required'] });
const results = new Map(); // key -> { type, w, h, light, dark }

for (const theme of THEMES) {
	const shotCtx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 2 });
	// Clips are encoded at 1056×660, so they are recorded at 1x: the panel renders 4x fewer pixels and keeps pace.
	const clipCtx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 1 });
	const ctx = shotCtx;
	for (const c of [shotCtx, clipCtx]) await c.addInitScript((t) => {
		try {
			localStorage.setItem('klinos-theme', t);
			localStorage.removeItem('klinos-card-order');
		} catch {}
	}, theme);
	const tool = await ctx.newPage();
	await tool.setContent('<!doctype html><title>encoder</title>');

	for (const it of manifest) {
		if (ONLY && !ONLY.has(it.key)) continue;
		const r = R[it.key];
		if (!r) {
			if (theme === THEMES[0]) report.missing.push(it);
			continue;
		}
		if (r.figma || r.skip) {
			if (theme === THEMES[0]) report.figma.push({ ...it, why: r.figma ?? r.skip, figmaOnly: !!r.figma });
			continue;
		}
		const pageCtx = r.kind === 'clip' ? clipCtx : shotCtx;
		const page = await pageCtx.newPage();
		if (r.viewport) await page.setViewportSize(r.viewport);
		const h = helpers(page, tool);
		const suffix = theme === 'light' ? '' : '-dark';
		const dir = join(MEDIA_DIR, it.slug);
		try {
			await page.goto(DEMO);
			await waitReady(page);
			if (r.prep) {
				await r.prep(h);
				await waitReady(page);
			}
			if (r.capped) {
				// Only a real capped message is captured: 4x export of a tall frame hits the 4096 px limit.
				await h.loadImages([await h.standIn(0, 1200, 3200)]);
				await h.clickText('#scale button', '4x');
				await h.click('#go');
				await sleep(2500);
				const msg = await h.js(() => document.getElementById('statustext').textContent);
				if (!/4096|capped|limit/i.test(msg)) throw new Error(`no capped message in the demo (status: "${msg}")`);
				await h.click('#exportclose');
				await sleep(500);
			}
			mkdirSync(dir, { recursive: true });
			let entry;
			if (r.kind === 'clip') {
				const cdp = await pageCtx.newCDPSession(page);
				const frames = [];
				cdp.on('Page.screencastFrame', (f) => {
					frames.push({ data: f.data, ts: f.metadata.timestamp });
					cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
				});
				await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: VIEW.width, maxHeight: VIEW.height });
				await sleep(250);
				const t0 = Date.now();
				await r.act(h);
				const took = Date.now() - t0;
				// Up to 1.5 s over is kept (the real length is stored and shown); more means the recipe needs fixing.
				if (took > it.seconds * 1000 + 1500) throw new Error(`actions took ${(took / 1000).toFixed(1)} s, longer than the ${it.seconds} s clip`);
				var clipSeconds = Math.max(it.seconds, Math.ceil((took + 300) / 1000));
				const left = it.seconds * 1000 - took;
				if (left > 0) await sleep(left);
				await cdp.send('Page.stopScreencast');
				if (r.check && !(await r.check(h))) throw new Error('the action had no visible effect in the demo');
				if (frames.length < 2) throw new Error('no frames recorded');
				const { video, poster } = await encodeClip(tool, frames, clipSeconds);
				writeFileSync(join(dir, `${it.n}${suffix}.webm`), video);
				writeFileSync(join(dir, `${it.n}${suffix}.poster.webp`), poster);
				entry = { type: 'video', w: VIEW.width, h: VIEW.height, file: { src: `${it.n}${suffix}.webm`, poster: `${it.n}${suffix}.poster.webp` }, bytes: video.length, seconds: clipSeconds, note: `${frames.length} frames, ${clipSeconds} s` };
			} else {
				const pngs = [];
				if (r.frames) {
					for (const f of r.frames) {
						await f(h);
						await sleep(200);
						await waitReady(page);
						pngs.push(await grab(page, h.resolve(r.target), r.pad));
					}
				} else {
					pngs.push(await grab(page, r.target && h.resolve(r.target), r.pad));
				}
				if (pngs.length > 1) {
					const d = await framesDiffer(tool, pngs);
					if (d < (r.minDiff ?? 0.6)) throw new Error(`the frames look the same (mean difference ${d.toFixed(2)})`);
				}
				const webp = await toWebP(tool, pngs, r.cols ?? 2);
				writeFileSync(join(dir, `${it.n}${suffix}.webp`), webp);
				entry = { type: 'image', w: toWebP.last.w, h: toWebP.last.h, file: { src: `${it.n}${suffix}.webp` }, bytes: webp.length };
			}
			const prev = results.get(it.key) ?? { type: entry.type, w: entry.w, h: entry.h };
			prev[theme] = entry.file;
			prev.bytes = (prev.bytes ?? 0) + entry.bytes;
			if (entry.seconds) prev.seconds = Math.max(prev.seconds ?? 0, entry.seconds);
			results.set(it.key, prev);
			console.log(`ok   ${theme.padEnd(5)} ${it.key}  ${(entry.bytes / 1024).toFixed(0)} KB${entry.note ? '  ' + entry.note : ''}`);
		} catch (e) {
			console.log(`FAIL ${theme.padEnd(5)} ${it.key}  ${e.message.split('\n')[0]}`);
			if (!report.failed.find((f) => f.key === it.key)) report.failed.push({ ...it, why: e.message.split('\n')[0] });
		} finally {
			await page.close();
		}
	}
	await shotCtx.close();
	await clipCtx.close();
}
await browser.close();

// Metadata for the remark plugin. Only items captured in both requested themes are published.
for (const [key, m] of results) {
	const [slug, n] = key.split('#');
	if (THEMES.some((t) => !m[t])) continue;
	const meta = join(MEDIA_DIR, slug, `${n}.json`);
	const old = existsSync(meta) ? JSON.parse(readFileSync(meta, 'utf8')) : {};
	writeFileSync(meta, JSON.stringify({ ...old, type: m.type, w: m.w, h: m.h, ...(m.seconds && { seconds: m.seconds }), ...(m.light && { light: m.light }), ...(m.dark && { dark: m.dark }) }, null, 2) + '\n');
	report.captured.push(key);
}
// A failed item must not leave half a set behind.
for (const f of report.failed) {
	const dir = join(MEDIA_DIR, f.slug);
	for (const name of [`${f.n}.json`, `${f.n}.webm`, `${f.n}-dark.webm`, `${f.n}.webp`, `${f.n}-dark.webp`, `${f.n}.poster.webp`, `${f.n}-dark.poster.webp`])
		rmSync(join(dir, name), { force: true });
}

// Kept out of public/ so it is not published with the site.
writeFileSync(join(ROOT, 'capture-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`\ncaptured ${report.captured.length}, figma-only ${report.figma.length}, failed ${report.failed.length}, no recipe ${report.missing.length}`);
for (const f of report.failed) console.log(`  failed: ${f.key}: ${f.why}`);
