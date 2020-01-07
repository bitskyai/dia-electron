import { getOrCreateSOIEditorWindow } from "../render/windows";
import { openLinkExternal } from "../utils";

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

  waitDefaultSOIMenu((btn: any) => {
    btn.addEventListener("click", (event: any) => {
      event.preventDefault();
      event.stopPropagation();
      soiEditorWindow = getOrCreateSOIEditorWindow();
      soiEditorWindow.focus();
    });
  });
});
