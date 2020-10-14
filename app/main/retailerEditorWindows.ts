// import { remote } from "electron";
// const { BrowserWindow, shell, getGlobal } = remote;
import { BrowserWindow, shell } from "electron";
import * as path from "path";

interface browserWindowHash {
  [key: string]: Electron.BrowserWindow | null;
}

// Keep a global reference of the window objects, if we don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
export const browserWindows: browserWindowHash = {};

export function getRetailerEditorWindowOptions(): Electron.BrowserWindowConstructorOptions {
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

export function createRetailerEditorWindow(): Electron.BrowserWindow {
  // console.log("createRetailerEditorWindow->remote: ", remote);
  const browserWindow = new BrowserWindow(getRetailerEditorWindowOptions());
  browserWindow.webContents.once("dom-ready", () => {
    browserWindow.show();
  });

  browserWindow.on("closed", () => {
    browserWindows.retailerEditor = null;
    global.browserWindows.retailerEditor = null;
  });

  browserWindow.webContents.on("new-window", (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  browserWindow.webContents.on("will-navigate", (event, url) => {
    event.preventDefault();
    shell.openExternal(url);
  });

  browserWindows.retailerEditor = browserWindow;
  const modalPath = path.join("./build/retailer.html");
  browserWindow.loadFile(modalPath);
  browserWindow.show();
  // browserWindow.webContents.openDevTools();

  global.browserWindows.retailerEditor = browserWindow;
  return browserWindow;
}

export function getOrCreateRetailerEditorWindow(): Electron.BrowserWindow {
  if(global.browserWindows.retailerEditor&&global.browserWindows.retailerEditor.focus){
    return global.browserWindows.retailerEditor;
  }
  return  createRetailerEditorWindow();
  // return global.browserWindows.retailerEditor || createRetailerEditorWindow();
}
