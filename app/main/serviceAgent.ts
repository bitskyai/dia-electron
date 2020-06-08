import * as path from "path";
import { startServer, stopServer } from "../agents-service/server.js";
import logger from "../utils/logger";
import { getAvailablePort } from "../utils/index";
import { IpcEvents } from "../ipc-events";
import { ipcMainManager } from "./ipc";
import {
  getServiceAgentPreferencesJSON,
  updateServiceAgentPreferencesJSON,
} from "./preferences";
import { BaseAgentPreference } from "../interfaces";

let _serviceAgent: ServiceAgent;

class ServiceAgent {
  public port: number = 8091;
  constructor() {}

  getConfig(): BaseAgentPreference {
    try {
      let config = getServiceAgentPreferencesJSON();
      config.PORT = this.port;
      return config;
    } catch (err) {
      logger.error("HeadlessAgent -> getConfig fail. ", err);
      throw err;
    }
  }

  setConfig(agentConfig: BaseAgentPreference) {
    try {
      return updateServiceAgentPreferencesJSON(agentConfig);
    } catch (err) {
      logger.error("setConfig -> getConfig fail. ", err);
      throw err;
    }
  }

  public async start() {
    try {
      const serviceConfig = this.getConfig();
      this.port = await getAvailablePort(this.port);
      const serviceHome = serviceConfig.AGENT_HOME;
      const logPath = path.join(serviceHome, "log");
      logger.info(`service agent port: ${this.port} `);
      const configs = {
        PORT: this.port,
        MUNEW_BASE_URL: serviceConfig.MUNEW_BASE_URL,
        GLOBAL_ID: serviceConfig.GLOBAL_ID,
        HEADLESS: false,
        LOG_FILES_PATH: logPath,
        SERVICE_NAME: "agents-service",
      };
      const expressOptions = {
        static: serviceHome,
      };
      const indexOptions = {
        home: serviceHome,
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

export function setupServiceAgent():ServiceAgent {
  try {
    if (_serviceAgent) {
      return _serviceAgent;
    }

    _serviceAgent = new ServiceAgent();

    _serviceAgent.start();

    // setup message listener
    ipcMainManager.on(IpcEvents.SYNC_ENGINE_UI_TO_MAIN, async (event, body) => {
      const subject = body && body.subject;
      console.log("subject: ", subject);
      switch (subject) {
        case "getServiceConfig":
          event.returnValue = {
            status: true,
            data: _serviceAgent.getConfig(),
          };
          break;
        // default:
        //   event.returnValue = {
        //     status: false,
        //     error: {
        //       message:
        //         "not matched subject. Please pass one of ['getServiceConfig', 'updateServiceConfig', 'startService', 'stopService']",
        //     },
        //   };
      }
    });

    return _serviceAgent;
  } catch (err) {
    logger.error("setupServiceAgent fail.", err);
    throw err;
  }
}
