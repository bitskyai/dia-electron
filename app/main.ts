import { app, BrowserWindow } from "electron";
import * as path from "path";
const log = require('electron-log');
const startSOIServer = require('./soi/src/server');

let mainWindow: Electron.BrowserWindow;

async function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    minWidth: 800,
    minHeight: 400,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    width: 1024,
  });

  //Default configuration for dia-engine
  let diaEngineConfig = {
    TYPEORM_CONNECTION: "sqlite",
    TYPEORM_DATABASE: path.join(app.getPath('userData'), 'dia-engine.sql'),
    LOG_FILES_PATH: path.join(app.getPath('userData'), './log/dia-engine')
  }

  log.info(diaEngineConfig);
  const {overwriteConfig} = require('./engine-ui/src/config');
  overwriteConfig(diaEngineConfig);
  // start 
  const startServer = require('./engine-ui/src/server').startServer;
  await startServer(diaEngineConfig);
  await startSOIServer();
  mainWindow.loadURL('http://localhost:9099');


  // window.open('./soi.html', '_blank', 'nodeIntegration=no')

  // and load the index.html of the app.
  // mainWindow.loadFile(path.join(__dirname, "../index.html"));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it"s common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.