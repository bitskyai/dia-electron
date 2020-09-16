import { ipcRenderer } from "electron";
import { openLinkExternal } from "../utils";
import { IpcEvents } from "../ipc-events";
// import { IpcEvents } from '../ipc-events';
// import { ipcMainManager } from './ipc';

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

//   waitDomElement("#bitsky_default_retailer_menu", (btn: any) => {
//     btn.addEventListener("click", (event: any) => {
//       event.preventDefault();
//       event.stopPropagation();
//       ipcRenderer.send(IpcEvents.OPEN_RETAILER_EDITOR, "retailerEditor");
//     });
//   });
//   waitDomElement("#bitsky_default_settings_menu", (btn: any) => {
//     btn.addEventListener("click", (event: any) => {
//       event.preventDefault();
//       event.stopPropagation();
//       ipcRenderer.send(IpcEvents.OPEN_SETTINGS, "settings");
//     });
//   });
});

window.addEventListener("syncSupplierUIToMain", (event: any) => {
  let result = ipcRenderer.sendSync(IpcEvents.SYNC_SUPPLIER_UI_TO_MAIN, {
    subject: event.detail.subject,
    data: event.detail.data,
  });
  event.detail.callback(result);
});

ipcRenderer.on(IpcEvents.MESSAGE_TO_SUPPLIER_UI, (e, payload) => {
  console.log("MESSAGE_TO_SUPPLIER_UI->event: ", e);
  console.log("MESSAGE_TO_SUPPLIER_UI->payload: ", payload);
  const subject = payload.subject;
  delete payload.subject;
  const event = new CustomEvent(subject, {
    detail: payload,
  });
  window.dispatchEvent(event);
});
