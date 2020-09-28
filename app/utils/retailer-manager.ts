// Main Process
import * as fsType from "fs-extra";
import * as path from "path";
import { ChildProcess, spawn } from "child_process";
import { fancyImport } from "./import";
import { copyDefaultRetailer, getRetailerPath, writeConfigJson } from "./retailer-file-manager";
import { BITSKY_HOME_FOLDER } from "./constants";
import { isFirstRun } from "./check-first-run";
import logger from "./logger";
import { IpcEvents } from "../ipc-events";
import { ipcMainManager } from "../main/ipc";
import { LogItem } from "../interfaces";
import { getAvailablePort, clearRequireCacheStartWith } from "./index";
import { RETAILER_CHECK_TIMEOUT } from "./constants";

class RetailerManager {
  public retailerProcess: ChildProcess | null = null;
  public version: string = "7.1.2";
  // whether need to restart server, normally, it was caused by change *.js file
  public needToRestart: boolean = false;
  private isElectronDownloaded: boolean = false;
  // whether electron is downloading
  private isDownloading: boolean = false;
  // whether Retailer is running
  private isRunning: boolean = false;
  // whether during the middle of start server
  private isStartingServer: boolean = false;
  // whether during the middle of stop server
  private isStoppingServer: boolean = false;
  // Port number isStoppingServer be changed if port isn't available
  private RetailerPort: number = 8081;

  constructor() {
    this.runRetailer = this.runRetailer.bind(this);
    this.stopRetailer = this.stopRetailer.bind(this);
    let force = false;
    if (isFirstRun()) {
      // if it is first time run, then need to clean previous Retailer
      force = true;
    }
    copyDefaultRetailer(force);
    writeConfigJson();
  }

  /**
   * Download Electron, called with a version. Is called during construction
   * to ensure that we always have or download at least one version.
   *
   * @returns {Promise<void>}
   */
  public async downloadElectron(): Promise<boolean> {
    const version = this.version;
    const fs = await fancyImport<typeof fsType>("fs-extra");
    const { promisify } = await import("util");
    const eDownload = promisify(require("electron-download"));

    // make sure electron download folder is created
    await fs.mkdirp(this.getDownloadPath());
    let status = this.status();
    if (this.isDownloading) {
      logger.info(
        `RetailerManager: Electron ${version} already downloading. please wait...`
      );
      ipcMainManager.sendToRetailerEditor(IpcEvents.DOWNLOADING_ELECTRON, [
        {
          status: "downloading",
          payload: {
            status,
            version
          }
        }
      ]);
      return true;
    }

    // if already download, then direct response downloading success
    if (this.isElectronDownloaded) {
      logger.info(`RetailerManager: Electron ${version} already downloaded.`);
      this.isDownloading = false;
      ipcMainManager.sendToRetailerEditor(IpcEvents.DOWNLOAD_ELECTRON_SUCCESS, [
        {
          status: "success",
          payload: {
            status: { ...status, isDownloading: this.isDownloading },
            version
          }
        }
      ]);
      return true;
    }

    logger.info(`RetailerManager: Electron ${version} not present, downloading`);
    // start downloading electron
    this.isDownloading = true;
    // publish message to let Retailer Editor know it is downloading electron
    ipcMainManager.sendToRetailerEditor(IpcEvents.DOWNLOADING_ELECTRON, [
      {
        status: "downloading",
        payload: {
          status: { ...status, isDownloading: this.isDownloading },
          version
        }
      }
    ]);
    try {
      const zipPath = await eDownload({ version });
      const extractPath = this.getDownloadPath();
      logger.info(
        `RetailerManager: Electron ${version} downloaded, now unpacking to ${extractPath}`
      );
      // Ensure the target path is empty
      await fs.emptyDir(extractPath);
      const electronFiles = await this.unzip(zipPath, extractPath);
      logger.info(`Unzipped ${version}`, electronFiles);
      this.isDownloading = false;
      // update `isElectronDownloaded`
      status = this.status();
      if (this.isElectronDownloaded) {
        // if isDownloaded is true, then successfully download
        ipcMainManager.sendToRetailerEditor(IpcEvents.DOWNLOAD_ELECTRON_SUCCESS, [
          {
            status: "success",
            payload: {
              status,
              version
            }
          }
        ]);
      } else {
        // otherwise, download fail
        ipcMainManager.sendToRetailerEditor(IpcEvents.DOWNLOAD_ELECTRON_FAIL, [
          {
            status: "fail",
            payload: {
              status,
              version
            }
          }
        ]);
      }
      return true;
    } catch (error) {
      logger.error(`Failure while unzipping ${version}`, error);
      this.isDownloading = false;
      let status = this.status();
      ipcMainManager.sendToRetailerEditor(IpcEvents.DOWNLOAD_ELECTRON_FAIL, [
        {
          status: "fail",
          payload: {
            status,
            version,
            error: {
              message: error.message,
              stack: error.stack
            }
          }
        }
      ]);
      return false;
      // TODO: Handle this case
    }
  }

