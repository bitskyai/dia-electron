/**
 * Default SOI File Manager, it provides following features:
 * 1. Copy default SOI to app.getPath('userData')
 * 2. Reset SOI to default SOI
 * 3. Get file structures
 * 4. CRUD file content
 */
import * as fs from "fs-extra";
import { app, remote } from "electron";
import * as path from "path";
import logger from "./logger";
import { copyFolderRecursiveSync } from "./index";

const getSOIParentFolderPath = () => {
  try {
    return path.join(app.getPath("userData"));
  } catch (err) {
    return path.join(remote.app.getPath("userData"));
  }
};
// const SOI_PARENT_FOLDER_PATH = path.join(app.getPath("userData"));
export const SOI_CONFIG_JSON_NAME = "config.json";
// Default SOI Folder Name
export const SOI_FOLDER_NAME = "soi";
// export const SOI_PATH = path.join(getSOIParentFolderPath(), SOI_FOLDER_NAME);
export const getSOIPath = () => {
  return path.join(getSOIParentFolderPath(), SOI_FOLDER_NAME);
};

export function copyDefaultSOI(force?: boolean): Boolean | Error {
  try {
    logger.functionStart("copyDefaultSOI");
    // always update config.json, so when user change application path, still works fine
    writeConfigJson({
      additionalNodePath: [path.join(__dirname, "../../../node_modules")]
    });
    const SOI_PARENT_FOLDER_PATH = getSOIParentFolderPath();
    const SOI_PATH = getSOIPath();
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
    const SOI_PATH = getSOIPath();
    const configJSONPath = path.join(SOI_PATH, "./src", SOI_CONFIG_JSON_NAME);
    logger.debug("SOI Config JSON Path: ", configJSONPath);
    logger.debug("Config JSON: ", data);
    fs.writeJsonSync(configJSONPath, data || {});
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
export function getFileContent(filePath: string):string {
  logger.functionStart("getFileContent");
  try {
    const fileFullPath = path.join(getSOIPath(), filePath);
    logger.debug('fileFullPath: ', fileFullPath);
    if(fs.existsSync(fileFullPath)){
      logger.functionEnd('getFileContent');
      return fs.readFileSync(fileFullPath, "utf8");
    }
    throw new Error(`getFileContent ${fileFullPath} doesn't exist`);
  } catch (err) {
    logger.error('getFileContent error: ', err);
    logger.functionEnd('getFileContent');
    throw err;
  }
}

/**
 * Update specific file content
 * @param {string} filePath - Relative path of file in SOI folder
 * @param {string} content - content need to update
 * @returns {boolean}
 */
export function updateFileContent(filePath:string, content:string){
  logger.functionStart("copyDefaultSOI");
  try{
    const fileFullPath = path.join(getSOIPath(), filePath);
    logger.debug('fileFullPath: ', fileFullPath);
    if(fs.existsSync(fileFullPath)){
      logger.functionEnd('updateFileContent');
      return fs.writeFileSync(fileFullPath, content, "utf8");
    }
    throw new Error(`updateFileContent ${fileFullPath} doesn't exist`);
  }catch(err){
    logger.error('updateFileContent error: ', err);
    logger.functionEnd('copyDefaultSOI');
    throw err;
  }
}
