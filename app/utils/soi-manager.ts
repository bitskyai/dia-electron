// import * as fsType from "fs-extra";
import * as path from "path";
import { ChildProcess, spawn } from "child_process";
import { copyDefaultSOI, SOI_PATH } from "./soi-file-manager";
import { isFirstRun } from "./check-first-run";
import logger from "./logger";

class SOIManager {
  public soiProcess: ChildProcess | null = null;

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

  public getElectronBinaryPath(): string {
    const base = path.join(
      __dirname,
      "../../../",
      "./node_modules/electron/dist"
    );
    switch (process.platform) {
      case "darwin":
        return path.join(base, "Electron.app/Contents/MacOS/Electron");
      case "freebsd":
      case "linux":
        return path.join(base, "electron");
      case "win32":
        return path.join(base, "electron.exe");
      default:
        throw new Error(
          `Electron builds are not available for ${process.platform}`
        );
    }
  }

  public async runSOI(): Promise<void> {
    try {
      logger.functionStart("runSOI");
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
      logger.error('runSOI error: ',err);
    }
  }

  public async stopSOI() {
    if (this.soiProcess) {
      this.soiProcess.kill();
    }
  }
}

export default new SOIManager();
