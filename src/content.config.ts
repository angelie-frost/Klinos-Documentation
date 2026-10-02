import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		// `order` is kept in the source frontmatter; the sidebar order comes from sidebar.md.
		schema: docsSchema({ extend: z.object({ order: z.number().optional() }) }),
	}),
};
