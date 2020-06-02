import * as path from "path";
import { startServer, stopServer } from "../agents-headless/server.js";
import logger from "../utils/logger";
import { getAvailablePort } from "../utils/index";
import { IpcEvents } from "../ipc-events";
import { ipcMainManager } from "./ipc";
import {
  getHeadlessAgentPreferencesJSON,
  updateHeadlessAgentPreferencesJSON,
} from "./preferences";

import { HeadlessAgentPreference } from "../interfaces";

let _headlessAgent: HeadlessAgent;

class HeadlessAgent {
  public port: number = 8090;
  constructor() {}

  getConfig(): HeadlessAgentPreference {
    try {
      let config = getHeadlessAgentPreferencesJSON();
      config.PORT = this.port;
      return config;
    } catch (err) {
      logger.error("HeadlessAgent -> getConfig fail. ", err);
      throw err;
    }
  }

  setConfig(agentConfig: HeadlessAgentPreference) {
    try {
      return updateHeadlessAgentPreferencesJSON(agentConfig);
    } catch (err) {
      logger.error("setConfig -> getConfig fail. ", err);
      throw err;
    }
  }

  public async start() {
    try {
      const headlessConfig = this.getConfig();
      this.port = await getAvailablePort(this.port);
      const headlessHome = headlessConfig.AGENT_HOME;
      const logPath = path.join(headlessHome, "log");
      logger.info(`headless agent port: ${this.port} `);
      const configs = {
        PORT: this.port,
        MUNEW_BASE_URL: headlessConfig.MUNEW_BASE_URL,
        GLOBAL_ID: headlessConfig.GLOBAL_ID,
        HEADLESS: false,
        LOG_FILES_PATH: logPath,
        SERVICE_NAME: "agents-headless",
        SCREENSHOT: true,
        AGENT_HOME: headlessHome,
      };
      const expressOptions = {
        static: headlessHome,
      };
      const indexOptions = {
        home: headlessHome,
        items: [
          undefined,
          undefined,
          undefined,
          {
            url: "/screenshots",
            title: "Screenshots",
            description: "Screenshots of web page",
          },
        ],
      };
      await startServer(configs, expressOptions, indexOptions);
    } catch (err) {
      throw err;
    }
  }

  public async restart() {
    try {
      this.stop();
      this.start();
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

export function setupHeadlessAgent(): HeadlessAgent {
  try {
    if (_headlessAgent) {
      return _headlessAgent;
    }
    _headlessAgent = new HeadlessAgent();
    _headlessAgent.start();

    // setup message listener
    ipcMainManager.on(IpcEvents.SYNC_ENGINE_UI_TO_MAIN, async (event, body) => {
      const subject = body && body.subject;
      console.log("subject: ", subject);
      switch (subject) {
        case "getHeadlessConfig":
          event.returnValue = {
            status: true,
            data: _headlessAgent.getConfig(),
          };
          break;
        default:
          event.returnValue = {
            status: false,
            error: {
              message:
                "not matched subject. Please pass one of ['getHeadlessConfig', 'updateHeadlessConfig', 'startHeadless', 'stopHeadless']",
            },
          };
      }
    });

    return _headlessAgent;
  } catch (err) {
    logger.error("setupHeadlessAgent fail.", err);
    throw err;
  }
}
