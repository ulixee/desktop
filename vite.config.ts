import vue from '@vitejs/plugin-vue';
import { existsSync, rmSync } from 'node:fs';
import * as path from 'node:path';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import prismjs from 'vite-plugin-prismjs';
import svgLoader from 'vite-svg-loader';
import electron from './scripts/electron';

if (existsSync(resolve('main'))) rmSync(resolve('main'), { recursive: true });

export default defineConfig({
  publicDir: false,
  build: {
    outDir: resolve('main'),
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
                  source.startsWith('/') ||
                  /^[A-Za-z]:/.test(source) ||
                  source.includes('desktop\\\\src') ||
                  source.includes('desktop/src')
                )
                  return false;

                return true;
              },
              output: {
                interop: 'compat',
              },
            },
            minify: false,
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
          chromealive: resolve('src/preload/ChromeAlivePagePreload.ts'),
          desktop: resolve('src/preload/DesktopPagePreload.ts'),
          menubar: resolve('src/preload/MenubarPagePreload.ts'),
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
              entry: resolve('src/chrome-extension/content.ts'),
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
                resolve('src/ui/menubar.html'),
                resolve('src/ui/menu-finder.html'),
                resolve('src/ui/menu-primary.html'),
                resolve('src/ui/menu-timetravel.html'),
                resolve('src/ui/menu-url.html'),
                resolve('src/ui/screen-about.html'),
                resolve('src/ui/screen-input.html'),
                resolve('src/ui/screen-output.html'),
                resolve('src/ui/screen-reliability.html'),
                resolve('src/ui/toolbar.html'),
                resolve('src/ui/devtools-entrypoint.html'),
                resolve('src/ui/extension/resources.html'),
                resolve('src/ui/extension/hero-script.html'),
                resolve('src/ui/extension/state-generator.html'),
              ],
            },
            sourcemap: process.env.NODE_ENV === 'production',
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
