// @ts-check
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Use adapter-auto which should already be installed
		adapter: adapter(),
		
		// For a library, we don't need a full SvelteKit setup
		files: {
			lib: 'src/lib'
		}
	}
};

export default config;
