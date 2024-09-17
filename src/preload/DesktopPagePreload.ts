// @ts-ignore
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('appBridge', {
  async send<T>(api: string, args: any = {}): Promise<T> {
    try {
      const result = await ipcRenderer.invoke('desktop:api', { api, args });
      // eslint-disable-next-line no-console
      console.log(api, {
        args,
        result,
      });
      return result;
    } catch (error) {
      console.error('ERROR in api', { api, args, error });
      throw error;
    }
  },
  getPrivateApiHost(): string {
    return ipcRenderer.sendSync('getPrivateApiHost');
  },
});

document.addEventListener('desktop:api', (e: any) => {
  // eslint-disable-next-line no-console
  console.log('desktop:api', e);
  const message = e.detail;
  ipcRenderer.send('desktop:api', message.api, message.args);
});


// @ts-ignore
document.addEventListener('chromealive:event', (e: any) => {
  const message = e.detail;
  // eslint-disable-next-line no-console
  console.log(message.eventType, message.data);
});

const messagesById = new Map();
// @ts-ignore
document.addEventListener('chromealive:api', (e: any) => {
  const message = e.detail;
  messagesById.set(`${message.clientId}_${message.messageId}`, message);
});

// @ts-ignore
document.addEventListener('chromealive:api:response', (e: any) => {
  const message = e.detail;
  const key = `${message.clientId}_${message.responseId}`;
  const original = messagesById.get(key);
  messagesById.delete(key);
  // eslint-disable-next-line no-console
  console.log(original?.command, { args: original?.args?.[0], result: message.data });
});


// @ts-ignore
document.addEventListener('App:changeHeight', (e: any) => {
  const message = e.detail;
  // eslint-disable-next-line no-console
  console.debug('App:changeHeight', message.height);
  ipcRenderer.send('App:changeHeight', message.height);
});

// @ts-ignore
document.addEventListener('App:showChildWindow', (e: any) => {
  const message = e.detail;
  // eslint-disable-next-line no-console
  console.debug('App:showChildWindow', message.frameName);
  ipcRenderer.send('App:showChildWindow', message.frameName);
});

// @ts-ignore
document.addEventListener('App:hideChildWindow', (e: any) => {
  const message = e.detail;
  // eslint-disable-next-line no-console
  console.debug('App:hideChildWindow', message.frameName);
  ipcRenderer.send('App:hideChildWindow', message.frameName);
});
