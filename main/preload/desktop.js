"use strict";
const { contextBridge, ipcRenderer, webUtils } = require("electron");
contextBridge.exposeInMainWorld("appBridge", {
  async send(api, args = {}) {
    try {
      const result = await ipcRenderer.invoke("desktop:api", { api, args });
      console.log(api, {
        args,
        result
      });
      return result;
    } catch (error) {
      console.error("ERROR in api", { api, args, error });
      throw error;
    }
  },
  getPrivateApiHost() {
    return ipcRenderer.sendSync("getPrivateApiHost");
  },
  getFilePath(file) {
    return webUtils.getPathForFile(file);
  }
});
document.addEventListener("desktop:api", (e) => {
  console.log("desktop:api", e);
  const message = e.detail;
  ipcRenderer.send("desktop:api", message.api, message.args);
});
document.addEventListener("chromealive:event", (e) => {
  const message = e.detail;
  console.log(message.eventType, message.data);
});
const messagesById = /* @__PURE__ */ new Map();
document.addEventListener("chromealive:api", (e) => {
  const message = e.detail;
  messagesById.set(`${message.clientId}_${message.messageId}`, message);
});
document.addEventListener("chromealive:api:response", (e) => {
  var _a;
  const message = e.detail;
  const key = `${message.clientId}_${message.responseId}`;
  const original = messagesById.get(key);
  messagesById.delete(key);
  console.log(original == null ? void 0 : original.command, { args: (_a = original == null ? void 0 : original.args) == null ? void 0 : _a[0], result: message.data });
});
document.addEventListener("App:changeHeight", (e) => {
  const message = e.detail;
  console.debug("App:changeHeight", message.height);
  ipcRenderer.send("App:changeHeight", message.height);
});
document.addEventListener("App:showChildWindow", (e) => {
  const message = e.detail;
  console.debug("App:showChildWindow", message.frameName);
  ipcRenderer.send("App:showChildWindow", message.frameName);
});
document.addEventListener("App:hideChildWindow", (e) => {
  const message = e.detail;
  console.debug("App:hideChildWindow", message.frameName);
  ipcRenderer.send("App:hideChildWindow", message.frameName);
});