  /**
   * Did we already download a given version?
   *
   * @param {string} version
   * @param {string} dir
   * @returns {boolean}
   */
  public async getIsDownloaded(): Promise<boolean> {
    const expectedPath = this.getElectronBinaryPath();
    const fs = await fancyImport<typeof fsType>("fs-extra");
    // Update `isElectronDownloaded` property
    this.isElectronDownloaded = !!fs.existsSync(expectedPath);
    return this.isElectronDownloaded;
  }

  /**
   * Gets the expected path for a given Electron version
   *
   * @param {string} version
   * @returns {string}
   */
  private getDownloadPath(): string {
    return path.join(BITSKY_HOME_FOLDER, "electron-bin", this.version);
  }

  /**
   * Unzips an electron package so that we can actually use it.
   *
   * @param {string} zipPath
   * @param {string} extractPath
   * @returns {Promise<void>}
   */
  private unzip(zipPath: string, extractPath: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
      logger.functionStart("RetailerManager->unzip");
      const extract = await fancyImport<any>("extract-zip");
      logger.debug("zipPath: ", zipPath);
      logger.debug("extractPath: ", extractPath);
      process.noAsar = true;

      const options = {
        dir: extractPath
      };

      extract(zipPath, options, (error: Error) => {
        if (error) {
          reject(error);
          return;
        }
        logger.info(`RetailerManager: Unpacked!`);
        process.noAsar = false;
        resolve();
        logger.functionEnd("RetailerManager->unzip");
      });
    });
  }

  /**
   * check whether a Retailer start successful or not
   */
  public async checkWhetherStartRetailerSuccessful() {
    return new Promise((resolve, reject) => {
      // if port number isn't available, then means start successfully, otherwise need to continue to wait until timeout
      let startTimestamp = Date.now();
      const checkHandler = setInterval(async () => {
        let port = await getAvailablePort(this.RetailerPort);
        if (port !== this.RetailerPort) {
          // then means start successful
          resolve(true);
          clearInterval(checkHandler);
          return;
        }
        // check whether timeout
        if (Date.now() - startTimestamp > RETAILER_CHECK_TIMEOUT) {
          reject(false);
          clearInterval(checkHandler);
          return;
        }
      }, 100);
    });
  }

  /**
   * Gets the expected path for the binary of a given Electron version
   *
   * @param {string} version
   * @param {string} dir
   * @returns {string}
   */
  public getElectronBinaryPath(): string {
    let dir: string = this.getDownloadPath();
    switch (process.platform) {
      case "darwin":
        return path.join(dir, "Electron.app/Contents/MacOS/Electron");
      case "freebsd":
      case "linux":
        return path.join(dir, "electron");
      case "win32":
        return path.join(dir, "electron.exe");
      default:
        throw new Error(
          `Electron builds are not available for ${process.platform}`
        );
    }
  }

  private formatOutput(data: string | Buffer): LogItem | null {
    let strData = data.toString("utf8");
    // remove  ANSI colors/styles from string, since currently console doesn't support to show **ANSI colors/styles**
    strData = strData.replace(
      /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
      ""
    );
    if (strData.startsWith("Debugger listening on ws://")) return null;
    if (strData === "For help see https://nodejs.org/en/docs/inspector")
      return null;

    return {
      timestamp: Date.now(),
      text: strData.trim()
    };
  }

  private async publishLog(data): Promise<void> {
    const logItem: LogItem | null = this.formatOutput(data);
    if (logItem) {
      ipcMainManager.sendToRetailerEditor(IpcEvents.RETAILER_CONSOLE_LOG, [logItem]);
    }
  }

  private async getAvailablePort(): Promise<number> {
    this.RetailerPort = await getAvailablePort(this.RetailerPort);
    return this.RetailerPort;
  }

  public async runRetailerElectron(): Promise<void> {
    try {
      logger.functionStart("runRetailer");
      this.isStartingServer = true;
      let status = this.status();
      if (this.isRunning) {
        ipcMainManager.sendToRetailerEditor(IpcEvents.STARTING_RETAILER_SERVER_SUCCESS, [
          {
            status: "success",
            payload: {
              status
            }
          }
        ]);
        return;
      }
      const RETAILER_PATH = getRetailerPath();
      await this.downloadElectron();
      const binaryPath = this.getElectronBinaryPath();
      logger.debug(`elelctron binary path: ${binaryPath}`);
      logger.debug(`RETAILER_Path: ${RETAILER_PATH}`);
      // get an available port
      this.RetailerPort = await this.getAvailablePort();
      status = this.status();
      ipcMainManager.sendToRetailerEditor(IpcEvents.STARTING_RETAILER_SERVER, [
        {
          status: "starting",
          payload: {
            status
          }
        }
      ]);
      const env = { ...process.env };
      env.PORT = this.RetailerPort.toString();

      this.retailerProcess = spawn(binaryPath, [RETAILER_PATH, "--inspect"], {
        cwd: RETAILER_PATH,
        env
      });

      this.retailerProcess.stdout!.on("data", data => {
        // logger.debug("======stdout: ", data.toString());
        this.publishLog(data);
      });
      this.retailerProcess.stderr!.on("data", data => {
        // logger.debug("******stderr: ", data.toString());
        this.publishLog(data);
      });
      this.retailerProcess.on("close", async code => {
        const withCode =
          typeof code === "number" ? ` with code ${code.toString()}.` : `.`;
        logger.debug(withCode);
        this.publishLog(withCode);
        this.retailerProcess = null;
        status = this.status();
        ipcMainManager.sendToRetailerEditor(IpcEvents.STOPPING_RETAILER_SERVER_SUCCESS, [
          {
            status: "success",
            payload: {
              status
            }
          }
        ]);
      });
      const success = await this.checkWhetherStartRetailerSuccessful();
      this.isStartingServer = false;
      if (success) {
        this.isRunning = true;
        status = this.status();
        ipcMainManager.sendToRetailerEditor(IpcEvents.STARTING_RETAILER_SERVER_SUCCESS, [
          {
            status: "success",
            payload: {
              status
            }
          }
        ]);
      } else {
        this.isRunning = false;
        await this.stopRetailer();
        status = this.status();
        ipcMainManager.sendToRetailerEditor(IpcEvents.STARTING_RETAILER_SERVER_FAIL, [
          {
            status: "fail",
            payload: {
              status
            }
          }
        ]);
      }
      logger.functionEnd("runRetailer");
    } catch (err) {
      this.isStartingServer = false;
      this.isRunning = false;
      await this.stopRetailer();
      logger.error("runRetailer error: ", err);
      let status = this.status();
      ipcMainManager.sendToRetailerEditor(IpcEvents.STARTING_RETAILER_SERVER_FAIL, [
        {
          status: "fail",
          payload: {
            status,
            error: {
              message: err.message,
              stack: err.stack
            }
          }
        }
      ]);
      throw err;
    }
  }

  public async stopRetailerElectron() {
    try {
      this.isStoppingServer = true;
      let status = this.status();
      ipcMainManager.sendToRetailerEditor(IpcEvents.STOPPING_RETAILER_SERVER, [
        {
          status: "stopping",
          payload: {
            status
          }
        }
      ]);

      if (this.retailerProcess) {
        this.retailerProcess.kill();
        this.isRunning = false;
        this.isStoppingServer = false;
        status = this.status();
        ipcMainManager.sendToRetailerEditor(IpcEvents.STOPPING_RETAILER_SERVER_SUCCESS, [
          {
            status: "success",
            payload: {
              status
            }
          }
        ]);
      }
    } catch (err) {
      this.isStoppingServer = false;
      let status = this.status();
      ipcMainManager.sendToRetailerEditor(IpcEvents.STOPPING_RETAILER_SERVER_FAIL, [
        {
          status: "fail",
          payload: {
            status,
            error: {
              message: err.message,
              stack: err.stack
            }
          }
        }
      ]);
    }
  }

  public async runRetailer(): Promise<void> {
    try {
      logger.functionStart("runRetailer");
      this.isStartingServer = true;
      let status = this.status();
      if (this.isRunning) {
        ipcMainManager.sendToRetailerEditor(IpcEvents.STARTING_RETAILER_SERVER_SUCCESS, [
          {
            status: "success",
            payload: {
              status
            }
          }
        ]);
        return;
      }
      const RETAILER_PATH = getRetailerPath();
      logger.debug(`RETAILER_Path: ${RETAILER_PATH}`);
      // get an available port
      this.RetailerPort = await this.getAvailablePort();
      status = this.status();
      ipcMainManager.sendToRetailerEditor(IpcEvents.STARTING_RETAILER_SERVER, [
        {
          status: "starting",
          payload: {
            status
          }
        }
      ]);
      const RETAILER_SERVER_PATH = path.join(RETAILER_PATH, 'server.js');
      clearRequireCacheStartWith(RETAILER_PATH);
      const { startServer } = require(RETAILER_SERVER_PATH);
      await startServer({
        BITSKY_BASE_URL: process.env.BITSKY_BASE_URL,
        PORT: this.RetailerPort
      });
      const success = await this.checkWhetherStartRetailerSuccessful();
      this.isStartingServer = false;
      if (success) {
        this.isRunning = true;
        this.needToRestart = false; // restart/start server successful
        status = this.status();
        ipcMainManager.sendToRetailerEditor(IpcEvents.STARTING_RETAILER_SERVER_SUCCESS, [
          {
            status: "success",
            payload: {
              status
            }
          }
        ]);
      } else {
        this.isRunning = false;
        // await this.stopRetailer();
        status = this.status();
        ipcMainManager.sendToRetailerEditor(IpcEvents.STARTING_RETAILER_SERVER_FAIL, [
          {
            status: "fail",
            payload: {
              status
            }
          }
        ]);
      }
      logger.functionEnd("runRetailer");
    } catch (err) {
      this.isStartingServer = false;
      this.isRunning = false;
      // await this.stopRetailer();
      logger.error("runRetailer error: ", err);
      let status = this.status();
      ipcMainManager.sendToRetailerEditor(IpcEvents.STARTING_RETAILER_SERVER_FAIL, [
        {
          status: "fail",
          payload: {
            status,
            error: {
              message: err.message,
              stack: err.stack
            }
          }
        }
      ]);
      throw err;
    }
  }

  public async stopRetailer() {
    try {
      this.isStoppingServer = true;
      let status = this.status();
      ipcMainManager.sendToRetailerEditor(IpcEvents.STOPPING_RETAILER_SERVER, [
        {
          status: "stopping",
          payload: {
            status
          }
        }
      ]);

      const RETAILER_PATH = getRetailerPath();
      const RETAILER_SERVER_PATH = path.join(RETAILER_PATH, 'server.js');
      clearRequireCacheStartWith(RETAILER_PATH);
      const { stopServer } = require(RETAILER_SERVER_PATH);
      if (stopServer) {
        await stopServer();
        this.isRunning = false;
        this.isStoppingServer = false;
        status = this.status();
        console.log('stopRetailer -> status: ', status);
        ipcMainManager.sendToRetailerEditor(IpcEvents.STOPPING_RETAILER_SERVER_SUCCESS, [
          {
            status: "success",
            payload: {
              status
            }
          }
        ]);
      }
    } catch (err) {
      console.error("stopRetailer -> error message: ", err.message);
      console.error("stopRetailer -> error stack: ", err.stack);
      this.isStoppingServer = false;
      let status = this.status();
      ipcMainManager.sendToRetailerEditor(IpcEvents.STOPPING_RETAILER_SERVER_FAIL, [
        {
          status: "fail",
          payload: {
            status,
            error: {
              message: err.message,
              stack: err.stack
            }
          }
        }
      ]);
    }
  }

  /**
   * Get default Retailer status
   */
  public status() {
    // check whether isn't downloaded
    // await this.getIsDownloaded(); // Don't require user to download Electorn
    return {
      needToRestart: this.needToRestart,
      // isElectronDownloaded: this.isElectronDownloaded,
      isElectronDownloaded: true,  // Don't require user to download Electorn
      // after init, will not change
      RetailerPort: this.RetailerPort,
      // following is in-memory status
      // isDownloading: this.isDownloading,
      isDownloading: false, // Don't require user to download Electorn
      isRunning: this.isRunning,
      isStartingServer: this.isStartingServer,
      isStoppingServer: this.isStoppingServer
    };
  }
}

export default new RetailerManager();
