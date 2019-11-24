const { BrowserWindow } = require("electron").remote;
import * as path from "path";

export let soiEditorWindow: Electron.BrowserWindow | null = null;

function waitDefaultSOIMenu(callback: any) {
  const btn = document.querySelector("#munew_default_soi_menu");
  if (btn) {
    callback(btn);
  } else {
    setTimeout(() => {
      waitDefaultSOIMenu(callback);
    }, 500);
  }
}
// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener("DOMContentLoaded", () => {
  const replaceText = (selector: string, text: string) => {
    const element = document.getElementById(selector);
    if (element) {
      element.innerText = text;
    }
  };

  for (const type of ["chrome", "node", "electron"]) {
    replaceText(`${type}-version`, (process.versions as any)[type]);
  }

  waitDefaultSOIMenu((btn: any) => {
    btn.addEventListener("click", (event: any) => {
      event.preventDefault();
      event.stopPropagation();
      if (soiEditorWindow) {
        soiEditorWindow.focus();
      } else {
        const modalPath = path.join("./build/soi.html");
        soiEditorWindow = new BrowserWindow({
          width: 1200,
          height: 900,
          minHeight: 600,
          minWidth: 600,
          // titleBarStyle: process.platform === 'darwin' ? 'hidden' : undefined,
          acceptFirstMouse: true,
          // backgroundColor: '#1d2427',
          webPreferences: {
            webviewTag: false,
            nodeIntegration: true
          }
        });

        soiEditorWindow.on("close", () => {
          soiEditorWindow = null;
        });
        soiEditorWindow.loadFile(modalPath);
        soiEditorWindow.show();
        soiEditorWindow.webContents.openDevTools();
      }
    });
  });
});
