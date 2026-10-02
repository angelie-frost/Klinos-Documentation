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

/* ---------- Sidebar: bring the current page into view (prototype revealActive) ---------- */
const pane = document.querySelector<HTMLElement>('.sidebar-pane');
const currentLink = pane?.querySelector<HTMLElement>('a[aria-current="page"]');
if (pane && currentLink) {
	const a = currentLink.getBoundingClientRect();
	const p = pane.getBoundingClientRect();
	const pad = 48;
	if (a.top < p.top + pad || a.bottom > p.bottom - pad) {
		pane.scrollTop += a.top - p.top - p.height / 2 + a.height / 2;
	}
}
