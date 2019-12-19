// Main Process
import * as fsType from "fs-extra";
import * as path from "path";
import { ChildProcess, spawn } from "child_process";
import * as detect from "detect-port";
import { fancyImport } from "./import";
import {
  copyDefaultSOI,
  getSOIPath,
  getFileContent,
  updateFileContent
} from "./soi-file-manager";
import { USER_DATA_PATH } from "./constants";
import { isFirstRun } from "./check-first-run";
import logger from "./logger";
import { IpcEvents } from "../ipc-events";
import { ipcMainManager } from "../main/ipc";
import { LogItem } from "../interfaces";

class SOIManager {
  public soiProcess: ChildProcess | null = null;
  public version: string = "7.1.2";
  private isElectronDownloaded: boolean = false;
  // whether electron is downloading
  private isDownloading: boolean = false;
  // whether SOI is running
  private isRunning: boolean = false;
  // whether during the middle of start server
  private isStartingServer: boolean = false;
  // Port number will be changed if port isn't available
  private SOIPort: number = 8081;

  constructor() {
    this.runSOI = this.runSOI.bind(this);
    this.stopSOI = this.stopSOI.bind(this);
    let force = false;
    if (isFirstRun()) {
      // if it is first time run, then need to clean previous SOI
      force = true;
    }
    copyDefaultSOI(force);

    // setup event listener
    this.setUpEventListener();
  }

  private setUpEventListener() {
    // get SOI file content by path
    /*
     arg = {
       filePath
     }
     */
    ipcMainManager.on(IpcEvents.SYNC_SOI_GET_FILE_CONTENT, (event, arg) => {
      try {
        event.returnValue = {
          status: true,
          fileContent: getFileContent(arg.filePath)
        };
      } catch (err) {
        event.returnValue = {
          status: false
        };
      }
    });

    // update SOI file content
    /*
      arg = {
        filePath,
        fileContent
      }
     */
    ipcMainManager.on(IpcEvents.SYNC_SOI_UPDATE_FILE_CONTENT, (event, arg) => {
      try {
        updateFileContent(arg.filePath, arg.fileContent);
        event.returnValue = {
          status: true
        };
      } catch (err) {
        event.returnValue = {
          status: false
        };
      }
    });

     // reset SOI to default
     ipcMainManager.on(IpcEvents.SYNC_SOI_STATUS, event => {
      try {
        let status = this.status();
        event.returnValue = {
          status
        }
      } catch (err) {
        logger.error(`${IpcEvents.SYNC_SOI_STATUS} error: `, err);
        event.returnValue = {
          status:undefined,
          error: err
        };
      }
    });

    // reset SOI to default
    ipcMainManager.on(IpcEvents.SYNC_SOI_RESET_TO_DEFAULT, event => {
      try {
        copyDefaultSOI(true);
        event.returnValue = {
          status: true
        };
      } catch (err) {
        event.returnValue = {
          status: false
        };
      }
    });

    // reset stop SOI server
    ipcMainManager.on(IpcEvents.STOP_SOI_SERVER, event => {
      try {
        this.stopSOI();
      } catch (err) {
        logger.error(`${IpcEvents.STOP_SOI_SERVER} error: `, err);
      }
    });

    // reset start SOI server
    ipcMainManager.on(IpcEvents.START_SOI_SERVER, event => {
      try {
        this.runSOI();
      } catch (err) {
        logger.error(`${IpcEvents.START_SOI_SERVER} error: `, err);
      }
    });
  }

  /**
   * General setup, called with a version. Is called during construction
   * to ensure that we always have or download at least one version.
   *
   * @returns {Promise<void>}
   */
  public async setup(): Promise<boolean> {
    const version = this.version;
    const fs = await fancyImport<typeof fsType>("fs-extra");
    const { promisify } = await import("util");
    const eDownload = promisify(require("electron-download"));

    await fs.mkdirp(this.getDownloadPath());

    if (this.isDownloading) {
      logger.info(
        `SOIManager: Electron ${version} already downloading. please wait...`
      );
      return true;
    }

    if (await this.getIsDownloaded()) {
      logger.info(`SOIManager: Electron ${version} already downloaded.`);
      this.isDownloading = false;
      return true;
    }

    logger.info(`SOIManager: Electron ${version} not present, downloading`);
    this.isDownloading = true;

    // publish message to let SOI Editor know it is downloading electron
    ipcMainManager.sendToSOIEditor(IpcEvents.DOWNLOADING_ELECTRON, [
      { version, status: "downloading" }
    ]);
    const zipPath = await eDownload({ version });
    const extractPath = this.getDownloadPath();
    logger.info(
      `SOIManager: Electron ${version} downloaded, now unpacking to ${extractPath}`
    );
    this.isDownloading = false;
    try {
      // Ensure the target path is empty
      await fs.emptyDir(extractPath);
      const electronFiles = await this.unzip(zipPath, extractPath);
      logger.info(`Unzipped ${version}`, electronFiles);
      // update `isElectronDownloaded`
      await this.getIsDownloaded();
      ipcMainManager.sendToSOIEditor(IpcEvents.DOWNLOAD_ELECTRON_SUCCESS, [
        { version, status: "success" }
      ]);
      return true;
    } catch (error) {
      logger.error(`Failure while unzipping ${version}`, error);
      ipcMainManager.sendToSOIEditor(IpcEvents.DOWNLOAD_ELECTRON_FAIL, [
        { version, status: "fail", error }
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
    return path.join(USER_DATA_PATH, "electron-bin", this.version);
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
      logger.functionStart("SOIManager->unzip");
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
        logger.info(`SOIManager: Unpacked!`);
        process.noAsar = false;
        resolve();
        logger.functionEnd("SOIManager->unzip");
      });
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
      ipcMainManager.sendToSOIEditor(IpcEvents.SOI_CONSOLE_LOG, [logItem]);
    }
  }

