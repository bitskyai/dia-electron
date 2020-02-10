// preferences settings only support main process
import * as fs from "fs-extra";
import logger from "../utils/logger";
import {
  DEFAULT_SQLITE_DB_CONFIG,
  DEFAULT_MONGODB_CONFIG,
  LOG_FILES_PATH,
  PREFERENCES_JSON_PATH
} from "../utils/constants";
import { Preferences } from "../interfaces";

/**
 * Get preferences JSON, if this JSON file doesn't exist, then return default prefrences and write to disk
 * @returns {Preferences}
 */
export function getPreferencesJSON(): Preferences {
  try {
    let preferencesJSON: Preferences;
    // if file exist then return
    if (fs.existsSync(PREFERENCES_JSON_PATH)) {
      preferencesJSON = fs.readJSONSync(PREFERENCES_JSON_PATH);
    } else {
      // if doesn't exist then return default preferences
      preferencesJSON = getDefaultPreferences();
      // And write to disk async
      fs.outputJSON(PREFERENCES_JSON_PATH, preferencesJSON, err => {
        if (err) {
          logger.error(
            "Output preferences JSON fail. Path: ",
            PREFERENCES_JSON_PATH,
            "Preference JSON: ",
            preferencesJSON,
            "Error: ",
            err
          );
        } else {
          logger.info(
            "getPreferencesJSON-> Output preferences JSON successful. Path: ",
            PREFERENCES_JSON_PATH,
            "Preference JSON: ",
            preferencesJSON
          );
        }
      });
    }

    return preferencesJSON;
  } catch (err) {
    logger.error("getPreferencesJSON fail, error: ", err);
    throw err;
  }
}

/**
 * Update preferences json to process envs.
 * All properties in preferences json will be used as environment variable name
 * @param preferencesJSON
 * @returns {boolean} - true: successful, otherwise will throw an exception
 */
export function updateProcessEnvs(preferencesJSON: Preferences): boolean {
  try {
    for (let key in preferencesJSON) {
      if (preferencesJSON.hasOwnProperty(key)) {
        process.env[key.toUpperCase()] = preferencesJSON[key];
        logger.debug(`process.env.${key.toUpperCase()}: `, preferencesJSON[key]);
      }
    }
    return true;
  } catch (err) {
    logger.error("updateProcessEnvs failed. Error: ", err);
    throw err;
  }
}

/**
 * Update current preferences. Passed preferences JSON will be merged with currently preferences
 * @param preferencesJSON {object}
 * @returns true
 */
export function updatePreferencesJSON(preferencesJSON: Preferences): true {
  try {
    let curPreferencesJSON = getPreferencesJSON();
    // preferencesJSON = _.merge(curPreferencesJSON, preferencesJSON, {
    //   version: curPreferencesJSON.version
    // });
    preferencesJSON = {
      ...curPreferencesJSON,
      ...preferencesJSON,
      ...{ version: curPreferencesJSON.version }
    };
    preferencesJSON = cleanPreferences(preferencesJSON);
    fs.outputJSONSync(PREFERENCES_JSON_PATH, preferencesJSON);
    return true;
  } catch (err) {
    logger.error(
      "updatePreferencesJSON-> Output preferences JSON fail. Path: ",
      PREFERENCES_JSON_PATH,
      "Preference JSON: ",
      preferencesJSON,
      "Error: ",
      err
    );
    throw err;
  }
}

// Get default prefences
export function getDefaultPreferences(): Preferences {
  return {
    ...DEFAULT_SQLITE_DB_CONFIG,
    LOG_FILES_PATH,
    version: "1.0.0"
  };
}

export function getDefaultDBsConfig() {
  return {
    sqlite: DEFAULT_SQLITE_DB_CONFIG,
    mongodb: DEFAULT_MONGODB_CONFIG
  };
}

/**
 * remove unnecessary field
 * @param prefences 
 */
export function cleanPreferences(prefences):any {
  if (prefences.TYPEORM_CONNECTION === "mongodb") {
    delete prefences.TYPEORM_DATABASE;
  } else if (prefences.TYPEORM_CONNECTION === "sqlite") {
    delete prefences.TYPEORM_URL;
  }
  return prefences;
}
