"use strict";
const { ipcRenderer } = require("electron");
document.addEventListener("chromealive:event", (e) => {
  const message = e.detail;
  console.debug(message.eventType, message.data);
});
const caMessagesById = /* @__PURE__ */ new Map();
document.addEventListener("chromealive:api", (e) => {
  const message = e.detail;
  caMessagesById.set(`${message.clientId}_${message.messageId}`, message);
  ipcRenderer.send("chromealive:api", message.command, message.args);
});
document.addEventListener("chromealive:api:response", (e) => {
  var _a;
  const message = e.detail;
  const key = `${message.clientId}_${message.responseId}`;
  const original = caMessagesById.get(key);
  caMessagesById.delete(key);
  console.debug(original == null ? void 0 : original.command, { args: (_a = original == null ? void 0 : original.args) == null ? void 0 : _a[0], result: message.data });
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
