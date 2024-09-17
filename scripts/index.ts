export {
  type LogLevel,
  createLogger,
  mergeConfig,
  splitVendorChunkPlugin,
  splitVendorChunk,
} from 'vite';
export * from './config';
export { createServer } from './server';
export { build } from './build';
export { preview } from './preview';
export { loadEnv } from './utils';
export * from './plugins/externalizeDeps';
