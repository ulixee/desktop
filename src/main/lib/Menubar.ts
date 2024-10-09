import { app, BrowserWindow, Event, shell, Tray } from 'electron';
import log from 'electron-log';
import { autoUpdater, ProgressInfo, UpdateInfo } from 'electron-updater';
import { EventEmitter } from 'events';
import * as Path from 'path';
import { version } from '..';
import IMenubarOptions from '../interfaces/IMenubarOptions';
import { ARGON_FILE_EXTENSION } from '@ulixee/platform-specification/types/IArgonFile';
import ApiManager from './ApiManager';
import installDefaultChrome from './util/installDefaultChrome';
import loadUrl from './util/loadUrl';
import trayPositioner from './util/trayPositioner';
import { WindowManager } from './WindowManager';

const iconPath = Path.resolve(app.getAppPath(), 'resources', 'IconTemplate.png');

export class Menubar extends EventEmitter {
  #tray?: Tray;
  #menuWindow?: BrowserWindow;
  #blurTimeout: NodeJS.Timeout | undefined; // track blur events with timeout
  #windowManager?: WindowManager;
  #isClosing = false;
  #updateInfoPromise?: Promise<UpdateInfo | null>;
  #installUpdateOnExit = false;
  #downloadProgress = 0;
  #apiManager?: ApiManager;

  #argonFileOpen?: string;
  #options: IMenubarOptions;
  #trayMouseover?: boolean;

  constructor(options: IMenubarOptions) {
    super();
    this.#options = options;

    if (!app.requestSingleInstanceLock()) {
      app.quit();
      return;
    }

    // hide the dock icon if it shows
    if (process.platform === 'darwin') {
      app.setActivationPolicy('accessory');
    }
    app.on('second-instance', this.onSecondInstance.bind(this));
    app.on('open-file', this.onFileOpened.bind(this));
    app.setAppLogsPath();
    (process.env as any).ELECTRON_DISABLE_SECURITY_WARNINGS = true;
    void this.appReady();
  }

