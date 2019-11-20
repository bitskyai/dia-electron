const { BrowserWindow } = require("electron").remote;
import * as path from "path";

function waitDefaultSOIMenu(callback) {
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

  waitDefaultSOIMenu(btn => {
    btn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      const modalPath = path.join("file://", __dirname, "./soi.html");
      let win = new BrowserWindow({ width: 400, height: 320 });

      win.on("close", () => {
        win = null;
      });
      win.loadURL(modalPath);
      win.show();
    });
  });
});
