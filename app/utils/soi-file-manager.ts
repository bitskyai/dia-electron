/**
 * Default SOI File Manager, it provides following features:
 * 1. Copy default SOI to app.getPath('home')
 * 2. Reset SOI to default SOI
 * 3. Get file structures
 * 4. CRUD file content
 */
import * as fs from "fs-extra";
import * as path from "path";
import logger from "./logger";
import { copyFolderRecursiveSync } from "./index";
import { MUNEW_HOME_FOLDER, DEFAULT_ANALYST_SERVICE_FOLDER } from "./constants";

export const SOI_CONFIG_JSON_NAME = "utils/additionalNodeModules.json";
export const getSOIPath = () => {
  return path.join(MUNEW_HOME_FOLDER, DEFAULT_ANALYST_SERVICE_FOLDER);
};

export function copyDefaultSOI(force?: boolean): Boolean | Error {
  try {
    logger.functionStart("copyDefaultSOI");
    const SOI_PATH = getSOIPath();
    // Path to
    const defaultSOIPath = path.join(
      __dirname,
      "..",
      DEFAULT_ANALYST_SERVICE_FOLDER
    );
    logger.debug("defaultSOIPath: ", defaultSOIPath);
    logger.debug("SOI_PATH: ", SOI_PATH);
    if (fs.existsSync(SOI_PATH)) {
      if (!force) {
        logger.debug(
          `All ready has ${DEFAULT_ANALYST_SERVICE_FOLDER} in ${MUNEW_HOME_FOLDER}, and don't force clean folder, so return`
        );
        return true;
      }
    }
    copyFolderRecursiveSync(defaultSOIPath, MUNEW_HOME_FOLDER, force);
    writeConfigJson();
    logger.functionEnd("copyDefaultSOI");
    return true;
  } catch (err) {
    logger.error("copyDefaultSOI error: ", err);
    return false;
  }
}

export function writeConfigJson(data?: object) {
  try {
    logger.functionStart("writeConfigJson");
    const SOI_PATH = getSOIPath();
    const configJSONPath = path.join(SOI_PATH, SOI_CONFIG_JSON_NAME);
    logger.debug("SOI Config JSON Path: ", configJSONPath);
    logger.debug("Config JSON: ", data);
    if (!data) {
      data = {
        additionalNodePath: [
          path.join(SOI_PATH, "node_modules"),
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
 * @param {string} filePath - Relative path of file in SOI folder
 * @returns {string}
 */
export function getFileContent(filePath: string): string {
  logger.functionStart("getFileContent");
  try {
    const fileFullPath = path.join(getSOIPath(), filePath);
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
 * @param {string} filePath - Relative path of file in SOI folder
 * @param {string} content - content need to update
 * @returns {boolean}
 */
export function updateFileContent(filePath: string, content: string) {
  logger.functionStart("copyDefaultSOI");
  try {
    const fileFullPath = path.join(getSOIPath(), filePath);
    logger.debug("fileFullPath: ", fileFullPath);
    if (fs.existsSync(fileFullPath)) {
      logger.functionEnd("updateFileContent");
      return fs.writeFileSync(fileFullPath, content, "utf8");
    }
    throw new Error(`updateFileContent ${fileFullPath} doesn't exist`);
  } catch (err) {
    logger.error("updateFileContent error: ", err);
    logger.functionEnd("copyDefaultSOI");
    throw err;
  }
}
