import { WebContents } from 'electron';
import { is } from '@electron-toolkit/utils';
import Path from 'path';

export default async function loadUrl(webContents: WebContents, path: string): Promise<void> {
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    await webContents.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/${path}`);
  } else {
    await webContents.loadFile(Path.join(__dirname, `../renderer/${path}`));
  }
}
