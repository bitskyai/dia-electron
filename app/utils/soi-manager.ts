import * as fsType from "fs-extra";
import * as path from "path";
import { ChildProcess, spawn } from "child_process";
import { fancyImport } from "./import";
import { copyDefaultSOI, getSOIPath } from "./soi-file-manager";
import { USER_DATA_PATH } from "./constants";
import { isFirstRun } from "./check-first-run";
import logger from "./logger";

class SOIManager {
  public soiProcess: ChildProcess | null = null;
  public version: string = "7.1.2";
  // whether electron is downloading
  private isDownloading: boolean = false;

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
   * General setup, called with a version. Is called during construction
   * to ensure that we always have or download at least one version.
   *
   * @returns {Promise<void>}
   */
  public async setup(): Promise<void> {
    const version = this.version;
    const fs = await fancyImport<typeof fsType>("fs-extra");
    const { promisify } = await import("util");
    const eDownload = promisify(require("electron-download"));

    await fs.mkdirp(this.getDownloadPath(version));

    if (this.isDownloading) {
      logger.info(
        `SOIManager: Electron ${version} already downloading. please wait...`
      );
      return;
    }

    if (await this.getIsDownloaded(version)) {
      logger.info(`SOIManager: Electron ${version} already downloaded.`);
      this.isDownloading = false;
      return;
    }

    logger.info(`SOIManager: Electron ${version} not present, downloading`);
    this.isDownloading = true;

    const zipPath = await eDownload({ version });
    const extractPath = this.getDownloadPath(version);
    logger.info(
      `SOIManager: Electron ${version} downloaded, now unpacking to ${extractPath}`
    );

    try {
      // Ensure the target path is empty
      await fs.emptyDir(extractPath);

      const electronFiles = await this.unzip(zipPath, extractPath);
      logger.info(`Unzipped ${version}`, electronFiles);
    } catch (error) {
      logger.error(`Failure while unzipping ${version}`, error);

      // TODO: Handle this case
    }
    this.isDownloading = false;
  }

  /**
   * Did we already download a given version?
   *
   * @param {string} version
   * @param {string} dir
   * @returns {boolean}
   */
  public async getIsDownloaded(
    version: string,
    dir?: string
  ): Promise<boolean> {
    const expectedPath = this.getElectronBinaryPath(version, dir);
    const fs = await fancyImport<typeof fsType>("fs-extra");

    return fs.existsSync(expectedPath);
  }

  /**
   * Gets the expected path for a given Electron version
   *
   * @param {string} version
   * @returns {string}
   */
  private getDownloadPath(version: string = this.version): string {
    return path.join(USER_DATA_PATH, "electron-bin", version);
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
      logger.functionStart('SOIManager->unzip');
      const extract = (await fancyImport<any>("extract-zip"));
      logger.debug('zipPath: ', zipPath);
      logger.debug('extractPath: ', extractPath);
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
        logger.functionEnd('SOIManager->unzip');
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
  public getElectronBinaryPath(
    version: string = this.version,
    dir: string = this.getDownloadPath(version)
  ): string {
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

  public async runSOI(): Promise<void> {
    try {
      logger.functionStart("runSOI");
      const SOI_PATH = getSOIPath();
      await this.setup();
      const binaryPath = this.getElectronBinaryPath();
      logger.debug(`elelctron binary path: ${binaryPath}`);
      logger.debug(`SOI_Path: ${SOI_PATH}`);
      const env = { ...process.env };
      this.soiProcess = spawn(binaryPath, [SOI_PATH, "--inspect"], {
        cwd: SOI_PATH,
        env
      });

      this.soiProcess.stdout!.on("data", data => logger.debug(data.toString()));
      this.soiProcess.stderr!.on("data", data => logger.debug(data.toString()));
      this.soiProcess.on("close", async code => {
        const withCode =
          typeof code === "number" ? ` with code ${code.toString()}.` : `.`;
        logger.debug(withCode);
        this.soiProcess = null;
      });
      logger.functionEnd("runSOI");
    } catch (err) {
      logger.error("runSOI error: ", err);
    }
  }

  public async stopSOI() {
    if (this.soiProcess) {
      this.soiProcess.kill();
    }
  }
}

export default new SOIManager();
