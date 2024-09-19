import {
  type Plugin,
  type ConfigEnv,
  type UserConfig,
  build as viteBuild,
  type LibraryOptions,
  type InlineConfig,
} from 'vite';
import { resolveServerUrl, resolveViteConfig, withExternalBuiltins, treeKillSync } from './utils';
import { type SpawnOptions } from 'node:child_process';

// public utils
export { resolveViteConfig, withExternalBuiltins };

export interface ElectronOptions {
  /**
   * Shortcut of `build.lib.entry`
   */
  entry?: LibraryOptions['entry'];
  vite?: InlineConfig;
  skipSettingsWrapper?: boolean;
  /**
   * Triggered when Vite is built every time -- `vite serve` command only.
   *
   * If this `onstart` is passed, Electron App will not start automatically.
   * However, you can start Electroo App via `startup` function.
   */
  onstart?: (args: {
    /**
     * Electron App startup function.
     * It will mount the Electron App child-process to `process.electronApp`.
     * @param argv default value `['.', '--no-sandbox']`
     * @param options options for `child_process.spawn`
     * @param customElectronPkg custom electron package name (default: 'electron')
     */
    startup: (argv?: string[], options?: SpawnOptions, customElectronPkg?: string) => Promise<void>;
    /** Reload Electron-Renderer */
    reload: () => void;
  }) => void | Promise<void>;
}

export function build(options: ElectronOptions) {
  return viteBuild(withExternalBuiltins(resolveViteConfig(options)));
}

export default function electron(...options: ElectronOptions[]): Plugin[] {
  const optionsArray = Array.isArray(options) ? options : [options];
  let userConfig: UserConfig;
  let configEnv: ConfigEnv;

  return [
    {
      name: 'vite-plugin-electron',
      apply: 'serve',
      configureServer(server) {
        server.httpServer?.once('listening', async () => {
          Object.assign(process.env, {
            VITE_DEV_SERVER_URL: resolveServerUrl(server),
          });

          const entryCount = optionsArray.length;
          let closeBundleCount = 0;

          for (const options of optionsArray) {
            options.vite ??= {};
            options.vite.mode ??= server.config.mode;
            options.vite.root ??= server.config.root;
            options.vite.envDir ??= server.config.envDir;
            options.vite.envPrefix ??= server.config.envPrefix;

            options.vite.build ??= {};
            options.vite.build.watch ??= {};
            options.vite.build.minify ??= false;

            options.vite.plugins ??= [];
            options.vite.plugins.push({
              name: ':startup',
              closeBundle() {
                const isFirstLoad = closeBundleCount === entryCount - 1;
                if (++closeBundleCount < entryCount) return;

                if (options.onstart && !isFirstLoad) {
                  options.onstart.call(this, {
                    startup,
                    reload() {
                      if (process.electronApp) {
                        (server.hot || server.ws).send({ type: 'full-reload' });
                      } else {
                        startup();
                      }
                    },
                  });
                } else {
                  startup();
                }
              },
            });
            if (options.skipSettingsWrapper) {
              await viteBuild(options.vite);
            } else {
              await build(options);
            }
          }
        });
      },
    },
    {
      name: 'vite-plugin-electron',
      apply: 'build',
      config(config, env) {
        userConfig = config;
        configEnv = env;

        // Make sure that Electron can be loaded into the local file using `loadFile` after packaging.
        config.base ??= './';
      },
      async closeBundle() {
        for (const options of optionsArray) {
          options.vite ??= {};
          options.vite.mode ??= configEnv.mode;
          options.vite.root ??= userConfig.root;
          options.vite.envDir ??= userConfig.envDir;
          options.vite.envPrefix ??= userConfig.envPrefix;
          if (options.skipSettingsWrapper) {
            await viteBuild(options.vite);
          } else {
            await build(options);
          }
        }
      },
    },
  ];
}

/**
 * Electron App startup function.
 * It will mount the Electron App child-process to `process.electronApp`.
 * @param argv default value `['.', '--no-sandbox']`
 * @param options options for `child_process.spawn`
 */
export async function startup(argv = ['.', '--no-sandbox'], options?: SpawnOptions) {
  const { spawn } = await import('node:child_process');
  const electron = await import('electron');
  const electronPath = <any>(electron.default ?? electron);

  await startup.exit();

  // Start Electron.app
  process.electronApp = spawn(electronPath, argv, { stdio: 'inherit', ...options });

  // Exit command after Electron.app exits
  process.electronApp.once('exit', process.exit);

  if (!startup.hookedProcessExit) {
    startup.hookedProcessExit = true;
    process.once('exit', startup.exit);
  }
}
startup.hookedProcessExit = false;
startup.exit = async () => {
  if (process.electronApp) {
    process.electronApp.removeAllListeners();
    treeKillSync(process.electronApp.pid!);
  }
};
