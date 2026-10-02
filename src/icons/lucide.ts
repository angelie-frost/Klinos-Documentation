// Lucide icons (ISC), copied unchanged from lucide-static 1.49.0 into src/icons/lucide/; see LICENSES/lucide.txt.
// Returns the SVG markup ready to inline: licence comment removed, sized by CSS, hidden from assistive tech.
const files = import.meta.glob('./lucide/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export function lucide(name: string, className = ''): string {
	const raw = files[`./lucide/${name}.svg`];
	if (!raw) throw new Error(`Lucide icon "${name}" is not in src/icons/lucide/`);
	return raw
		.replace(/<!--[\s\S]*?-->\s*/, '')
		.replace(/\s(width|height)="24"/g, '')
		.replace('<svg', `<svg aria-hidden="true" focusable="false"`)
		.replace(/class="([^"]*)"/, (_, c) => `class="${c}${className ? ' ' + className : ''}"`)
		.trim();
}
