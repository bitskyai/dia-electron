import { dialog } from "electron";
import { getPreferencesJSON, updateProcessEnvs } from "../main/preferences";
import { startServer, stopServer } from "../engine-ui/src/server.js";
import logger from "./logger";
import { getAvailablePort } from "./index";
import { getOrCreateMainWindow } from "../main/windows";
import { MUNEW_HOME_FOLDER } from './constants'

class Engine {
  public enginePort: number = 9099;
  constructor() {}

  public async startEngine() {
    try {
      const preferences = getPreferencesJSON();
      updateProcessEnvs(preferences);
      logger.info(
        "main->main.js->onReady, TYPEORM_DATABASE: ",
        process.env.TYPEORM_DATABASE
      );
      logger.info(
        "main->main.js->onReady, LOG_FILES_PATH: ",
        process.env.LOG_FILES_PATH
      );
      this.enginePort = await getAvailablePort(this.enginePort);
      process.env.PORT = this.enginePort;
      // start
      await startServer();
      logger.info("main->main.js->onReady, dia-engine successfully started.");
      const mainWindow = getOrCreateMainWindow();
      // mainWindow.loadURL(`http://localhost:${this.enginePort}`);

      // Only used for UI Develop
      mainWindow.loadURL(`http://localhost:8000`);

      logger.info(
        `main->main.js->onReady, load http://localhost:${this.enginePort} in main browser`
      );
    } catch (err) {
      dialog.showErrorBox(
        "Open BitSky Failed",
        `You can try to close BitSky and reopen it again, if still doesn't work, try to delete ${MUNEW_HOME_FOLDER} folder in your home folder. Error:${JSON.stringify(
          err
        )}`
      );
      throw err;
    }
  }

  public async restartEngine() {
    try {
      this.stopEngine();
      this.startEngine();
    } catch (err) {
      dialog.showErrorBox(
        "Restart BitSky Failed",
        `You can try to close BitSky and reopen it again, if still doesn't work, try to delete ${MUNEW_HOME_FOLDER} folder in your home folder. Error:${JSON.stringify(
          err
        )}`
      );
      throw err;
    }
  }

  public async stopEngine() {
    try {
      await stopServer();
    } catch (err) {
      dialog.showErrorBox(
        "Stop BitSky Failed",
        `You can try to force close BitSky. Error:${JSON.stringify(err)}`
      );
      throw err;
    }
  }
}

export default new Engine();
