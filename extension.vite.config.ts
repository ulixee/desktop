import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src/chrome-extension',
  build: {
    lib: {
      entry: ['content.ts', 'devtools.ts'],
    },
    outDir: resolve('out/renderer'),
    target: 'chrome120',
    // needed for commonjs to be activated for @ulixee deps
    commonjsOptions: { include: [/@ulixee\/.*/] },
    emptyOutDir: false,
    sourcemap: 'inline',
  },
  resolve: {
    alias: {
      '@': resolve('src/chrome-extension'),
    },
  },
});
