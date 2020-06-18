// preferences settings only support main process
import * as fs from "fs-extra";
import * as path from "path";
import * as _ from "lodash";
import { v4 as uuidv4 } from "uuid";
import logger from "../utils/logger";
import {
  DEFAULT_SQLITE_DB_CONFIG,
  DEFAULT_MONGODB_CONFIG,
  LOG_FILES_PATH,
  PREFERENCES_JSON_PATH,
} from "../utils/constants";
import { LogLevel } from "../interfaces";
import { MUNEW_HOME_FOLDER } from "../utils/constants";
import {
  Preferences,
  HeadlessAgentPreference,
  BaseAgentPreference,
} from "../interfaces";

/**
 * Get preferences JSON, if this JSON file doesn't exist, then return default prefrences and write to disk
 * @returns {Preferences}
 */
export function getPreferencesJSON(): Preferences {
  try {
    const defaultPreferencesJSON = getDefaultPreferences();
    // if doesn't exist then return default preferences
    let preferencesJSON: Preferences;
    let mergedPreferencesJSON: Preferences;
    // if file exist then return
    fs.ensureFileSync(PREFERENCES_JSON_PATH);
    preferencesJSON = fs.readJSONSync(PREFERENCES_JSON_PATH);
    mergedPreferencesJSON = _.merge({}, defaultPreferencesJSON, preferencesJSON);
    if (_.get(mergedPreferencesJSON, "TYPEORM_CONNECTION") === "mongodb") {
      delete mergedPreferencesJSON.TYPEORM_DATABASE;
    }

    if(!(_.isEqual(preferencesJSON, mergedPreferencesJSON))){
      // if merged preferences isn't same with preferences get from local, need to update
      // 1. maybe we change the default perferences
      console.log('===preferencesJSON: ');
      console.log(preferencesJSON);

      console.log('===mergedPreferencesJSON: ');
      console.log(mergedPreferencesJSON);
      fs.writeJSONSync(PREFERENCES_JSON_PATH, mergedPreferencesJSON);
      logger.info(
        "getPreferencesJSON-> Output preferences JSON successful. Path: ",
        PREFERENCES_JSON_PATH,
        "Preference JSON: ",
        mergedPreferencesJSON
      );
    }

    return mergedPreferencesJSON;
  } catch (err) {
    logger.error("getPreferencesJSON fail, error: ", err);
    throw err;
  }
}

export function getHeadlessAgentPreferencesJSON(): HeadlessAgentPreference {
  try {
    let preferencesJSON = getPreferencesJSON();
    return _.get(preferencesJSON, "HEADLESS_AGENT");
  } catch (err) {
    logger.error("getHeadlessAgentPreferencesJSON fail, error: ", err);
    throw err;
  }
}

export function updateHeadlessAgentPreferencesJSON(
  headlessJSON: HeadlessAgentPreference
): Object {
  try {
    return updatePreferencesJSON({
      HEADLESS_AGENT: headlessJSON,
    });
  } catch (err) {
    logger.error("updateHeadlessAgentPreferencesJSON fail, error: ", err);
    throw err;
  }
}

export function getServiceAgentPreferencesJSON(): BaseAgentPreference {
  try {
    let preferencesJSON = getPreferencesJSON();
    return _.get(preferencesJSON, "SERVICE_AGENT");
  } catch (err) {
    logger.error("getServiceAgentPreferencesJSON fail, error: ", err);
    throw err;
  }
}

export function updateServiceAgentPreferencesJSON(
  serviceJSON: BaseAgentPreference
): Object {
  try {
    return updatePreferencesJSON({
      SERVICE_AGENT: serviceJSON,
    });
  } catch (err) {
    logger.error("updateServiceAgentPreferencesJSON fail, error: ", err);
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
        logger.debug(
          `process.env.${key.toUpperCase()}: `,
          preferencesJSON[key]
        );
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
export function updatePreferencesJSON(
  preferencesJSON: Preferences | Object
): Object {
  try {
    let curPreferencesJSON = getPreferencesJSON();
    // preferencesJSON = _.merge(curPreferencesJSON, preferencesJSON, {
    //   version: curPreferencesJSON.version
    // });
    preferencesJSON = {
      ...curPreferencesJSON,
      ...preferencesJSON,
      ...{ version: curPreferencesJSON.version },
    };
    preferencesJSON = cleanPreferences(preferencesJSON);
    fs.outputJSONSync(PREFERENCES_JSON_PATH, preferencesJSON);
    return preferencesJSON;
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
    version: "1.0.0",
    HEADLESS_AGENT: getDefaultHeadlessAgent(),
    SERVICE_AGENT: getDefaultServiceAgent(),
  };
}

export function getDefaultDBsConfig() {
  return {
    sqlite: DEFAULT_SQLITE_DB_CONFIG,
    mongodb: DEFAULT_MONGODB_CONFIG,
  };
}

/**
 * Get default configuration for headless agent
 * @returns {HeadlessAgentPreference}
 */
export function getDefaultHeadlessAgent(): HeadlessAgentPreference {
  const baseAgentPreferenceJSON = getDefaultBaseAgent();
  const headlessAgent = _.merge({}, baseAgentPreferenceJSON, {
    CUSTOM_FUNCTION_TIMEOUT: 1 * 60 * 1000,
    HEADLESS: true,
    SCREENSHOT: false,
    AGENT_HOME: path.join(MUNEW_HOME_FOLDER, "headless"),
  });

  return headlessAgent;
}

/**
 * Get default configuration for service agent
 * @returns {BaseAgentPreference}
 */
export function getDefaultServiceAgent(): BaseAgentPreference {
  const baseAgentPreferenceJSON = getDefaultBaseAgent();
  const serviceAgent = _.merge({}, baseAgentPreferenceJSON, {
    AGENT_HOME: path.join(MUNEW_HOME_FOLDER, "service"),
  });
  return serviceAgent;
}

/**
 * Get default base configuration for agent
 * @returns {BaseAgentPreference}
 */
export function getDefaultBaseAgent(): BaseAgentPreference {
  return {
    PORT: 9999,
    AGENT_SERIAL_ID: uuidv4(),
    // MUNEW_BASE_URL: undefined,
    // GLOBAL_ID: undefined,
    // MUNEW_SECURITY_KEY: undefined,
    AGENT_HOME: MUNEW_HOME_FOLDER,
    LOG_LEVEL: LogLevel.info,
  };
}

/**
 * remove unnecessary field
 * @param prefences
 */
export function cleanPreferences(prefences): any {
  if (prefences.TYPEORM_CONNECTION === "mongodb") {
    delete prefences.TYPEORM_DATABASE;
  } else if (prefences.TYPEORM_CONNECTION === "sqlite") {
    delete prefences.TYPEORM_URL;
  }
  return prefences;
}
