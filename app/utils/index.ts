import * as fs from "fs-extra";
import * as path from "path";
import logger from "./logger";

/**
 * Sync Copy File
 * @param {string} source: path to the file that want to be copied
 * @param {string} target: path to the file want to be copied to. If target is a directory, then a file will be created under target directory.
 *
 * @returns {boolean}: true means copy successfully, false means copy failed
 */
export function copyFileSync(source: string, target: string): boolean {
  try {
    logger.functionStart("copyFileSync");
    logger.debug("source: ", source);
    logger.debug("target: ", target);

    let targetFile = target;
    //if target is a directory a new file with the same name will be created
    if (fs.existsSync(target)) {
      // when target is a directory
      if (fs.lstatSync(target).isDirectory()) {
        targetFile = path.join(target, path.basename(source));
        logger.debug(
          "*target* is a directory, will create a file under *target* directory. new *target*: ",
          targetFile
        );
      }
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
    logger.functionEnd("copyFileSync");
    return true;
  } catch (err) {
    logger.error("copyFileSync error: ", err);
    return false;
  }
}

export function copyFolderRecursiveSync(
  source: string,
  target: string,
  cleanFolder?: boolean
): boolean {
  try {
    logger.functionStart("copyFolderRecursiveSync");
    logger.debug("source: ", source);
    logger.debug("target: ", target);

    // if source is directory
    if (fs.lstatSync(source).isDirectory()) {
      let files: Array<string> = [];
      //check if folder needs to be created or integrated
      let targetFolder = path.join(target, path.basename(source));
      if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder);
        logger.debug(
          "*target* directory doesn't, create *target* directory - ",
          targetFolder
        );
      } else {
        // if need to clean target folder
        if (cleanFolder) {
          fs.removeSync(targetFolder);
          fs.mkdirSync(targetFolder);
          logger.debug(
            `Clean and create *target(${targetFolder})* directory successful`
          );
        }
      }
      files = fs.readdirSync(source);
      files.forEach(function(file) {
        var curSource = path.join(source, file);
        if (fs.lstatSync(curSource).isDirectory()) {
          copyFolderRecursiveSync(curSource, targetFolder);
        } else {
          copyFileSync(curSource, targetFolder);
        }
      });
    }else{
      // if not a directory, then it is a file, so direct copy file
      copyFileSync(source, target);
      logger.debug('*source* is a file, not a directory, so directly copy source file to target');
    }

    logger.functionEnd("copyFolderRecursiveSync");
    return true;
  } catch (err) {
    logger.error("copyFolderRecursiveSync error: ", err);
    return false;
  }
}
