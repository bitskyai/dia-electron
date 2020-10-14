import * as path from "path";
import * as _ from "lodash";
const { Launcher } = require("chrome-launcher");
import { startServer, stopServer } from "../headless-producer/server.js";
import logger from "../utils/logger";
import { getAvailablePort } from "../utils/index";
import { IpcEvents, BROWSER_WINDOW_EVENTS } from "../ipc-events";
import { ipcMainManager } from "./ipc";
import supplier from "../utils/supplier";
import {
  getHeadlessProducerPreferencesJSON,
  updateHeadlessProducerPreferencesJSON,
} from "./preferences";

import { HeadlessProducerPreference } from "../interfaces";

let _headlessProducer: HeadlessProducer;

class HeadlessProducer {
  public port: number = 8090;
  // in the middle of start producer
  public starting: boolean = false;
  // in the middle of stop producer
  public stopping: boolean = false;
  // producer is running
  public running: boolean = false;
  //
  public chromeInstallations: Array<String> = [];
  constructor() {
    try {
      this.chromeInstallations = Launcher.getInstallations();
    } catch (err) {
      this.chromeInstallations = [];
    }
  }

  getConfig(): HeadlessProducerPreference {
    try {
      let config = getHeadlessProducerPreferencesJSON();
      config.TYPE = "HEADLESSBROWSER";
      config.BITSKY_BASE_URL = `http://localhost:${supplier.supplierPort}`;
      config.PORT = this.port;
      config.RUNNING = this.running;
      config.STARTING = this.starting;
      config.STOPPING = this.stopping;
      return config;
    } catch (err) {
      logger.error("HeadlessProducer -> getConfig fail. ", err);
      throw err;
    }
  }

  setConfig(producerConfig: HeadlessProducerPreference) {
    try {
      return updateHeadlessProducerPreferencesJSON(producerConfig);
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
          subject: BROWSER_WINDOW_EVENTS.STARTING_HEADLESS,
          data: this.getConfig(),
        },
      ]);

      const headlessConfig = this.getConfig();
      this.port = await getAvailablePort(this.port);
      const headlessHome = headlessConfig.PRODUCER_HOME;
      // const logPath = path.join(headlessHome, "log");
      logger.info(`headless producer port: ${this.port} `);
      const configs = _.merge(
        {},
        {
          PORT: this.port,
          // LOG_FILES_PATH: logPath,
          SERVICE_NAME: "headless-producer",
        },
        headlessConfig
      );
      const expressOptions = {
        static: headlessHome,
      };
      const indexOptions = {
        home: headlessHome,
        items: [
          {
            url: "/screenshots",
            title: "Screenshots",
            description: 'Screenshots of web page. <button type="button" class="btn btn-primary btn-sm"><a href="/screenshots" style="color: white;" target="_blank">View Screenshots</a></button>',
          },
        ],
      };

      // TODO: need to remove
      // Only for test purpose
      // await new Promise((resolve) => {
      //   setTimeout(() => resolve(true), 10 * 1000);
      // });

      // console.log("headlessProducer->start-> configs: ", configs);
      await startServer(configs, expressOptions, indexOptions);

      // -------------------------------
      // update runtime configs
      this.starting = false;
      this.running = true;
      this.stopping = false;

      // notify web-app
      ipcMainManager.send(IpcEvents.MESSAGE_TO_SUPPLIER_UI, [
        {
          subject: BROWSER_WINDOW_EVENTS.STARTED_HEADLESS,
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
          subject: BROWSER_WINDOW_EVENTS.STARTED_HEADLESS,
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
          subject: BROWSER_WINDOW_EVENTS.STOPPING_HEADLESS,
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
          subject: BROWSER_WINDOW_EVENTS.STOPPED_HEADLESS,
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
          subject: BROWSER_WINDOW_EVENTS.STOPPED_HEADLESS,
          status: false,
          data: this.getConfig(),
          error: err,
        },
      ]);
      throw err;
    }
  }
}

export function setupHeadlessProducer(): HeadlessProducer {
  try {
    if (_headlessProducer) {
      return _headlessProducer;
    }
    _headlessProducer = new HeadlessProducer();
    _headlessProducer.start();

    // setup message listener
    ipcMainManager.on(IpcEvents.SYNC_SUPPLIER_UI_TO_MAIN, async (event, body) => {
      const subject = body && body.subject;
      switch (subject) {
        case "headless/getConfig":
          event.returnValue = {
            status: true,
            data: _headlessProducer.getConfig(),
            options: {
              chromeInstallations: _headlessProducer.chromeInstallations,
            },
          };
          break;
        case "headless/updateConfig":
          console.log("headless/updateConfig -> body: ", body);
          event.returnValue = {
            status: true,
            data: _headlessProducer.setConfig(body.data),
          };
          _headlessProducer.restart();
          break;
        case "headless/start":
          let startValue = {
            status: false,
            error: null,
          };
          try {
            _headlessProducer.start();
            startValue.status = true;
          } catch (err) {
            startValue.status = false;
            startValue.error = err;
          }

          event.returnValue = startValue;
          console.log("headless/start -> returnValue: ", startValue);
          break;
        case "headless/stop":
          let stopValue = {
            status: false,
            data: {},
            error: null,
          };
          try {
            _headlessProducer.stop();
            stopValue.status = true;
          } catch (err) {
            stopValue.status = false;
            stopValue.error = err;
          }

          event.returnValue = stopValue;
          console.log("headless/stop -> returnValue: ", stopValue);
          break;
        case "headless/getChromeInstallations":
          let returnValue = {
            status: true,
            installations: [],
            error: null,
          };
          try {
            returnValue.installations = Launcher.getChromeInstallations();
          } catch (err) {
            returnValue.status = false;
            returnValue.error = err;
          }

          event.returnValue = returnValue;
          console.log(
            "headless/getChromeInstallations -> Installations: ",
            returnValue.installations
          );
          break;
        // default:
        //   console.log("default subject ");
        //   event.returnValue = {
        //     status: false,
        //     error: {
        //       message:
        //         "not matched subject. Please pass one of ['getHeadlessConfig', 'updateHeadlessConfig', 'startHeadless', 'stopHeadless']",
        //     },
        //   };
      }
    });

    return _headlessProducer;
  } catch (err) {
    logger.error("setupHeadlessProducer fail.", err);
    throw err;
  }
}
