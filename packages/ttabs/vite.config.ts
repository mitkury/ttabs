import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';
import path from 'path';

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		lib: {
			entry: './src/lib/index.ts',
			formats: ['es']
		}
	},
	test: {
		globals: true,
		environment: 'jsdom',
		exclude: [...configDefaults.exclude, 'dist/**'],
		include: ['src/**/*.{test,spec}.{js,ts,svelte}'],
		coverage: {
			reporter: ['text', 'json', 'html']
		}
	},
	// Tell Vitest to use the `browser` entry points in `package.json` files, even though it's running in Node
	resolve: {
		// Use browser conditions when running tests
		...(process.env.VITEST ? { conditions: ['browser'] } : {}),
		// Always alias ttabs-svelte to the dist folder for testing
		alias: {
			'ttabs-svelte': path.resolve(__dirname, './dist')
		}
	}
});
