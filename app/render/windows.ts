import { remote } from "electron";
const { BrowserWindow, shell, getGlobal } = remote;
import * as path from "path";

interface browserWindowHash {
  [key: string]: Electron.BrowserWindow | null;
}

// Keep a global reference of the window objects, if we don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
export const browserWindows: browserWindowHash = {};

export function getSOIEditorWindowOptions(): Electron.BrowserWindowConstructorOptions {
  return {
    width: 1200,
    height: 900,
    minHeight: 600,
    minWidth: 600,
    acceptFirstMouse: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      webviewTag: false,
      nodeIntegration: true
    }
  };
}

export function createSOIEditorWindow(): Electron.BrowserWindow {
  // console.log("createSOIEditorWindow->remote: ", remote);
  const browserWindow = new BrowserWindow(getSOIEditorWindowOptions());
  browserWindow.webContents.once("dom-ready", () => {
    browserWindow.show();
  });

  browserWindow.on("closed", () => {
    browserWindows.soiEditor = null;
    getGlobal('browserWindows').soiEditor = null;
  });

  browserWindow.webContents.on("new-window", (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  browserWindow.webContents.on("will-navigate", (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  browserWindows.soiEditor = browserWindow;
  const modalPath = path.join("./build/soi.html");
  browserWindow.loadFile(modalPath);
  browserWindow.show();
  // browserWindow.webContents.openDevTools();

  getGlobal('browserWindows').soiEditor = browserWindow;
  return browserWindow;
}

export function getOrCreateSOIEditorWindow(): Electron.BrowserWindow {
  if(getGlobal('browserWindows').soiEditor&&getGlobal('browserWindows').soiEditor.focus){
    return getGlobal('browserWindows').soiEditor;
  }
  return  createSOIEditorWindow();
  // return getGlobal('browserWindows').soiEditor || createSOIEditorWindow();
}
