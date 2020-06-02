import { ipcRenderer } from "electron";
import { getOrCreateSOIEditorWindow } from "../render/windows";
import { openLinkExternal } from "../utils";
import { IpcEvents } from "../ipc-events";
// import { IpcEvents } from '../ipc-events';
// import { ipcMainManager } from './ipc';
export let soiEditorWindow: Electron.BrowserWindow | null = null;

function waitDomElement(selector, callback: any) {
  const btn = document.querySelector(selector);
  if (btn) {
    callback(btn);
  } else {
    setTimeout(() => {
      waitDomElement(selector, callback);
    }, 500);
  }
}
// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener("DOMContentLoaded", () => {
  openLinkExternal();

  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector);
    if (element) {
      element.innerText = text;
    }
  };

  for (const type of ["chrome", "node", "electron"]) {
    replaceText(`${type}-version`, (process.versions as any)[type]);
  }

  waitDomElement("#munew_default_soi_menu", (btn: any) => {
    btn.addEventListener("click", (event: any) => {
      event.preventDefault();
      event.stopPropagation();
      soiEditorWindow = getOrCreateSOIEditorWindow();
      soiEditorWindow.focus();
    });
  });
  waitDomElement("#munew_default_settings_menu", (btn: any) => {
    btn.addEventListener("click", (event: any) => {
      event.preventDefault();
      event.stopPropagation();
      ipcRenderer.send(IpcEvents.OPEN_SETTINGS, "settings");
    });
  });
});

window.addEventListener("syncEngineUIToMain", (event:any) => {
  let result = ipcRenderer.sendSync(IpcEvents.SYNC_ENGINE_UI_TO_MAIN, {
    subject: event.detail.subject,
    data: event.detail.data,
  });
  event.detail.callback(result);
});
