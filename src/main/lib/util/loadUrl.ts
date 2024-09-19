import { WebContents, app } from 'electron';
import Path from 'path';

export function isDev(): boolean {
  return !app.isPackaged;
}

export default async function loadUrl(webContents: WebContents, path: string): Promise<void> {
  if (isDev() && process.env['VITE_DEV_SERVER_URL']) {
    await webContents.loadURL(`${process.env['VITE_DEV_SERVER_URL']}/ui/${path}`);
  } else {
    await webContents.loadFile(Path.join(app.getAppPath(), `ui/${path}`));
  }
}

export function getUrl(path: string): string {
  if (isDev() && process.env['VITE_DEV_SERVER_URL']) {
    return `${process.env['VITE_DEV_SERVER_URL']}/ui/${path}`;
  } else {
    return Path.join(`./ui/${path}`);
  }
}
