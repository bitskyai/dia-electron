import { getPreferencesJSON, updateProcessEnvs } from "../main/preferences";
import { startServer, stopServer } from "../agents-service/server.js";
import logger from "./logger";
import { getAvailablePort } from "./index";

class ServiceAgent {
  public port: number = 8091;
  constructor() {}

  public async start(configs, expressOptions, indexOptions) {
    try {
      const preferences = getPreferencesJSON();
      updateProcessEnvs(preferences);

      this.port = await getAvailablePort(configs.PORT);
      configs.PORT = this.port;
      logger.info(`service agent port: ${this.port} `);
      // start
      await startServer(configs, expressOptions, indexOptions);
    } catch (err) {
      throw err;
    }
  }

  public async restart(configs, expressOptions, indexOptions) {
    try {
      this.stop();
      this.start(configs, expressOptions, indexOptions);
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

export default new ServiceAgent();
