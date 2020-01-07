import { app } from "electron";
import { isDevMode } from "../utils/devmode";
import { setupAboutPanel } from "../utils/set-about-panel";
import { setupDevTools } from "./devtools";
import { setupDialogs } from "./dialogs";
import { setUpEventListeners } from './events';
import { onFirstRunMaybe } from "./first-run";
import { setupMenu } from './menu';
import { listenForProtocolHandler, setupProtocolHandler } from "./protocol";
import { shouldQuit } from "./squirrel";
import { setupUpdates } from "./update";
import { getOrCreateMainWindow } from "./windows";
import logger from "../utils/logger";
import engine from '../utils/engine';
import SOIManager from '../utils/soi-manager';

/**
 * Handle the app's "ready" event. This is essentially
 * the method that takes care of booting the application.
 */
export async function onReady() {
  try {
    logger.info("onReady()");

    // intial global variables
    global.browserWindows = {
      soiEditor: null,
      main: null
    }

    await onFirstRunMaybe();
    if (!isDevMode()) process.env.NODE_ENV = "production";
    try{
      await engine.startEngine();
    }catch(err){
      logger.error("start engine file. error: ", err);
    }

    try {
      SOIManager.runSOI();
    } catch (err) {
      logger.error("start soi fail. error: ", err);
    }

    // setup menus for main processes
    setupMenu();
    setupAboutPanel();
    setupProtocolHandler();
    // Auto update from github release
    setupUpdates();
    setupDialogs();
    setupDevTools();
    setUpEventListeners();
  } catch (err) {
    logger.error("Error in onReady, error: ", err);
  }
}

/**
 * Handle the "before-quit" event
 *
 * @export
 */
export function onBeforeQuit() {
  (global as any).isQuitting = true;
  SOIManager.stopSOI();
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
  // app.on("window-all-closed", onWindowsAllClosed);
  app.on("activate", getOrCreateMainWindow);
}

main();
