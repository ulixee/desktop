import { defineConfig } from 'vite';
import electron from './scripts/electron';
import { resolve } from 'node:path';
import prismjs from 'vite-plugin-prismjs';
import svgLoader from 'vite-svg-loader';
import vue from '@vitejs/plugin-vue';
import { rmSync, existsSync } from 'node:fs';

if (existsSync(resolve('main'))) rmSync(resolve('main'), { recursive: true });

export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'main',
    rollupOptions: {
      input: resolve('src/empty.ts'),
    },
  },
  plugins: [
    electron(
      {
        entry: resolve('src/main/index.ts'),
        vite: {
          build: {
            outDir: resolve('main'),
            sourcemap: true,
            rollupOptions: {
              external: source => {
                if (
                  source.startsWith('src') ||
                  source.startsWith('.') ||
                  source.includes(__dirname)
                )
                  return false;

                return true;
              },
              output: {
                interop: 'auto',
              },
            },
            commonjsOptions: {
              requireReturnsDefault: 'preferred',
              sourceMap: true,
              defaultIsModuleExports: 'auto',
              include: [/.*/],
            },
          },
        },
      },
      {
        onstart(args) {
          // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete,
          // instead of restarting the entire Electron App.
          args.reload();
        },
        entry: {
          chromealive: 'src/preload/ChromeAlivePagePreload.ts',
          desktop: 'src/preload/DesktopPagePreload.ts',
          menubar: 'src/preload/MenubarPagePreload.ts',
        },
        vite: {
          build: {
            outDir: resolve('main/preload'),
          },
        },
      },
      {
        onstart(args) {
          // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete,
          // instead of restarting the entire Electron App.
          args.reload();
        },
        skipSettingsWrapper: true,
        vite: {
          configFile: false,
          publicDir: 'public',
          root: resolve('src/chrome-extension'),
          base: './',
          build: {
            lib: {
              entry: 'content.ts',
              formats: ['cjs'],
              fileName: () => '[name].js',
            },
            outDir: resolve('ui'),
            emptyOutDir: false,
            minify: false,
            rollupOptions: {},
            sourcemap: 'inline',
            target: 'chrome120',
            // needed for commonjs to be activated for @ulixee deps
            commonjsOptions: { include: [/.+/] },
          },
          resolve: {
            alias: {
              '@': resolve('src/chrome-extension'),
            },
          },
        },
      },
      {
        onstart() {
          // Let HMR do its thing
        },
        skipSettingsWrapper: true,
        vite: {
          configFile: false,
          publicDir: false,
          root: resolve('src/ui'),
          base: './',
          resolve: {
            alias: {
              '@': resolve('src/ui/src'),
            },
          },
          build: {
            outDir: resolve('ui'),
            emptyOutDir: false,
            rollupOptions: {
              input: [
                resolve('src/ui/desktop.html'),
                'src/ui/menubar.html',
                'src/ui/menu-finder.html',
                'src/ui/menu-primary.html',
                'src/ui/menu-timetravel.html',
                'src/ui/menu-url.html',
                'src/ui/screen-about.html',
                'src/ui/screen-input.html',
                'src/ui/screen-output.html',
                'src/ui/screen-reliability.html',
                'src/ui/toolbar.html',
                'src/ui/devtools-entrypoint.html',
                'src/ui/extension/resources.html',
                'src/ui/extension/hero-script.html',
                'src/ui/extension/state-generator.html',
              ],
            },
            sourcemap: false,
            target: 'chrome128',
            modulePreload: false,
            // needed for commonjs to be activated for @ulixee deps
            commonjsOptions: {
              defaultIsModuleExports: 'auto',
              include: [/.+/],
            },
          },
          plugins: [
            vue({
              template: {
                compilerOptions: {
                  whitespace: 'preserve',
                },
              },
            }),
            svgLoader({
              svgoConfig: {
                multipass: true,
              },
            }),
            prismjs({
              languages: ['javascript', 'typescript', 'shell'],
            }),
          ],
        },
      },
    ),
  ],
});
