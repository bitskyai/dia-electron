import { ipcRenderer } from "electron";
import { getOrCreateSOIEditorWindow } from "../render/windows";
import { openLinkExternal } from "../utils";
import { IpcEvents, BROWSER_WINDOW_EVENTS } from "../ipc-events";
// import { IpcEvents } from '../ipc-events';
// import { ipcMainManager } from './ipc';
export let soiEditorWindow: Electron.BrowserWindow | null = null;

// indicate currently is in electron browser window
window.__electron__ = true;

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

window.addEventListener("syncEngineUIToMain", (event: any) => {
  let result = ipcRenderer.sendSync(IpcEvents.SYNC_ENGINE_UI_TO_MAIN, {
    subject: event.detail.subject,
    data: event.detail.data,
  });
  event.detail.callback(result);
});

ipcRenderer.on(IpcEvents.MESSAGE_TO_ENGINE_UI, (e, payload) => {
  console.log("MESSAGE_TO_ENGINE_UI->event: ", e);
  console.log("MESSAGE_TO_ENGINE_UI->payload: ", payload);
  const subject = payload.subject;
  delete payload.subject;
  const event = new CustomEvent(subject, {
    detail: payload,
  });
  window.dispatchEvent(event);
});
