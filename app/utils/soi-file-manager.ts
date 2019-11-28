/**
 * Default SOI File Manager, it provides following features:
 * 1. Copy default SOI to app.getPath('userData')
 * 2. Reset SOI to default SOI
 * 3. Get file structures
 * 4. CRUD file content
 */
import * as fs from "fs-extra";
import { app } from "electron";
import * as path from "path";
import logger from "./logger";
import { copyFolderRecursiveSync } from "./index";

const SOI_PARENT_FOLDER_PATH = path.join(app.getPath("userData"));
const SOI_CONFIG_JSON_NAME = "config.json";
// Default SOI Folder Name
export const SOI_FOLDER_NAME = "soi";
export const SOI_PATH = path.join(SOI_PARENT_FOLDER_PATH, SOI_FOLDER_NAME);

export function copyDefaultSOI(force?: boolean): Boolean | Error {
  try {
    logger.functionStart("copyDefaultSOI");
    // Path to
    const defaultSOIPath = path.join(__dirname, "..", SOI_FOLDER_NAME);
    logger.debug("defaultSOIPath: ", defaultSOIPath);
    logger.debug("SOI_PATH: ", SOI_PATH);
    if (fs.existsSync(SOI_PATH)) {
      if (!force) {
        logger.debug(
          `All ready has ${SOI_FOLDER_NAME} in ${SOI_PARENT_FOLDER_PATH}, and don't force clean folder, so return`
        );
        return true;
      }
    }
    copyFolderRecursiveSync(defaultSOIPath, SOI_PARENT_FOLDER_PATH, force);
    writeConfigJson({
      additionalNodePath: [
        path.join(__dirname, '../../../node_modules')
      ]
    });
    logger.functionEnd("copyDefaultSOI");
    return true;
  } catch (err) {
    logger.error("copyDefaultSOI error: ", err);
    return false;
  }
}

export function writeConfigJson(data: object) {
  try {
    logger.functionStart("writeConfigJson");
    const configJSONPath = path.join(SOI_PATH, "./src", SOI_CONFIG_JSON_NAME);
    logger.debug("SOI Config JSON Path: ", configJSONPath);
    logger.debug("Config JSON: ", data);
    fs.writeJsonSync(configJSONPath, data||{});
    logger.functionEnd("writeConfigJson");
    return true;
  } catch (err) {
    logger.error("writeConfigJson error: ", err);
    return false;
  }
}
