import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

// Social titles follow the browser tab title ("Lighting - Klinos Docs"; Home: "Klinos Docs"),
// instead of Starlight's default of the bare page title.
export const onRequest = defineRouteMiddleware((context) => {
	const { head } = context.locals.starlightRoute;
	const title = head.find((entry) => entry.tag === 'title')?.content;
	if (!title) return;
	for (const entry of head) {
		if (entry.tag !== 'meta') continue;
		const key = entry.attrs?.property ?? entry.attrs?.name;
		if (key === 'og:title' || key === 'twitter:title') entry.attrs = { ...entry.attrs, content: title };
	}
});
