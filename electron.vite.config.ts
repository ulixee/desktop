import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from './scripts';
import vue from '@vitejs/plugin-vue';
import prismjs from 'vite-plugin-prismjs';
import svgLoader from 'vite-svg-loader';
import native from 'vite-plugin-native';

export default defineConfig({
  main: {
    resolve: {
      preserveSymlinks: true,
    },
    logLevel: 'info',
    build: {
      sourcemap: true,
      rollupOptions: {
        input: {
          index: resolve('src/main/index.ts'),
        },
        external: source => {
          if (source.startsWith('src') || source.startsWith('.') || source.includes(__dirname))
            return false;

          return true;
        },
      },
      // needed for commonjs to be activated for @ulixee deps
      commonjsOptions: {
        requireReturnsDefault: 'auto',
        sourceMap: true,
        defaultIsModuleExports: 'auto',
        include: [/.*/],
      },
    },
    plugins: [native({})],
  },
  preload: {
    build: {
      rollupOptions: {
        input: {
          extension: resolve('src/preload/ChromeAlivePagePreload.ts'),
          desktop: resolve('src/preload/DesktopPagePreload.ts'),
          menubar: resolve('src/preload/MenubarPagePreload.ts'),
        },
      },
    },
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@': resolve('src/renderer/src'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          desktop: resolve('src/renderer/desktop.html'),
          menubar: resolve('src/renderer/menubar.html'),
          'menu-finder': resolve('src/renderer/menu-finder.html'),
          'menu-primary': resolve('src/renderer/menu-primary.html'),
          'menu-timetravel': resolve('src/renderer/menu-timetravel.html'),
          'menu-url': resolve('src/renderer/menu-url.html'),
          'screen-about': resolve('src/renderer/screen-about.html'),
          'screen-input': resolve('src/renderer/screen-input.html'),
          'screen-output': resolve('src/renderer/screen-output.html'),
          'screen-reliability': resolve('src/renderer/screen-reliability.html'),
          toolbar: resolve('src/renderer/toolbar.html'),
          resources: resolve('src/renderer/extension/resources.html'),
          'hero-script': resolve('src/renderer/extension/hero-script.html'),
          'state-generator': resolve('src/renderer/extension/state-generator.html'),
        },
        preserveSymlinks: true,
        external: [/node_modules/, /packages/],
      },
      sourcemap: true,
      target: 'chrome120',
      // needed for commonjs to be activated for @ulixee deps
      commonjsOptions: {
        defaultIsModuleExports: 'auto',
        include: [/.*/],
      },
    },
    plugins: [
      native({}),
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
});