  private async getAvailablePort(): Promise<number> {
    return new Promise((resolve, reject) => {
      detect(this.SOIPort, (err, port) => {
        if (err) {
          logger.error("getAvailablePort, error: ", err);
        }
        this.SOIPort = port;
        logger.debug(`${port} is avaialbe`);
        resolve(port);
      });
    });
  }

  public async runSOI(): Promise<void> {
    try {
      logger.functionStart("runSOI");
      if(this.isRunning){
        ipcMainManager.sendToSOIEditor(IpcEvents.STARTING_SOI_SERVER_SUCCESS, [
          {
            port: this.SOIPort,
            status: "success"
          }
        ]);
        return;
      }
      const SOI_PATH = getSOIPath();
      await this.setup();
      const binaryPath = this.getElectronBinaryPath();
      logger.debug(`elelctron binary path: ${binaryPath}`);
      logger.debug(`SOI_Path: ${SOI_PATH}`);
      // get an available port
      this.SOIPort = await this.getAvailablePort();
      ipcMainManager.sendToSOIEditor(IpcEvents.STARTING_SOI_SERVER, [
        {
          port: this.SOIPort,
          status: "star"
        }
      ]);
      const env = { ...process.env };
      env.PORT = this.SOIPort.toString();
      this.isStartingServer = true;

      this.soiProcess = spawn(binaryPath, [SOI_PATH, "--inspect"], {
        cwd: SOI_PATH,
        env
      });

      this.soiProcess.stdout!.on("data", data => {
        // logger.debug("======stdout: ", data.toString());
        this.publishLog(data);
      });
      this.soiProcess.stderr!.on("data", data => {
        // logger.debug("******stderr: ", data.toString());
        this.publishLog(data);
      });
      this.soiProcess.on("close", async code => {
        const withCode =
          typeof code === "number" ? ` with code ${code.toString()}.` : `.`;
        logger.debug(withCode);
        this.publishLog(withCode);
        this.soiProcess = null;
        ipcMainManager.sendToSOIEditor(IpcEvents.STOPPING_SOI_SERVER_SUCCESS, [
          {
            port: this.SOIPort,
            status: "success"
          }
        ]);
      });
      this.isStartingServer = false;
      this.isRunning = true;
      ipcMainManager.sendToSOIEditor(IpcEvents.STARTING_SOI_SERVER_SUCCESS, [
        {
          port: this.SOIPort,
          status: "success"
        }
      ]);
      logger.functionEnd("runSOI");
    } catch (err) {
      this.isStartingServer = false;
      this.isRunning = false;
      logger.error("runSOI error: ", err);
      ipcMainManager.sendToSOIEditor(IpcEvents.STARTING_SOI_SERVER_FAIL, [
        {
          port: this.SOIPort,
          status: "fail",
          error: err
        }
      ]);
      throw err;
    }
  }

  public async stopSOI() {
    try {
      ipcMainManager.sendToSOIEditor(IpcEvents.STOPPING_SOI_SERVER, [
        {
          port: this.SOIPort,
          status: "stopping"
        }
      ]);
      if (this.soiProcess) {
        this.soiProcess.kill();
        ipcMainManager.sendToSOIEditor(IpcEvents.STOPPING_SOI_SERVER_SUCCESS, [
          {
            port: this.SOIPort,
            status: "success"
          }
        ]);
      }
      this.isRunning = false;
    } catch (err) {
      ipcMainManager.sendToSOIEditor(IpcEvents.STOPPING_SOI_SERVER_FAIL, [
        {
          port: this.SOIPort,
          status: "fail",
          error: err
        }
      ]);
    }
  }

  /**
   * Get default SOI status
   */
  public status() {
    return {
      isElectronDownloaded: this.isElectronDownloaded,
      isDownloading: this.isDownloading,
      isRunning: this.isRunning,
      isStartingServer: this.isStartingServer,
      SOIPort: this.SOIPort
    }
  }
}

export default new SOIManager();
