import * as path from "path";
import * as _ from "lodash";
import { startServer, stopServer } from "../http-producer/server.js";
import logger from "../utils/logger";
import { getAvailablePort } from "../utils/index";
import { IpcEvents, BROWSER_WINDOW_EVENTS } from "../ipc-events";
import { ipcMainManager } from "./ipc";
import supplier from '../utils/supplier';
import {
  getHTTPProducerPreferencesJSON,
  updateHTTPProducerPreferencesJSON,
} from "./preferences";
import { BaseProducerPreference } from "../interfaces";

let _httpProducer: HTTPProducer;

class HTTPProducer {
  public port: number = 8091;
  // in the middle of start producer
  public starting: boolean = false;
  // in the middle of stop producer
  public stopping: boolean = false;
  // producer is running
  public running: boolean = false;

  constructor() {}

  getConfig(): BaseProducerPreference {
    try {
      let config = getHTTPProducerPreferencesJSON();
      config.TYPE = 'HTTP';
      config.BITSKY_BASE_URL = `http://localhost:${supplier.supplierPort}`;
      config.PORT = this.port;
      config.RUNNING = this.running;
      config.STARTING = this.starting;
      config.STOPPING = this.stopping;
      return config;
    } catch (err) {
      logger.error("HTTPProducer -> getConfig fail. ", err);
      throw err;
    }
  }

  setConfig(producerConfig: BaseProducerPreference) {
    try {
      return updateHTTPProducerPreferencesJSON(producerConfig);
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
      ipcMainManager.send(IpcEvents.MESSAGE_TO_SUPPLIER_UI, [
        {
          subject: BROWSER_WINDOW_EVENTS.STARTING_HTTP,
          data: this.getConfig(),
        },
      ]);

      const serviceConfig = this.getConfig();
      console.log(`serviceConfig: `, serviceConfig);
      this.port = await getAvailablePort(this.port);
      const serviceHome = serviceConfig.PRODUCER_HOME;
      const logPath = path.join(serviceHome, "log");
      logger.info(`service producer port: ${this.port} `);
      const configs = _.merge(
        {},
        {
          PORT: this.port,
          LOG_FILES_PATH: logPath,
          SERVICE_NAME: "http-producer",
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
      ipcMainManager.send(IpcEvents.MESSAGE_TO_SUPPLIER_UI, [
        {
          subject: BROWSER_WINDOW_EVENTS.STARTED_HTTP,
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
      ipcMainManager.send(IpcEvents.MESSAGE_TO_SUPPLIER_UI, [
        {
          subject: BROWSER_WINDOW_EVENTS.STARTED_HTTP,
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
      ipcMainManager.send(IpcEvents.MESSAGE_TO_SUPPLIER_UI, [
        {
          subject: BROWSER_WINDOW_EVENTS.STOPPING_HTTP,
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
      ipcMainManager.send(IpcEvents.MESSAGE_TO_SUPPLIER_UI, [
        {
          subject: BROWSER_WINDOW_EVENTS.STOPPED_HTTP,
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
      ipcMainManager.send(IpcEvents.MESSAGE_TO_SUPPLIER_UI, [
        {
          subject: BROWSER_WINDOW_EVENTS.STOPPED_HTTP,
          status: false,
          data: this.getConfig(),
          error: err,
        },
      ]);

      throw err;
    }
  }
}

export function setupHTTPProducer():HTTPProducer {
  try {
    if (_httpProducer) {
      return _httpProducer;
    }

    _httpProducer = new HTTPProducer();
    _httpProducer.start();

    // setup message listener
    ipcMainManager.on(IpcEvents.SYNC_SUPPLIER_UI_TO_MAIN, async (event, body) => {
      const subject = body && body.subject;
      console.log("subject: ", subject);
      switch (subject) {
          case "http/getConfig":
            event.returnValue = {
              status: true,
              data: _httpProducer.getConfig(),
            };

            console.log(`_httpProducer.getConfig(): `, _httpProducer.getConfig());

            break;
          case "http/updateConfig":
            console.log('http/updateConfig -> body: ', body);
            event.returnValue = {
              status: true,
              data: _httpProducer.setConfig(body.data),
            };
            _httpProducer.restart();
            break;
          case "http/start":
            let startValue = {
              status: false,
              error: null,
            };
            try {
              _httpProducer.start();
              startValue.status = true;
            } catch (err) {
              startValue.status = false;
              startValue.error = err;
            }
  
            event.returnValue = startValue;
            console.log("http/start -> returnValue: ", startValue);
            break;
          case "http/stop":
            let stopValue = {
              status: false,
              data: {},
              error: null,
            };
            try {
              _httpProducer.stop();
              stopValue.status = true;
            } catch (err) {
              stopValue.status = false;
              stopValue.error = err;
            }
  
            event.returnValue = stopValue;
            console.log("http/stop -> returnValue: ", stopValue);
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

    return _httpProducer;
  } catch (err) {
    logger.error("setupHTTPProducer fail.", err);
    throw err;
  }
}
