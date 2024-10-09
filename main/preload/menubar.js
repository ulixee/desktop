"use strict";
const { ipcRenderer } = require("electron");
document.addEventListener("desktop:api", (e) => {
  console.log("desktop:api", e);
  const message = e.detail;
  ipcRenderer.send("desktop:api", message.api, message.args);
});
