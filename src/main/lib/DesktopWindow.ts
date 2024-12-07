import { app, BrowserWindow, WebContents, shell } from 'electron';
import * as Path from 'path';
import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import { TypedEventEmitter } from '@ulixee/commons/lib/eventUtils';
import ApiManager from './ApiManager';
import generateContextMenu from '../menus/generateContextMenu';
import WindowStateKeeper from './util/windowStateKeeper';
import loadUrl from './util/loadUrl';

export default class DesktopWindow extends TypedEventEmitter<{
  close: void;
  focus: void;
}> {
  public get isOpen(): boolean {
    return this.#window?.isVisible() ?? false;
  }

  public get isFocused(): boolean {
    return this.#window?.isFocused() ?? false;
  }

  public get webContents(): WebContents | undefined {
    return this.#window?.webContents;
  }

  #window?: BrowserWindow;
  #events = new EventSubscriber();

  #windowStateKeeper = new WindowStateKeeper('DesktopWindow');

  constructor(private apiManager: ApiManager) {
    super();
    void this.open(true);
  }

  public focus(): void {
    this.#window?.moveTop();
  }

  public async open(show = true): Promise<void> {
    if (this.#window) {
      if (show) {
        this.#window.setAlwaysOnTop(true);
        this.#window.show();
        this.#window.setAlwaysOnTop(false);
      }
      return;
    }
    this.#window = new BrowserWindow({
      show: false,
      acceptFirstMouse: true,
      useContentSize: true,
      titleBarStyle: 'hiddenInset',
      ...this.#windowStateKeeper.windowState,
      webPreferences: {
        preload: `${__dirname}/preload/desktop.js`,
      },
      icon: Path.resolve(app.getAppPath(), 'resources', 'icon.png'),
    });

    this.#windowStateKeeper.track(this.#window);
    this.#window.setTitle('Ulixee Desktop');

    this.#window.webContents.ipc.handle('desktop:api', async (e, { api, args }) => {
      if (api === 'Argon.dragAsFile') {
        return await this.apiManager.privateDesktopApiHandler.dragArgonsAsFile(args, e.sender);
      }
    });
    this.#window.webContents.ipc.on('getPrivateApiHost', e => {
      e.returnValue = this.apiManager.privateDesktopWsServerAddress;
    });

    this.#window.webContents.setWindowOpenHandler(details => {
      void shell.openExternal(details.url);
      return { action: 'deny' };
    });

    this.#events.on(this.#window.webContents, 'context-menu', (e, params) => {
      if (this.#window?.webContents) generateContextMenu(params, this.#window.webContents).popup();
    });
    this.#events.on(this.#window, 'focus', this.emit.bind(this, 'focus'));
    this.#events.on(this.#window, 'close', this.close.bind(this));

    await loadUrl(this.#window.webContents, 'desktop.html');

    if (show) {
      this.#window.show();
      this.#window.moveTop();
    }
  }

  public close(e, force = false): void {
    if (force) {
      this.#events.close();
      this.#window = undefined;
    } else {
      this.#window?.hide();
      e.preventDefault();
    }
    this.emit('close');
  }
}
