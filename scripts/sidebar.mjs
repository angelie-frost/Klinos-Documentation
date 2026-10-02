// Parses sidebar.md (the source of truth for section, group and page order)
// into Starlight sidebar config. "(unreleased)" in a label becomes an "Unreleased" badge.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SIDEBAR_FILE = fileURLToPath(new URL('../sidebar.md', import.meta.url));
const UNRELEASED = /\s*\(unreleased\)\s*$/i;
const BADGE = { text: 'Unreleased', variant: 'default' };

/** Strip "(unreleased)" from a label and say whether it was there. */
function splitLabel(raw) {
	const unreleased = UNRELEASED.test(raw);
	return { label: raw.replace(UNRELEASED, '').trim(), unreleased };
}

/** Slug for a docs path such as "using-klinos/studio/lighting.md". */
export function slugFor(path) {
	return path.replace(/\\/g, '/').replace(/\.md$/, '');
}

/**
 * Returns { sections, pages }.
 * sections: [{ label, groups: [{ label, unreleased, items: [{ label, slug, unreleased }] }] }]
 * pages: Map slug → { label, section, group, unreleased } (unreleased includes the group's flag)
 */
export function readSidebar() {
	const sections = [];
	const pages = new Map();
	let section = null;
	let group = null;
	readFileSync(SIDEBAR_FILE, 'utf8')
		.split(/\r?\n/)
		.forEach((line, i) => {
			let m;
			if ((m = line.match(/^## (.+)$/))) {
				section = { label: m[1].trim(), groups: [] };
				sections.push(section);
				group = null;
			} else if ((m = line.match(/^### (.+)$/))) {
				if (!section) throw new Error(`sidebar.md:${i + 1}: group before any section`);
				group = { ...splitLabel(m[1].trim()), items: [] };
				section.groups.push(group);
			} else if ((m = line.match(/^- (.+?):\s*(\S+\.md)\s*$/))) {
				if (!group) throw new Error(`sidebar.md:${i + 1}: page before any group`);
				const item = { ...splitLabel(m[1].trim()), slug: slugFor(m[2]) };
				group.items.push(item);
				pages.set(item.slug, {
					label: item.label,
					section: section.label,
					group: group.label,
					unreleased: item.unreleased || group.unreleased,
				});
			}
		});
	return { sections, pages };
}

/** Starlight `sidebar` option. */
export function starlightSidebar() {
	return readSidebar().sections.map((s) => ({
		label: s.label,
		items: s.groups.map((g) => ({
			label: g.label,
			...(g.unreleased && { badge: BADGE }),
			items: g.items.map((it) => ({
				label: it.label,
				slug: it.slug,
				...(it.unreleased && { badge: BADGE }),
			})),
		})),
	}));
}