  get tray(): Tray {
    if (!this.#tray)
      throw new Error('Please access `this.tray` after the `ready` event has fired.');
    return this.#tray;
  }

  private bindSignals(): void {
    let didRun = false;
    const exit = (): Promise<void> => {
      if (didRun) return Promise.resolve();
      didRun = true;
      return this.appExit();
    };
    process.once('beforeExit', exit);
    process.once('exit' as any, exit);
    process.once('SIGTERM', exit);
    process.once('SIGINT', exit);
    process.once('SIGQUIT', exit);
  }

  private hideMenu(): void {
    if (this.#blurTimeout) {
      clearTimeout(this.#blurTimeout);
      this.#blurTimeout = undefined;
    }
    try {
      if (!this.#menuWindow?.isDestroyed()) {
        this.#menuWindow?.hide();
      }
    } catch (error) {
      if (!String(error).includes('Object has been destroyed')) throw error;
    }
  }

  private onSecondInstance(_, argv: string[]): void {
    const argonFile = argv.find(x => x.endsWith(`.${ARGON_FILE_EXTENSION}`));
    if (argonFile) {
      this.handleArgonFile(argonFile);
    }
  }

  private handleArgonFile(path: string): void {
    if (!path.endsWith(`.${ARGON_FILE_EXTENSION}`)) return;

    if (this.#apiManager) {
      void this.#apiManager.onArgonFileOpened(path);
    } else {
      this.#argonFileOpen = path;
    }
  }

  private onFileOpened(e: Event, path: string): void {
    if (!path.endsWith(`.${ARGON_FILE_EXTENSION}`)) return;

    e.preventDefault();
    this.handleArgonFile(path);
  }

  private async showMenu(trayPos?: Electron.Rectangle): Promise<void> {
    if (!this.#tray) {
      throw new Error('Tray should have been instantiated by now');
    }

    if (!this.#menuWindow) {
      await this.createWindow();
    }

    // Use guard for TypeScript, to avoid ! everywhere
    if (!this.#menuWindow) {
      throw new Error('Window has been initialized just above. qed.');
    }

    if (trayPos) trayPositioner.alignTrayMenu(this.#menuWindow, trayPos);
    this.#menuWindow.show();
    this.#menuWindow.focus();
    this.#menuWindow.on('blur', this.checkHideMenu.bind(this));
  }

  private async beforeQuit(): Promise<void> {
    if (this.#isClosing) return;
    this.#isClosing = true;
    console.warn('Quitting Ulixee Menubar');
    this.#tray?.removeAllListeners();
    this.hideMenu();
    await this.#apiManager?.close();
    this.#windowManager?.close();
    if (this.#installUpdateOnExit) {
      await this.#updateInfoPromise;
      await autoUpdater.quitAndInstall(false, true);
    }
  }

  private async appExit(): Promise<void> {
    await this.beforeQuit();
    app.exit();
  }

  private async appReady(): Promise<void> {
    try {
      await app.whenReady();
      // for now auto-start
      this.#apiManager = new ApiManager();
      this.#windowManager = new WindowManager(this, this.#apiManager);
      await this.#apiManager.start();
      this.bindSignals();
      if (this.#argonFileOpen) {
        await this.#apiManager.onArgonFileOpened(this.#argonFileOpen);
        this.#argonFileOpen = undefined;
      }
      await this.updateLocalCloudStatus();

      await this.createWindow();

      this.#tray = new Tray(iconPath);

      app.on('activate', () => {
        if (!this.#windowManager?.desktopWindow.isOpen) {
          this.#windowManager!.desktopWindow.focus();
        }
      });

      this.#tray.on('click', this.clicked.bind(this));
      this.#tray.on('mouse-leave', this.leaveTray.bind(this));
      this.#tray.on('mouse-enter', this.enterTray.bind(this));
      this.#tray.on('right-click', this.rightClicked.bind(this));
      this.#tray.on('drop-files', this.onDropFiles.bind(this));
      this.#tray.setToolTip(this.#options.tooltip || '');
      app.dock?.hide();

      this.emit('ready');

      this.initUpdater();
      await installDefaultChrome();
    } catch (error) {
      console.error('ERROR in appReady: ', error);
      await this.appExit();
    }
  }

  private checkHideMenu(): void {
    if (!this.#trayMouseover) {
      this.hideMenu();
    }
  }

  private enterTray(): void {
    this.#trayMouseover = true;
  }

  private leaveTray(): void {
    this.#trayMouseover = false;
    if (!this.#menuWindow?.isFocused()) {
      this.hideMenu();
    }
  }

  private initUpdater(): void {
    try {
      autoUpdater.logger = null;
      autoUpdater.autoDownload = true;
      autoUpdater.autoInstallOnAppQuit = false;
      autoUpdater.allowDowngrade = true;
      autoUpdater.allowPrerelease = version.includes('alpha');
      autoUpdater.on('update-not-available', this.noUpdateAvailable.bind(this));
      autoUpdater.on('update-available', this.onUpdateAvailable.bind(this));
      autoUpdater.signals.progress(this.onDownloadProgress.bind(this));
    } catch (error) {
      log.error('Error initializing AutoUpdater', { error });
    }
  }

  private async noUpdateAvailable(): Promise<void> {
    log.verbose('No new Ulixee.app versions available');
    await this.sendToFrontend('Version.onLatest', {});
  }

  private async onUpdateAvailable(update: UpdateInfo): Promise<void> {
    log.info('New Ulixee.app version available', update);
    this.#updateInfoPromise = Promise.resolve(update);
    await this.sendToFrontend('Version.available', {
      version: update.version,
    });
  }

  private async onDownloadProgress(progress: ProgressInfo): Promise<void> {
    log.verbose('New version download progress', progress);
    this.#downloadProgress = Math.round(progress.percent);
    await this.sendToFrontend('Version.download', {
      progress: this.#downloadProgress,
    });
  }

  private async versionCheck(): Promise<void> {
    if (await this.#updateInfoPromise) return;
    if (autoUpdater.isUpdaterActive()) return;
    try {
      log.verbose('Checking for version update');
      this.#updateInfoPromise = autoUpdater.checkForUpdates().then(x => x?.updateInfo ?? null);
      await this.#updateInfoPromise;
    } catch (error) {
      log.error('ERROR checking for new version', error);
    }
  }

  private async versionInstall(): Promise<void> {
    log.verbose('Installing version', {
      progress: this.#downloadProgress,
      update: await this.#updateInfoPromise,
    });
    this.#installUpdateOnExit = true;
    await this.sendToFrontend('Version.installing', {});
    if (this.#downloadProgress < 100) await autoUpdater.downloadUpdate();
    autoUpdater.quitAndInstall(false, true);
  }

  private async clicked(): Promise<void> {
    if (this.#menuWindow?.isVisible()) {
      this.hideMenu();
    }

    await this.#windowManager?.openDesktop();
    await this.checkForUpdates();
  }

  private async rightClicked(
    event?: Electron.KeyboardEvent,
    bounds?: Electron.Rectangle,
  ): Promise<void> {
    if (event && (event.shiftKey || event.ctrlKey || event.metaKey)) {
      return this.hideMenu();
    }

    // if blur was invoked clear timeout
    if (this.#blurTimeout) {
      clearInterval(this.#blurTimeout);
      this.#blurTimeout = undefined;
    }

    if (this.#menuWindow?.isVisible()) {
      return this.hideMenu();
    }

    await this.showMenu(bounds);
    await this.checkForUpdates();
  }

  private onDropFiles(_, files: string[]): void {
    for (const file of files) {
      if (file.endsWith(ARGON_FILE_EXTENSION)) this.handleArgonFile(file);
    }
  }

  private async checkForUpdates(): Promise<void> {
    try {
      if (!this.#updateInfoPromise) {
        this.#updateInfoPromise = autoUpdater
          .checkForUpdatesAndNotify()
          .then(x => x?.updateInfo ?? null);
        await this.#updateInfoPromise;
      }
    } catch (error) {
      log.error('ERROR checking for new version', error);
    }
  }

  private async createWindow(): Promise<void> {
    const defaults = {
      show: false, // Don't show it at first
      frame: false, // Remove window frame
      width: this.#options.width,
      height: this.#options.height,
    };

    this.#menuWindow = new BrowserWindow({
      ...defaults,
      roundedCorners: true,
      skipTaskbar: true,
      autoHideMenuBar: true,
      transparent: false,
      alwaysOnTop: true,
      useContentSize: true,
      webPreferences: {
        javascript: true,
        preload: `${__dirname}/preload/menubar.js`,
      },
    });

    this.#menuWindow.on('blur', () => {
      if (!this.#menuWindow || this.#isClosing) {
        return;
      }
      this.#blurTimeout = setTimeout(() => this.hideMenu(), 100);
    });
    this.#menuWindow.on('focus', () => {
      clearTimeout(this.#blurTimeout);
      this.#blurTimeout = undefined;
    });

    this.#menuWindow.setVisibleOnAllWorkspaces(true);
    this.#menuWindow.on('close', this.windowClear.bind(this));
    this.#menuWindow.webContents.on('ipc-message', async (e, message, ...args) => {
      if (message === 'desktop:api') {
        const [api] = args;

        if (api === 'mousedown') {
          this.hideMenu();
        }

        if (api === 'App.quit') {
          await this.appExit();
        }

        if (api === 'App.openLogsDirectory') {
          await shell.openPath(Path.dirname(log.transports.file.getFile().path));
        }

        if (api === 'App.openDataDirectory') {
          if (this.#apiManager?.localCloud) {
            await shell.openPath(this.#apiManager.localCloud.datastoreCore.options.datastoresDir);
          }
        }

        if (api === 'App.openHeroSession') {
          await this.#windowManager?.pickHeroSession();
        }

        if (api === 'App.openDesktop') {
          await this.#windowManager?.openDesktop();
        }

        if (api === 'Cloud.stop' || api === 'Cloud.restart') {
          await this.stopCloud();
        }

        if (api === 'Cloud.start' || api === 'Cloud.restart') {
          await this.startCloud();
        }

        if (api === 'Cloud.getStatus') {
          await this.updateLocalCloudStatus();
        }

        if (api === 'Version.check') {
          await this.versionCheck();
        }

        if (api === 'Version.install') {
          await this.versionInstall();
        }
      }
    });

    await loadUrl(this.#menuWindow.webContents, `menubar.html`);
    if (process.env.OPEN_DEVTOOLS) {
      this.#menuWindow.webContents.openDevTools({ mode: 'detach' });
    }
    if (this.#apiManager?.localCloud) {
      await this.updateLocalCloudStatus();
    }
  }

  private windowClear(): void {
    this.#menuWindow = undefined;
  }

  /// //// CLOUD MANAGEMENT ////////////////////////////////////////////////////////////////////////////////////////////

  private async stopCloud(): Promise<void> {
    if (!this.#apiManager || !this.#apiManager?.localCloud) return;

    // eslint-disable-next-line no-console
    console.log(`CLOSING ULIXEE CLOUD`);
    await this.#apiManager.stopLocalCloud();
    await this.updateLocalCloudStatus();
  }

  private async startCloud(): Promise<void> {
    if (!this.#apiManager) return;
    await this.#apiManager.startLocalCloud();

    // eslint-disable-next-line no-console
    console.log(`STARTED ULIXEE CLOUD at ${await this.#apiManager.localCloud!.address}`);
    await this.updateLocalCloudStatus();
  }

  private async updateLocalCloudStatus(): Promise<void> {
    if (this.#isClosing || !this.#apiManager) return;
    let address: string | undefined;
    if (this.#apiManager.localCloud) {
      address = await this.#apiManager.localCloud.address;
    }
    await this.sendToFrontend('Cloud.status', {
      started: !!this.#apiManager.localCloud,
      address,
    });
  }

  private async sendToFrontend(eventType: string, data: any): Promise<void> {
    if (this.#menuWindow) {
      const json = { detail: { eventType, data } };
      await this.#menuWindow.webContents.executeJavaScript(`(()=>{
      const evt = ${JSON.stringify(json)};
      document.dispatchEvent(new CustomEvent('desktop:event', evt));
    })()`);
    }
  }
}
