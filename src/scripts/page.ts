// Page behaviours: mermaid diagrams (themed, re-rendered on theme change) and the Try it live embed.

/* ---------- Mermaid ---------- */
const diagrams = Array.from(document.querySelectorAll<HTMLElement>('pre[data-mermaid]'));
if (diagrams.length) {
	const sources = diagrams.map((el) => el.textContent ?? '');
	const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
	let run = 0;
	const render = async () => {
		const id = ++run;
		const { default: mermaid } = await import('mermaid');
		mermaid.initialize({
			startOnLoad: false,
			securityLevel: 'strict',
			theme: 'base',
			fontFamily: token('--k-font-body'),
			themeVariables: {
				darkMode: document.documentElement.dataset.theme !== 'light',
				background: token('--k-surface'),
				primaryColor: token('--k-sunk'),
				primaryTextColor: token('--k-ink'),
				primaryBorderColor: token('--k-line2'),
				lineColor: token('--k-ink3'),
				textColor: token('--k-ink'),
				fontSize: '14px',
			},
		});
		for (const [i, el] of diagrams.entries()) {
			const { svg } = await mermaid.render(`mermaid-${i}-${id}`, sources[i]);
			if (id !== run) return;
			el.innerHTML = svg;
			el.dataset.rendered = '';
		}
	};
	render();
	window.addEventListener('klinos:theme', () => render());
}

/* ---------- Try it live ---------- */
const live = document.querySelector<HTMLElement>('[data-live-demo]');
if (live) {
	const frame = live.querySelector<HTMLIFrameElement>('[data-live-frame]')!;
	const dot = live.querySelector<HTMLElement>('[data-live-dot]')!;
	const text = live.querySelector<HTMLElement>('[data-live-text]')!;
	const DEMO_KEYS = ['klinos-theme', 'klinos-card-order'];
	let timer: number | undefined;
	const status = (state: 'loading' | 'ready' | 'offline', msg: string) => {
		dot.className = 'dot ' + state;
		text.textContent = msg;
	};
	const check = () => {
		clearTimeout(timer);
		const started = Date.now();
		const poll = () => {
			let ok = false;
			try {
				ok = !!(frame.contentWindow as any)?.THREE;
			} catch {}
			if (ok) status('ready', 'Ready. The Klinos panel is running in your browser.');
			else if (Date.now() - started > 8000)
				status('offline', "Couldn't load Three.js from unpkg.com. The demo needs an internet connection.");
			else timer = window.setTimeout(poll, 250);
		};
		poll();
	};
	frame.addEventListener('load', check);
	// The frame may have finished loading before this script ran.
	try {
		if (frame.contentDocument?.readyState === 'complete' && frame.contentWindow?.location.href.endsWith('/demo/preview.html')) check();
	} catch {}
	live.querySelector('[data-live-reset]')?.addEventListener('click', () => {
		try {
			DEMO_KEYS.forEach((k) => localStorage.removeItem(k));
		} catch {}
		status('loading', 'Resetting the Klinos panel…');
		frame.contentWindow?.location.reload();
	});
}

/* Sidebar: bringing the current page into view (the prototype's revealActive) is done before the first paint
   in overrides/Sidebar.astro, together with keeping the sidebar's scroll between pages. */

/* ---------- Media: lightbox for images ---------- */
const zoomButtons = document.querySelectorAll<HTMLButtonElement>('[data-zoom]');
if (zoomButtons.length) {
	const box = document.createElement('dialog');
	box.className = 'lightbox';
	box.setAttribute('aria-label', 'Enlarged image');
	box.innerHTML =
		'<button class="lightbox-close" type="button" aria-label="Close">&times;</button><figure><img alt=""><figcaption></figcaption></figure>';
	document.body.append(box);
	const img = box.querySelector('img')!;
	const cap = box.querySelector('figcaption')!;
	let opener: HTMLElement | null = null;
	const close = () => box.open && box.close();
	box.querySelector('.lightbox-close')!.addEventListener('click', close);
	// Click on the dim backdrop (outside the figure) closes; Esc closes natively (the 'cancel' event).
	box.addEventListener('click', (e) => {
		if (e.target === box) close();
	});
	box.addEventListener('close', () => opener?.focus());
	zoomButtons.forEach((btn) =>
		btn.addEventListener('click', () => {
			// The variant that is visible in the current theme.
			const shown = [...btn.querySelectorAll('img')].find((i) => i.offsetParent !== null) ?? btn.querySelector('img');
			if (!shown) return;
			opener = btn;
			img.src = shown.currentSrc || shown.src;
			img.alt = shown.alt;
			cap.textContent = btn.closest('figure')?.querySelector('figcaption span')?.textContent ?? '';
			box.showModal(); // modal dialog: focus moves inside and stays there until it closes
		})
	);
}

/* ---------- Media: videos play while visible, with a pause control; reduced motion shows the poster ---------- */
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const videoBoxes = document.querySelectorAll<HTMLElement>('.clip-media.is-video');
if (videoBoxes.length) {
	const visibleVideo = (box: HTMLElement) =>
		[...box.querySelectorAll<HTMLVideoElement>('video')].find((v) => v.offsetParent !== null) ?? null;
	const setButton = (box: HTMLElement, playing: boolean) => {
		const b = box.closest('figure')?.querySelector<HTMLButtonElement>('[data-media-toggle]');
		if (!b) return;
		b.setAttribute('aria-label', playing ? 'Pause' : 'Play');
		b.dataset.state = playing ? 'playing' : 'paused';
	};
	const pausedByUser = new WeakSet<HTMLElement>();
	const playBox = (box: HTMLElement) => {
		box.querySelectorAll('video').forEach((v) => v !== visibleVideo(box) && v.pause());
		const v = visibleVideo(box);
		if (!v) return;
		v.play().then(
			() => setButton(box, true),
			() => setButton(box, false)
		);
	};
	const pauseBox = (box: HTMLElement) => {
		box.querySelectorAll('video').forEach((v) => v.pause());
		setButton(box, false);
	};
	const io = new IntersectionObserver(
		(entries) => {
			for (const e of entries) {
				const box = e.target as HTMLElement;
				if (e.isIntersecting && !reduceMotion.matches && !pausedByUser.has(box)) playBox(box);
				else pauseBox(box);
			}
		},
		{ threshold: 0.35 }
	);
	videoBoxes.forEach((box) => {
		setButton(box, false);
		io.observe(box);
		box.closest('figure')?.querySelector('[data-media-toggle]')?.addEventListener('click', () => {
			const v = visibleVideo(box);
			if (v && !v.paused) {
				pausedByUser.add(box);
				pauseBox(box);
			} else {
				pausedByUser.delete(box);
				playBox(box);
			}
		});
	});
	// Theme switch: the other variant becomes visible, so restart whichever is now shown.
	window.addEventListener('klinos:theme', () =>
		videoBoxes.forEach((box) => {
			const playing = [...box.querySelectorAll('video')].some((v) => !v.paused);
			if (playing) playBox(box);
		})
	);
}
