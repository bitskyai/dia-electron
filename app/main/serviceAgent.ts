import * as path from "path";
import * as _ from "lodash";
import { startServer, stopServer } from "../service-producer/server.js";
import logger from "../utils/logger";
import { getAvailablePort } from "../utils/index";
import { IpcEvents, BROWSER_WINDOW_EVENTS } from "../ipc-events";
import { ipcMainManager } from "./ipc";
import engine from '../utils/engine';
import {
  getServiceAgentPreferencesJSON,
  updateServiceAgentPreferencesJSON,
} from "./preferences";
import { BaseAgentPreference } from "../interfaces";

let _serviceAgent: ServiceAgent;

class ServiceAgent {
  public port: number = 8091;
  // in the middle of start agent
  public starting: boolean = false;
  // in the middle of stop agent
  public stopping: boolean = false;
  // agent is running
  public running: boolean = false;

  constructor() {}

  getConfig(): BaseAgentPreference {
    try {
      let config = getServiceAgentPreferencesJSON();
      config.TYPE = 'SERVICE';
      config.BITSKY_BASE_URL = `http://localhost:${engine.enginePort}`;
      config.PORT = this.port;
      config.RUNNING = this.running;
      config.STARTING = this.starting;
      config.STOPPING = this.stopping;
      return config;
    } catch (err) {
      logger.error("ServiceAgent -> getConfig fail. ", err);
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
      // -------------------------------
      // update runtime configs
      this.starting = true;
      this.running = false;
      this.stopping = false;

      // notify web-app
      ipcMainManager.send(IpcEvents.MESSAGE_TO_ENGINE_UI, [
        {
          subject: BROWSER_WINDOW_EVENTS.STARTING_SERVICE,
          data: this.getConfig(),
        },
      ]);

      const serviceConfig = this.getConfig();
      this.port = await getAvailablePort(this.port);
      const serviceHome = serviceConfig.PRODUCER_HOME;
      const logPath = path.join(serviceHome, "log");
      logger.info(`service agent port: ${this.port} `);
      const configs = _.merge(
        {},
        {
          PORT: this.port,
          LOG_FILES_PATH: logPath,
          SERVICE_NAME: "service-producer",
        },
        serviceConfig
      );
      const expressOptions = {
        static: serviceHome,
      };
      const indexOptions = {
        home: serviceHome,
      };

      // TODO: need to remove
      // Only for test purpose
      // await new Promise((resolve) => {
      //   setTimeout(() => resolve(true), 10 * 1000);
      // });

      await startServer(configs, expressOptions, indexOptions);

      // -------------------------------
      // update runtime configs
      this.starting = false;
      this.running = true;
      this.stopping = false;

      // notify web-app
      ipcMainManager.send(IpcEvents.MESSAGE_TO_ENGINE_UI, [
        {
          subject: BROWSER_WINDOW_EVENTS.STARTED_SERVICE,
          status: true,
          data: this.getConfig(),
          error: null,
        },
      ]);
    } catch (err) {
      // -------------------------------
      // update runtime configs
      this.starting = false;
      this.running = false;
      this.stopping = false;

      // notify web-app
      ipcMainManager.send(IpcEvents.MESSAGE_TO_ENGINE_UI, [
        {
          subject: BROWSER_WINDOW_EVENTS.STARTED_SERVICE,
          status: false,
          data: this.getConfig(),
          error: err,
        },
      ]);

      throw err;
    }
  }

  public async restart() {
    try {
      await this.stop();
      await this.start();
    } catch (err) {
      throw err;
    }
  }

  public async stop() {
    try {
      // -------------------------------
      // update runtime configs
      this.starting = false;
      this.stopping = true;

      // notify web-app
      ipcMainManager.send(IpcEvents.MESSAGE_TO_ENGINE_UI, [
        {
          subject: BROWSER_WINDOW_EVENTS.STOPPING_SERVICE,
          data: this.getConfig(),
        },
      ]);

      // TODO: need to remove
      // Only for test purpose
      // await new Promise((resolve) => {
      //   setTimeout(() => resolve(true), 10 * 1000);
      // });

      await stopServer();

      // -------------------------------
      // update runtime configs
      this.starting = false;
      this.running = false;
      this.stopping = false;

      // notify web-app
      ipcMainManager.send(IpcEvents.MESSAGE_TO_ENGINE_UI, [
        {
          subject: BROWSER_WINDOW_EVENTS.STOPPED_SERVICE,
          status: true,
          data: this.getConfig(),
          error: null,
        },
      ]);
    } catch (err) {
      // -------------------------------
      // update runtime configs
      this.starting = false;
      this.stopping = false;

      // notify web-app
      ipcMainManager.send(IpcEvents.MESSAGE_TO_ENGINE_UI, [
        {
          subject: BROWSER_WINDOW_EVENTS.STOPPED_SERVICE,
          status: false,
          data: this.getConfig(),
          error: err,
        },
      ]);

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
          case "service/getConfig":
            event.returnValue = {
              status: true,
              data: _serviceAgent.getConfig(),
            };
            break;
          case "service/updateConfig":
            console.log('service/updateConfig -> body: ', body);
            event.returnValue = {
              status: true,
              data: _serviceAgent.setConfig(body.data),
            };
            _serviceAgent.restart();
            break;
          case "service/start":
            let startValue = {
              status: false,
              error: null,
            };
            try {
              _serviceAgent.start();
              startValue.status = true;
            } catch (err) {
              startValue.status = false;
              startValue.error = err;
            }
  
            event.returnValue = startValue;
            console.log("service/start -> returnValue: ", startValue);
            break;
          case "service/stop":
            let stopValue = {
              status: false,
              data: {},
              error: null,
            };
            try {
              _serviceAgent.stop();
              stopValue.status = true;
            } catch (err) {
              stopValue.status = false;
              stopValue.error = err;
            }
  
            event.returnValue = stopValue;
            console.log("service/stop -> returnValue: ", stopValue);
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
