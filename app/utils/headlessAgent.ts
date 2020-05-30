import * as path from "path";
import { getPreferencesJSON, updateProcessEnvs } from "../main/preferences";
import { startServer, stopServer } from "../agents-headless/server.js";
import logger from "./logger";
import { MUNEW_HOME_FOLDER } from "./constants";
import { getAvailablePort } from "./index";

class HeadlessAgent {
  public port: number = 8090;
  constructor() {}

  public async start(baseURL, globalId) {
    try {
      const preferences = getPreferencesJSON();
      updateProcessEnvs(preferences);

      this.port = await getAvailablePort(this.port);
      const headlessHome = path.join(MUNEW_HOME_FOLDER, 'headless');
      const logPath = path.join(headlessHome, 'log');
      logger.info(`headless agent port: ${this.port} `);
      const configs = {
        PORT: this.port,
        MUNEW_BASE_URL: baseURL,
        GLOBAL_ID: globalId,
        HEADLESS: false,
        LOG_FILES_PATH: logPath,
        SERVICE_NAME: "agents-headless",
        SCREENSHOT: true,
        SCREENSHOT_FOLDER: path.join(headlessHome, 'screenshots')
      };
      const expressOptions = {
        static: headlessHome
      };
      const indexOptions = {
        items: [
          undefined,
          undefined,
          undefined,
          {
            url: "/screenshots",
            title: "Screenshots",
            description:
              "Screenshots of web page",
          },
        ],
      }
      await startServer(configs, expressOptions, indexOptions);
    } catch (err) {
      throw err;
    }
  }

  public async restart(baseURL, globalId) {
    try {
      this.stop();
      this.start(baseURL, globalId);
    } catch (err) {
      throw err;
    }
  }

  public async stop() {
    try {
      await stopServer();
    } catch (err) {
      throw err;
    }
  }
}

export default new HeadlessAgent();
