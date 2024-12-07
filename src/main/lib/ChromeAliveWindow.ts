import EventSubscriber from '@ulixee/commons/lib/EventSubscriber';
import Queue from '@ulixee/commons/lib/Queue';
import { bindFunctions } from '@ulixee/commons/lib/utils';
import { IChromeAliveSessionApis } from '@ulixee/desktop-interfaces/apis';
import IChromeAliveSessionEvents from '@ulixee/desktop-interfaces/events/IChromeAliveSessionEvents';
import ISessionAppModeEvent from '@ulixee/desktop-interfaces/events/ISessionAppModeEvent';
import HeroCore from '@ulixee/hero-core';
import { app, BrowserWindow, MenuItem, screen, shell } from 'electron';
import * as Path from 'path';
import moment from 'moment';
import generateContextMenu from '../menus/generateContextMenu';
import ApiClient from './ApiClient';
import View from './View';
import loadUrl from './util/loadUrl';
import BrowserView = Electron.BrowserView;

// make electron packaging friendly
const extensionPath = Path.resolve(__dirname, '../ui').replace('app.asar', 'app.asar.unpacked');
interface IReplayTab {
  view: View;
  heroTabId: number;
  targetId: string;
  browserContextId: string;
  chromeTabId: number;
}

export default class ChromeAliveWindow {
  private static pages = {
    Input: '/screen-input.html',
    Output: '/screen-output.html',
    Reliability: '/screen-reliability.html',
  } as const;

  window: BrowserWindow;
  api?: ApiClient<IChromeAliveSessionApis, IChromeAliveSessionEvents>;
  enableDevtoolsOnDevtools = process.env.DEVTOOLS ?? false;

  private get activeReplayTab(): IReplayTab {
    return this.#replayTabs[this.#activeTabIdx];
  }

  #childWindowsByName = new Map<string, BrowserWindow>();
  #toolbarView: View;
  #toolbarHeight = 44;
  #activeTabIdx = 0;
  #replayTabs: IReplayTab[] = [];
  #mainView: View;
  #showingPopupName?: string;
  #hasShown = false;
  #addTabQueue = new Queue('TAB CREATOR', 1);

  #eventSubscriber = new EventSubscriber();

  constructor(
    public readonly session: {
      heroSessionId: string;
      dbPath: string;
    },
    public cloudAddress: string,
    public apiConnectionId: string,
  ) {
    bindFunctions(this);
    this.createApi(cloudAddress);
    const currentWindow = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]; // Get the currently focused window
    const windowBounds = currentWindow.getBounds();
    const display = screen.getDisplayNearestPoint({ x: windowBounds.x, y: windowBounds.y });
    const workarea = display.bounds;

    this.window = new BrowserWindow({
      show: false,
      acceptFirstMouse: true,
      titleBarStyle: 'hiddenInset',
      icon: Path.resolve(app.getAppPath(), 'resources', 'icon.png'),
      width: workarea.width,
      height: workarea.height,
      y: workarea.y,
      x: workarea.x,
    });

