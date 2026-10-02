// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { unified } from '@astrojs/markdown-remark';
import remarkKlinos from './src/plugins/remark-klinos.mjs';
import { starlightSidebar } from './scripts/sidebar.mjs';

export default defineConfig({
	devToolbar: { enabled: false },
	// The home page lives at its folder address; the bare root forwards to it.
	redirects: { '/': '/using-klinos/start-here/home/' },
	markdown: {
		// Keep the text exactly as written (no curly-quote or dash substitution).
		processor: unified({ remarkPlugins: [remarkKlinos], smartypants: false }),
	},
	integrations: [
		starlight({
			title: 'Klinos Docs',
			description: 'Documentation for Klinos, a Figma plugin for device mockups and angled cards.',
			favicon: '/favicon.svg',
			sidebar: starlightSidebar(),
			// Dates come from git, written into the frontmatter by scripts/sync-content.mjs.
			lastUpdated: false,
			pagination: true,
			credits: false,
			customCss: [
				'@fontsource/inter/400.css',
				'@fontsource/inter/500.css',
				'@fontsource/inter/600.css',
				'@fontsource/inter-tight/600.css',
				'@fontsource/geist-mono/400.css',
				'@fontsource/geist-mono/500.css',
				'./src/styles/tokens.css',
				'./src/styles/klinos.css',
			],
			components: {
				Header: './src/components/overrides/Header.astro',
				ThemeSelect: './src/components/overrides/ThemeSelect.astro',
				PageTitle: './src/components/overrides/PageTitle.astro',
				Head: './src/components/overrides/Head.astro',
				ThemeProvider: './src/components/overrides/ThemeProvider.astro',
			},
			expressiveCode: {
				// Light first: it is the site's default theme.
				themes: ['github-light-default', 'github-dark-default'],
				styleOverrides: {
					borderRadius: '12px',
					borderColor: 'var(--k-line)',
					codeBackground: 'var(--k-sunk)',
					codeFontFamily: 'var(--k-font-mono)',
					codeFontSize: '14px',
					scrollbarThumbColor: 'color-mix(in srgb, var(--k-ink3) 55%, transparent)',
					scrollbarThumbHoverColor: 'var(--k-ink3)',
					uiFontFamily: 'var(--k-font-body)',
					frames: {
						editorBackground: 'var(--k-sunk)',
						terminalBackground: 'var(--k-sunk)',
						editorTabBarBackground: 'var(--k-sunk)',
						terminalTitlebarBackground: 'var(--k-sunk)',
						frameBoxShadowCssValue: 'none',
					},
				},
			},
		}),
	],
});
