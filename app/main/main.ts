import { app } from "electron";
import * as path from "path";
// const log = require('electron-log');
import * as logger from "electron-log";
const startSOIServer = require("../soi/src/server");
import { isDevMode } from "../utils/devmode";
import { setupAboutPanel } from "../utils/set-about-panel";
import { setupDevTools } from "./devtools";
import { setupDialogs } from "./dialogs";
import { onFirstRunMaybe } from "./first-run";
import { listenForProtocolHandler, setupProtocolHandler } from "./protocol";
import { shouldQuit } from "./squirrel";
import { setupUpdates } from "./update";
import { getOrCreateMainWindow } from "./windows";

/**
 * Handle the app's "ready" event. This is essentially
 * the method that takes care of booting the application.
 */
export async function onReady() {
  try {
    logger.info("onReady()");
    await onFirstRunMaybe();
    if (!isDevMode()) process.env.NODE_ENV = "production";

    //Default configuration for dia-engine
    // let diaEngineConfig = {
    //   TYPEORM_CONNECTION: "sqlite",
    //   TYPEORM_DATABASE: path.join(app.getPath('userData'), 'dia-engine.sql'),
    //   LOG_FILES_PATH: path.join(app.getPath('userData'), './log/dia-engine')
    // }

    // log.info(diaEngineConfig);
    // const {overwriteConfig} = require('../engine-ui/src/config');
    // overwriteConfig(diaEngineConfig);

    // Default configuration for **dia-engine**
    // TODO: move to preference
    process.env.TYPEORM_CONNECTION = "sqlite";
    process.env.TYPEORM_DATABASE = path.join(
      app.getPath("userData"),
      "dia-engine.sql"
    );
    process.env.LOG_FILES_PATH = path.join(
      app.getPath("userData"),
      "./log/dia-engine"
    );
    logger.info(
      "main->main.js->onReady, TYPEORM_DATABASE: ",
      process.env.TYPEORM_DATABASE
    );
    logger.info(
      "main->main.js->onReady, LOG_FILES_PATH: ",
      process.env.LOG_FILES_PATH
    );
    // start
    const startServer = require("../engine-ui/src/server").startServer;
    await startServer();
    logger.info("main->main.js->onReady, dia-engine successfully started.");
    await startSOIServer();
    logger.info("main->main.js->onReady, soi server successfully started.");
    let mainWindow = getOrCreateMainWindow();
    mainWindow.loadURL("http://localhost:9099");

    logger.info(
      "main->main.js->onReady, load http://localhost:9099 in main browser"
    );

    setupAboutPanel();

    const { setupMenu } = await import("./menu");

    setupMenu();
    setupProtocolHandler();
    // Auto update from github release
    setupUpdates();
    setupDialogs();
    setupDevTools();
  } catch (err) {
    logger.error('Error in onReady, error: ', err);
  }
}

/**
 * Handle the "before-quit" event
 *
 * @export
 */
export function onBeforeQuit() {
  (global as any).isQuitting = true;
}

/**
 * All windows have been closed, quit on anything but
 * macOS.
 */
export function onWindowsAllClosed() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
}

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

export function main() {
  logger.info("main");
  // Handle creating/removing shortcuts on Windows when
  // installing/uninstalling.
  if (shouldQuit()) {
    app.quit();
    return;
  }

  // Set the app's name
  app.name = "Munew DIA";

  // Ensure that there's only ever one Fiddle running
  listenForProtocolHandler();

  // Launch
  app.on("ready", onReady);
  app.on("before-quit", onBeforeQuit);
  app.on("window-all-closed", onWindowsAllClosed);
  app.on("activate", getOrCreateMainWindow);
}

main();