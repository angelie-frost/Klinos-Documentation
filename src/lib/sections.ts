// The docs' two top-level sections (the `##` headings of sidebar.md: "User guide", "Team handbook").
// The sidebar shows one section at a time; the section tabs switch between them.
import type { StarlightRouteData } from '@astrojs/starlight/route-data';

type Entry = StarlightRouteData['sidebar'][number];

const hasCurrent = (e: Entry): boolean => (e.type === 'link' ? e.isCurrent : e.entries.some(hasCurrent));
const firstLink = (e: Entry): string | undefined => (e.type === 'link' ? e.href : e.entries.map(firstLink).find(Boolean));

/** The section that holds the current page; the first section when none does (the 404 page). */
export function currentSection(sidebar: Entry[]): Entry | undefined {
	return sidebar.find(hasCurrent) ?? sidebar[0];
}

/** One option per section: its label from sidebar.md ("User guide"), its first page, and whether it is current. */
export function sectionTabs(sidebar: Entry[]) {
	const current = currentSection(sidebar);
	return sidebar
		.filter((s) => s.type === 'group')
		.map((s) => ({
			label: s.label,
			href: firstLink(s) ?? '/',
			current: s === current,
		}));
}
