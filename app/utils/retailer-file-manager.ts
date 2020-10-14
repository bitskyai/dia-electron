/**
 * Default Retailer File Manager, it provides following features:
 * 1. Copy default Retailer to app.getPath('home')
 * 2. Reset Retailer to default Retailer
 * 3. Get file structures
 * 4. CRUD file content
 */
import * as fs from "fs-extra";
import * as path from "path";
import logger from "./logger";
import { copyFolderRecursiveSync } from "./index";
import { BITSKY_HOME_FOLDER, DEFAULT_RETAILER_SERVICE_FOLDER } from "./constants";

export const RETAILER_CONFIG_JSON_NAME = "utils/additionalNodeModules.json";
export const getRetailerPath = () => {
  return path.join(BITSKY_HOME_FOLDER, DEFAULT_RETAILER_SERVICE_FOLDER);
};

export function copyDefaultRetailer(force?: boolean): Boolean | Error {
  try {
    logger.functionStart("copyDefaultRetailer");
    const RETAILER_PATH = getRetailerPath();
    // Path to
    const defaultRetailerPath = path.join(
      __dirname,
      "..",
      DEFAULT_RETAILER_SERVICE_FOLDER
    );
    logger.debug("defaultRetailerPath: ", defaultRetailerPath);
    logger.debug("RETAILER_PATH: ", RETAILER_PATH);
    if (fs.existsSync(RETAILER_PATH)) {
      if (!force) {
        logger.debug(
          `All ready has ${DEFAULT_RETAILER_SERVICE_FOLDER} in ${BITSKY_HOME_FOLDER}, and don't force clean folder, so return`
        );
        return true;
      }
    }
    copyFolderRecursiveSync(defaultRetailerPath, BITSKY_HOME_FOLDER, force);
    writeConfigJson();
    logger.functionEnd("copyDefaultRetailer");
    return true;
  } catch (err) {
    logger.error("copyDefaultRetailer error: ", err);
    return false;
  }
}

export function writeConfigJson(data?: object) {
  try {
    logger.functionStart("writeConfigJson");
    const RETAILER_PATH = getRetailerPath();
    const configJSONPath = path.join(RETAILER_PATH, RETAILER_CONFIG_JSON_NAME);
    logger.debug("Retailer Config JSON Path: ", configJSONPath);
    logger.debug("Config JSON: ", data);
    if (!data) {
      data = {
        additionalNodePath: [
          path.join(RETAILER_PATH, "node_modules"),
          path.join(__dirname, "../../../node_modules"),
        ],
      };
    }
    fs.ensureFileSync(configJSONPath);
    fs.writeJsonSync(configJSONPath, data || {}, { spaces: 2 });
    logger.functionEnd("writeConfigJson");
    return true;
  } catch (err) {
    logger.error("writeConfigJson error: ", err);
    return false;
  }
}

/**
 * Get content of a specific file
 * @param {string} filePath - Relative path of file in Retailer folder
 * @returns {string}
 */
export function getFileContent(filePath: string): string {
  logger.functionStart("getFileContent");
  try {
    const fileFullPath = path.join(getRetailerPath(), filePath);
    logger.debug("fileFullPath: ", fileFullPath);
    if (fs.existsSync(fileFullPath)) {
      logger.functionEnd("getFileContent");
      return fs.readFileSync(fileFullPath, "utf8");
    }
    throw new Error(`getFileContent ${fileFullPath} doesn't exist`);
  } catch (err) {
    logger.error("getFileContent error: ", err);
    logger.functionEnd("getFileContent");
    throw err;
  }
}

/**
 * Update specific file content
 * @param {string} filePath - Relative path of file in Retailer folder
 * @param {string} content - content need to update
 * @returns {boolean}
 */
export function updateFileContent(filePath: string, content: string) {
  logger.functionStart("copyDefaultRetailer");
  try {
    const fileFullPath = path.join(getRetailerPath(), filePath);
    logger.debug("fileFullPath: ", fileFullPath);
    if (fs.existsSync(fileFullPath)) {
      logger.functionEnd("updateFileContent");
      return fs.writeFileSync(fileFullPath, content, "utf8");
    }
    throw new Error(`updateFileContent ${fileFullPath} doesn't exist`);
  } catch (err) {
    logger.error("updateFileContent error: ", err);
    logger.functionEnd("copyDefaultRetailer");
    throw err;
  }
}
