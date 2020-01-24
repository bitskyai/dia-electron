// Main Process
import * as fsType from "fs-extra";
import * as path from "path";
import { ChildProcess, spawn } from "child_process";
import { fancyImport } from "./import";
import { copyDefaultSOI, getSOIPath } from "./soi-file-manager";
import { CONFIG_PATH } from "./constants";
import { isFirstRun } from "./check-first-run";
import logger from "./logger";
import { IpcEvents } from "../ipc-events";
import { ipcMainManager } from "../main/ipc";
import { LogItem } from "../interfaces";
import { getAvailablePort } from "./index";
import { SOI_CHECK_TIMEOUT } from "./constants";

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
  // whether during the middle of stop server
  private isStoppingServer: boolean = false;
  // Port number isStoppingServer be changed if port isn't available
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
    let status = await this.status();
    if (this.isDownloading) {
      logger.info(
        `SOIManager: Electron ${version} already downloading. please wait...`
      );
      ipcMainManager.sendToSOIEditor(IpcEvents.DOWNLOADING_ELECTRON, [
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
      logger.info(`SOIManager: Electron ${version} already downloaded.`);
      this.isDownloading = false;
      ipcMainManager.sendToSOIEditor(IpcEvents.DOWNLOAD_ELECTRON_SUCCESS, [
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

    logger.info(`SOIManager: Electron ${version} not present, downloading`);
    // start downloading electron
    this.isDownloading = true;
    // publish message to let SOI Editor know it is downloading electron
    ipcMainManager.sendToSOIEditor(IpcEvents.DOWNLOADING_ELECTRON, [
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
        `SOIManager: Electron ${version} downloaded, now unpacking to ${extractPath}`
      );
      // Ensure the target path is empty
      await fs.emptyDir(extractPath);
      const electronFiles = await this.unzip(zipPath, extractPath);
      logger.info(`Unzipped ${version}`, electronFiles);
      this.isDownloading = false;
      // update `isElectronDownloaded`
      status = await this.status();
      if (this.isElectronDownloaded) {
        // if isDownloaded is true, then successfully download
        ipcMainManager.sendToSOIEditor(IpcEvents.DOWNLOAD_ELECTRON_SUCCESS, [
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
        ipcMainManager.sendToSOIEditor(IpcEvents.DOWNLOAD_ELECTRON_FAIL, [
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
      let status = await this.status();
      ipcMainManager.sendToSOIEditor(IpcEvents.DOWNLOAD_ELECTRON_FAIL, [
        {
          status: "fail",
          payload: {
            status,
            version,
            error
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
    return path.join(CONFIG_PATH, "electron-bin", this.version);
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
   * check whether a SOI start successful or not
   */
  public async checkWhetherStartSOISuccessful() {
    return new Promise((resolve, reject) => {
      // if port number isn't available, then means start successfully, otherwise need to continue to wait until timeout
      let startTimestamp = Date.now();
      const checkHandler = setInterval(async () => {
        let port = await getAvailablePort(this.SOIPort);
        if (port !== this.SOIPort) {
          // then means start successful
          resolve(true);
          clearInterval(checkHandler);
          return;
        }
        // check whether timeout
        if (Date.now() - startTimestamp > SOI_CHECK_TIMEOUT) {
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
      ipcMainManager.sendToSOIEditor(IpcEvents.SOI_CONSOLE_LOG, [logItem]);
    }
  }

  private async getAvailablePort(): Promise<number> {
    this.SOIPort = await getAvailablePort(this.SOIPort);
    return this.SOIPort;
  }

  public async runSOI(): Promise<void> {
    try {
      logger.functionStart("runSOI");
      this.isStartingServer = true;
      let status = await this.status();
      if (this.isRunning) {
        ipcMainManager.sendToSOIEditor(IpcEvents.STARTING_SOI_SERVER_SUCCESS, [
          {
            status: "success",
            payload: {
              status
            }
          }
        ]);
        return;
      }
      const SOI_PATH = getSOIPath();
      await this.downloadElectron();
      const binaryPath = this.getElectronBinaryPath();
      logger.debug(`elelctron binary path: ${binaryPath}`);
      logger.debug(`SOI_Path: ${SOI_PATH}`);
      // get an available port
      this.SOIPort = await this.getAvailablePort();
      status = await this.status();
      ipcMainManager.sendToSOIEditor(IpcEvents.STARTING_SOI_SERVER, [
        {
          status: "starting",
          payload: {
            status
          }
        }
      ]);
      const env = { ...process.env };
      env.PORT = this.SOIPort.toString();

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
        status = await this.status();
        ipcMainManager.sendToSOIEditor(IpcEvents.STOPPING_SOI_SERVER_SUCCESS, [
          {
            status: "success",
            payload: {
              status
            }
          }
        ]);
      });
      const success = await this.checkWhetherStartSOISuccessful();
      this.isStartingServer = false;
      if (success) {
        this.isRunning = true;
        status = await this.status();
        ipcMainManager.sendToSOIEditor(IpcEvents.STARTING_SOI_SERVER_SUCCESS, [
          {
            status: "success",
            payload: {
              status
            }
          }
        ]);
      } else {
        this.isRunning = false;
        await this.stopSOI();
        status = await this.status();
        ipcMainManager.sendToSOIEditor(IpcEvents.STARTING_SOI_SERVER_FAIL, [
          {
            status: "fail",
            payload: {
              status
            }
          }
        ]);
      }
      logger.functionEnd("runSOI");
    } catch (err) {
      this.isStartingServer = false;
      this.isRunning = false;
      await this.stopSOI();
      logger.error("runSOI error: ", err);
      let status = await this.status();
      ipcMainManager.sendToSOIEditor(IpcEvents.STARTING_SOI_SERVER_FAIL, [
        {
          status: "fail",
          payload: {
            status,
            error: err
          }
        }
      ]);
      throw err;
    }
  }

  public async stopSOI() {
    try {
      this.isStoppingServer = true;
      let status = await this.status();
      ipcMainManager.sendToSOIEditor(IpcEvents.STOPPING_SOI_SERVER, [
        {
          status: "stopping",
          payload: {
            status
          }
        }
      ]);

      if (this.soiProcess) {
        this.soiProcess.kill();
        this.isRunning = false;
        this.isStoppingServer = false;
        status = await this.status();
        ipcMainManager.sendToSOIEditor(IpcEvents.STOPPING_SOI_SERVER_SUCCESS, [
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
      let status = await this.status();
      ipcMainManager.sendToSOIEditor(IpcEvents.STOPPING_SOI_SERVER_FAIL, [
        {
          status: "fail",
          payload: {
            status,
            error: err
          }
        }
      ]);
    }
  }

  /**
   * Get default SOI status
   */
  public async status() {
    // check whether isn't downloaded
    await this.getIsDownloaded();
    return {
      isElectronDownloaded: this.isElectronDownloaded,
      // after init, will not change
      SOIPort: this.SOIPort,
      // following is in-memory status
      isDownloading: this.isDownloading,
      isRunning: this.isRunning,
      isStartingServer: this.isStartingServer,
      isStoppingServer: this.isStoppingServer
    };
  }
}

export default new SOIManager();