    this.window.title = `${this.session.heroSessionId}`;
    this.#eventSubscriber.on(this.window, 'resize', this.relayout);
    this.#eventSubscriber.on(this.window, 'maximize', this.relayout);
    this.#eventSubscriber.on(this.window, 'restore', this.relayout);
    this.#eventSubscriber.on(this.window, 'unmaximize', this.relayout);
    this.#eventSubscriber.on(this.window, 'close', this.onClose);
    this.#eventSubscriber.on(this.window, 'blur', () => {
      const finderMenu = this.#childWindowsByName.get('MenuFinder');
      if (finderMenu) {
        finderMenu.setAlwaysOnTop(false);
        finderMenu.moveAbove(this.window.getMediaSourceId());
      }
    });
    this.#eventSubscriber.on(this.window, 'focus', () => {
      this.#childWindowsByName.get('MenuFinder')?.setAlwaysOnTop(true);
    });

    this.#mainView = new View(this.window, {
      preload: `${__dirname}/preload/chromealive.js`,
    });
    this.#mainView.attach();
    this.#mainView.hide();
    this.#eventSubscriber.on(this.#mainView.webContents!, 'focus', this.closeOpenPopup);

    this.#toolbarView = new View(this.window, {
      preload: `${__dirname}/preload/chromealive.js`,
    });
    this.#toolbarView.attach();
    // for child windows
    this.#toolbarView.webContents!.setWindowOpenHandler(details => {
      const isMenu = details.frameName.includes('Menu');
      const canMoveAndResize = !isMenu || details.frameName.startsWith('MenuFinder');

      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          resizable: canMoveAndResize,
          frame: !isMenu,
          roundedCorners: true,
          movable: canMoveAndResize,
          closable: true,
          transparent: isMenu,
          titleBarStyle: 'default',
          alwaysOnTop: details.frameName.startsWith('MenuFinder'),
          hasShadow: !isMenu,
          details,
          acceptFirstMouse: true,
          useContentSize: true,
          webPreferences: {
            preload: `${__dirname}/preload/menubar.js`,
          },
        },
      };
    });

    const toolbarWc = this.#toolbarView.webContents!;
    this.#eventSubscriber.on(toolbarWc, 'did-create-window', (childWindow, details) => {
      childWindow.moveAbove(this.window.getMediaSourceId());
      this.trackChildWindow(childWindow, details);
    });

    if (process.env.DEVTOOLS) {
      toolbarWc.openDevTools({ mode: 'detach' });
    }
    this.#eventSubscriber.on(toolbarWc, 'ipc-message', (e, eventName, ...args) => {
      if (eventName === 'App:changeHeight') {
        this.#toolbarHeight = args[0];
        void this.relayout();
      } else if (eventName === 'App:showChildWindow') {
        const frameName = args[0];
        const window = this.#childWindowsByName.get(frameName);
        window?.show();
        window?.focusOnWebView();
      } else if (eventName === 'App:hideChildWindow') {
        this.#childWindowsByName.get(args[0])?.close();
      }
    });
  }

  replayControl(direction: 'back' | 'forward'): void {
    void this.api?.send('Session.timetravel', {
      step: direction,
    });
  }

  async load(): Promise<void> {
    await this.api?.connect();
    await this.addReplayTab();
    await this.relayout();
    if (!this.#toolbarView?.webContents) return;
    await loadUrl(this.#toolbarView.webContents, 'toolbar.html');
    await this.#toolbarView.webContents.executeJavaScript(`
        const elem = document.querySelector('body > #app');
        const resizeObserver = new ResizeObserver(() => {
          document.dispatchEvent(
            new CustomEvent('App:changeHeight', {
              detail: {
                height:elem.getBoundingClientRect().height,
              },
            }),
          );
        });
        resizeObserver.observe(elem);
      `);

    if (this.#toolbarView.browserView) await this.injectCloudAddress(this.#toolbarView.browserView);
  }

  public async onClose(): Promise<void> {
    for (const win of this.#childWindowsByName.values()) {
      if (win.webContents?.isDevToolsOpened()) win.webContents.closeDevTools();
      win.close();
    }
    if (this.#toolbarView.webContents?.isDevToolsOpened()) {
      this.#toolbarView.webContents.closeDevTools();
    }
    this.#toolbarView.webContents?.close();
    for (const tab of this.#replayTabs) {
      tab.view.webContents?.close();
    }
    this.#childWindowsByName.clear();
    this.#eventSubscriber.close();
    await this.api?.send('Session.close');
    await this.api?.disconnect();
  }

  public async reconnect(address: string): Promise<void> {
    if (this.api?.address.includes(address)) return;
    if (this.api?.isConnected) {
      await this.api.disconnect();
    }
    this.createApi(address);
    if (!this.api) return;

    await this.api.connect();
    for (const tab of this.#replayTabs) {
      const webContents = tab.view.webContents;

      await this.api.send('Session.replayTargetCreated', {
        browserContextId: tab.browserContextId,
        targetId: tab.targetId,
        chromeTabId: tab.chromeTabId,
        heroTabId: tab.heroTabId,
        isReconnect: true,
      });
      const devtoolsWc = webContents?.devToolsWebContents;
      if (devtoolsWc) {
        const { targetId, browserContextId } = await View.getTargetInfo(devtoolsWc);

        await this.api.send('Session.devtoolsTargetOpened', {
          isReconnect: true,
          targetId,
          browserContextId,
        });
      }
    }
    if (this.#toolbarView.browserView && this.#mainView.browserView) {
      await Promise.all([
        this.injectCloudAddress(this.#toolbarView.browserView),
        this.injectCloudAddress(this.#mainView.browserView),
      ]);
    }
  }

  // NOTE: 1 is the default hero tab id for an incognito context. DOES NOT WORK in default context
  private async addReplayTab(heroTabId = 1): Promise<void> {
    await this.#addTabQueue.run(async () => {
      if (this.#replayTabs.some(x => x.heroTabId === heroTabId)) return;
      const view = new View(this.window);
      view.browserView?.setAutoResize({ width: true, height: true });
      view.attach();
      if (!view.webContents) throw new Error('No web contents on view');

      await view.webContents.session.loadExtension(extensionPath, {
        allowFileAccess: false,
      });
      view.webContents.on('focus', () => {
        if (!this.#showingPopupName?.startsWith('MenuFinder')) this.closeOpenPopup();
      });

      if (this.enableDevtoolsOnDevtools) await this.addDevtoolsOnDevtools(view);
      this.#eventSubscriber.on(view.webContents, 'devtools-opened', async () => {
        const address = this.api?.address;
        if (address) {
          await view.webContents?.executeJavaScript(`window.cloudAddress = '${address}'`);
        }

        const devtoolsWc = view.webContents?.devToolsWebContents;
        if (!devtoolsWc) {
          console.warn('No web contents on showing devtools');
          return;
        }

        void devtoolsWc.executeJavaScript(
          `(async () => {
            while (typeof UI?.panels?.elements?.parentWidgetInternal === 'undefined') {
              await new Promise(resolve => setTimeout(resolve, 100));
            }

            const tabbedPane = UI.panels.elements.parentWidgetInternal.parentWidgetInternal;
            tabbedPane.closeTabs(['timeline', 'heap_profiler','heap-profiler', 'lighthouse', 'chrome_recorder', 'chrome-recorder', 'security', 'memory', 'resources', 'network', 'sources']);

            for (let i =0; i < 50; i+=1) {
               const tab = tabbedPane.tabs.find(x => x.titleInternal === 'Hero Script');
               if (tab) {
                 tabbedPane.insertBefore(tab, 0);
                 tabbedPane.selectTab(tab.id);
                 break;
               }
               await new Promise(resolve => setTimeout(resolve, i * 10));
               await new Promise(requestAnimationFrame);
            }
          })()`,
        );
        // give the devtools a chance to load
        await new Promise(setImmediate);
        const target = await View.getTargetInfo(devtoolsWc);
        await this.api?.send('Session.devtoolsTargetOpened', target);
      });
      view.webContents.on('context-menu', (ev, params) => {
        if (!view.webContents) return;
        const menu = generateContextMenu(params, view.webContents);
        menu.append(
          new MenuItem({
            label: 'Generate Selector',
            click: () => {
              view.webContents?.inspectElement(params.x, params.y);
              void this.api?.send('Session.openMode', {
                mode: 'Finder',
                position: { x: params.x, y: params.y },
                trigger: 'contextMenu',
              });
            },
          }),
        );
        menu.popup();
      });

      await view.webContents.loadURL('about:blank');
      view.webContents.openDevTools({ mode: 'bottom' });

      const { targetId, browserContextId } = await View.getTargetInfo(view.webContents);
      const chromeTabId = view.webContents.id;
      this.#replayTabs.push({ view, targetId, heroTabId, browserContextId, chromeTabId });
      await this.api?.send('Session.replayTargetCreated', {
        targetId,
        browserContextId,
        heroTabId,
        chromeTabId,
      });
    });
  }

  private createApi(baseHost: string): void {
    const address = new URL(`/chromealive/${this.session.heroSessionId}`, baseHost);
    if (!this.session.dbPath.includes(HeroCore.dataDir)) {
      address.searchParams.set('path', this.session.dbPath);
    }
    address.searchParams.set('id', this.apiConnectionId);
    this.api = new ApiClient(address.href, this.onChromeAliveEvent);
    // eslint-disable-next-line no-console
    console.log('Window connected to %s', this.api.address);
    this.#eventSubscriber.once(this.api, 'close', this.onApiClose);
  }

  private async injectCloudAddress(view: BrowserView): Promise<void> {
    const address = this.api?.address;
    if (!address) return;
    await view.webContents?.executeJavaScript(
      `(() => {
        window.cloudAddress = '${address}';
        if ('setCloudAddress' in window) window.setCloudAddress(window.cloudAddress);
      })()`,
    );
  }

  private onApiClose(): void {
    if (!this.api) return;
    this.#eventSubscriber.off({ emitter: this.api, eventName: 'close', handler: this.onApiClose });
    this.api = undefined;
  }

  private async addDevtoolsOnDevtools(view: View): Promise<void> {
    const devtoolsOnDevtoolsWindow = new BrowserWindow({
      show: false,
    });
    await devtoolsOnDevtoolsWindow.webContents.session.loadExtension(extensionPath, {
      allowFileAccess: true,
    });
    devtoolsOnDevtoolsWindow.show();
    view.webContents?.setDevToolsWebContents(devtoolsOnDevtoolsWindow.webContents);
    devtoolsOnDevtoolsWindow.webContents.openDevTools({ mode: 'undocked' });
  }

  private async activateView(mode: ISessionAppModeEvent['mode']): Promise<void> {
    let needsLayout = false;

    if (mode === 'Live' || mode === 'Timetravel' || mode === 'Finder') {
      if (this.activeReplayTab) {
        needsLayout = this.activeReplayTab.view.isHidden;
        this.activeReplayTab.view.isHidden = false;
        this.activeReplayTab.view.bringToFront();
      }
      this.#mainView.hide();
    } else {
      needsLayout = this.#mainView.isHidden;
      this.activeReplayTab?.view.hide();
      this.#mainView.bringToFront();
      this.#mainView.isHidden = false;
      const page = ChromeAliveWindow.pages[mode];
      if (page) {
        const webContents = this.#mainView.webContents;
        if (webContents && !webContents.getURL().includes(page)) {
          await loadUrl(webContents, page);

          if (this.#mainView.browserView) await this.injectCloudAddress(this.#mainView.browserView);

          if (mode === 'Output') {
            webContents.openDevTools({ mode: 'bottom' });
            this.#eventSubscriber.on(webContents, 'devtools-opened', () => {
              const devtoolsWc = this.#mainView.webContents?.devToolsWebContents;
              void devtoolsWc
                ?.executeJavaScript(
                  `(async () => {
                  while (!UI.panels.elements.parentWidgetInternal) await new Promise(requestAnimationFrame);
         UI.panels.elements.parentWidgetInternal.parentWidgetInternal.closeTabs(['timeline', 'heap_profiler', 'chrome_recorder', 'lighthouse', 'security', 'resources', 'network', 'sources', 'elements']);
      })()`,
                )
                .catch(() => null);
            });
          }
        }
      }
    }
    if (needsLayout) await this.relayout();
  }

  private async relayout(): Promise<void> {
    const { width, height } = this.window.getContentBounds();

    this.#toolbarView.setBounds({ height: this.#toolbarHeight, x: 0, y: 0, width });

    const heightoffset = this.#toolbarHeight;

    const remainingBounds = {
      x: 0,
      y: heightoffset + 1,
      width,
      height: height - heightoffset,
    };
    if (!this.#mainView.isHidden) this.#mainView.setBounds(remainingBounds);
    if (!this.activeReplayTab?.view?.isHidden) this.activeReplayTab.view.setBounds(remainingBounds);
  }

  private closeOpenPopup(): void {
    try {
      if (this.#showingPopupName) {
        this.#childWindowsByName.get(this.#showingPopupName)?.close();
        this.#childWindowsByName.delete(this.#showingPopupName);
      }
    } catch {}
    this.#showingPopupName = undefined;
  }

  private onChromeAliveEvent<T extends keyof IChromeAliveSessionEvents>(
    eventType: T,
    data: IChromeAliveSessionEvents[T],
  ): void {
    if (eventType === 'Session.updated') {
      const session = data as IChromeAliveSessionEvents['Session.updated'];
      let scriptEntrypoint = session.scriptEntrypoint;
      const divider = scriptEntrypoint.includes('/') ? '/' : '\\';
      scriptEntrypoint = scriptEntrypoint.split(divider).slice(-2).join(divider);
      const title = `${scriptEntrypoint} (${moment(session.startTime).format(
        'MMM D [at] h:mm a',
      )})`;
      if (this.window.title !== title) {
        this.window.setTitle(title);
        void this.#toolbarView.webContents?.executeJavaScript(`document.title="${title}"`);
      }
    }

    if (eventType === 'Session.loaded' && !this.#hasShown) {
      this.window.show();
      this.#hasShown = true;
    }

    if (eventType === 'DevtoolsBackdoor.toggleInspectElementMode') {
      this.activeReplayTab.view.webContents?.focus();
    }

    if (eventType === 'Session.tabCreated') {
      const createdTab = data as IChromeAliveSessionEvents['Session.tabCreated'];
      void this.addReplayTab(createdTab.tabId);
    }

    if (eventType === 'Session.appMode') {
      const mode = (data as IChromeAliveSessionEvents['Session.appMode']).mode;
      const isFinderPopup = this.#showingPopupName?.startsWith('MenuFinder') && mode === 'Finder';
      if (!isFinderPopup) this.closeOpenPopup();
      void this.activateView(mode);
    }
  }

  private trackChildWindow(childWindow: BrowserWindow, details: { frameName: string }): void {
    const { frameName } = details;
    if (this.#childWindowsByName.has(frameName)) {
      throw new Error(`Child window with the same frameName already exists: ${frameName}`);
    }

    this.#childWindowsByName.set(frameName, childWindow);
    const onIpcMessage = this.#eventSubscriber.on(
      childWindow.webContents,
      'ipc-message',
      (e, eventName, ...args) => {
        if (eventName === 'chromealive:api') {
          const [command, apiArgs] = args;
          if (command === 'File:navigate') {
            const { filepath } = apiArgs;
            shell.showItemInFolder(filepath);
          }
        } else if (eventName === 'App:changeHeight') {
          childWindow.setBounds({
            height: Math.round(args[0]),
          });
        }
      },
    );

    const onshow = this.#eventSubscriber.on(childWindow, 'show', () => {
      if (this.#showingPopupName === frameName) return;
      this.closeOpenPopup();
      this.#showingPopupName = frameName;
    });
    let hasHandled = false;
    childWindow.once('close', async e => {
      this.#eventSubscriber.off(onshow, onIpcMessage);
      if (this.#showingPopupName === frameName) this.#showingPopupName = undefined;
      const popup = this.#childWindowsByName.get(frameName);
      this.#childWindowsByName.delete(frameName);
      if (!hasHandled && popup) {
        hasHandled = true;
        e.preventDefault();
        await popup?.webContents.executeJavaScript(
          'window.dispatchEvent(new CustomEvent("manual-close"))',
        );
        try {
          popup?.close();
        } catch {}
      }
    });
  }
}
