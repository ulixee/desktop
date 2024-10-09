import { BrowserView } from 'electron';
import generateContextMenu from '../menus/generateContextMenu';
import BrowserWindow = Electron.BrowserWindow;
import Rectangle = Electron.Rectangle;
import WebContents = Electron.WebContents;

export default class View {
  public isHidden: boolean = false;
  public bounds?: Rectangle;
  public browserView?: BrowserView;

  public get webContents(): WebContents | undefined {
    return this.browserView?.webContents;
  }

  protected isAttached = false;
  protected readonly window: BrowserWindow;

  constructor(window: BrowserWindow, webPreferences: Electron.WebPreferences = {}) {
    this.window = window;
    this.browserView = new BrowserView({
      webPreferences: {
        sandbox: false,
        ...webPreferences,
      },
    });
  }

  public addContextMenu(): void {
    const { webContents } = this;
    if (!webContents) return;
    webContents.on('context-menu', (e, params) => {
      generateContextMenu(params, webContents).popup();
    });
  }

  public attach(): void {
    if (!this.isAttached) {
      if (this.browserView) this.window.addBrowserView(this.browserView);
      this.isAttached = true;
    }
  }

  public bringToFront(): void {
    this.attach();
    if (this.browserView) this.window.setTopBrowserView(this.browserView);
  }

  public detach(): void {
    if (this.browserView) this.window.removeBrowserView(this.browserView);
    this.isAttached = false;
  }

  public destroy(): void {
    this.detach();
    this.browserView = undefined;
  }

  public hide(): void {
    const { x, y } = this.bounds ?? { x: 0, y: 0 };
    this.setBounds({ x, y, width: 0, height: 0 });
  }

  public async getContentsHeight(): Promise<number> {
    if (!this.webContents) return 0;
    return await this.webContents.executeJavaScript(
      `document.querySelector('body > #app').offsetHeight`,
    );
  }

  public setBounds(newBounds: Rectangle): void {
    if (
      this.bounds &&
      this.bounds.x === newBounds.x &&
      this.bounds.y === newBounds.y &&
      this.bounds.width === newBounds.width &&
      this.bounds.height === newBounds.height
    ) {
      return;
    }
    this.browserView?.setBounds(newBounds);
    this.bounds = newBounds;
    this.isHidden = newBounds.width === 0 && newBounds.height === 0;
  }

  public static async getTargetInfo(wc: WebContents): Promise<{
    targetId: string;
    browserContextId: string;
    url: string;
  }> {
    wc.debugger.attach();
    const { targetInfo } = await wc.debugger.sendCommand('Target.getTargetInfo');
    wc.debugger.detach();
    return targetInfo;
  }
}
