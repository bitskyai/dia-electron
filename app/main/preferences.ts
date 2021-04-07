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
import { BITSKY_HOME_FOLDER } from "../utils/constants";
import {
  Preferences,
  HeadlessProducerPreference,
  BaseProducerPreference,
} from "../interfaces";

/**
 * Get preferences JSON, if this JSON file doesn't exist, then return default prefrences and write to disk
 * @returns {Preferences}
 */
export function getPreferencesJSON(): Preferences {
  try {
    const defaultPreferencesJSON = getDefaultPreferences();
    // if doesn't exist then return default preferences
    let preferencesJSON: Preferences | {};
    let mergedPreferencesJSON: Preferences;
    // if file exist then return
    fs.ensureFileSync(PREFERENCES_JSON_PATH);
    try{
      // to avoid if user delete preference.json
      preferencesJSON = fs.readJSONSync(PREFERENCES_JSON_PATH);
    }catch(err){
      preferencesJSON = {};
    }
    mergedPreferencesJSON = _.merge({}, defaultPreferencesJSON, preferencesJSON);
    if (_.get(mergedPreferencesJSON, "TYPEORM_CONNECTION") === "mongodb") {
      delete mergedPreferencesJSON.TYPEORM_DATABASE;
    }

    if(!(_.isEqual(preferencesJSON, mergedPreferencesJSON))){
      // if merged preferences isn't same with preferences get from local, need to update
      // 1. maybe we change the default perferences
      // console.log('===preferencesJSON: ');
      // console.log(preferencesJSON);

      // console.log('===mergedPreferencesJSON: ');
      // console.log(mergedPreferencesJSON);
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

export function getHeadlessProducerPreferencesJSON(): HeadlessProducerPreference {
  try {
    let preferencesJSON = getPreferencesJSON();
    return _.get(preferencesJSON, "HEADLESS_PRODUCER");
  } catch (err) {
    logger.error("getHeadlessProducerPreferencesJSON fail, error: ", err);
    throw err;
  }
}

export function updateHeadlessProducerPreferencesJSON(
  headlessJSON: HeadlessProducerPreference
): Object {
  try {
    return updatePreferencesJSON({
      HEADLESS_PRODUCER: headlessJSON,
    });
  } catch (err) {
    logger.error("updateHeadlessProducerPreferencesJSON fail, error: ", err);
    throw err;
  }
}

export function getHTTPProducerPreferencesJSON(): BaseProducerPreference {
  try {
    let preferencesJSON = getPreferencesJSON();
    // console.log(`getHTTPProducerPreferencesJSON: `, preferencesJSON);
    return _.get(preferencesJSON, "HTTP_PRODUCER");
  } catch (err) {
    logger.error("getHTTPProducerPreferencesJSON fail, error: ", err);
    throw err;
  }
}

export function updateHTTPProducerPreferencesJSON(
  serviceJSON: BaseProducerPreference
): Object {
  try {
    return updatePreferencesJSON({
      HTTP_PRODUCER: serviceJSON,
    });
  } catch (err) {
    logger.error("updateHTTPProducerPreferencesJSON fail, error: ", err);
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
    HEADLESS_PRODUCER: getDefaultHeadlessProducer(),
    HTTP_PRODUCER: getDefaultHTTPProducer(),
  };
}

export function getDefaultDBsConfig() {
  return {
    sqlite: DEFAULT_SQLITE_DB_CONFIG,
    mongodb: DEFAULT_MONGODB_CONFIG,
  };
}

/**
 * Get default configuration for headless producer
 * @returns {HeadlessProducerPreference}
 */
export function getDefaultHeadlessProducer(): HeadlessProducerPreference {
  const baseProducerPreferenceJSON = getDefaultBaseProducer();
  const headlessProducer = _.merge({}, baseProducerPreferenceJSON, {
    CUSTOM_FUNCTION_TIMEOUT: 1 * 60 * 1000,
    HEADLESS: true,
    SCREENSHOT: false,
    PRODUCER_HOME: path.join(BITSKY_HOME_FOLDER, "headless"),
    ABORT_RESOURCE_TYPES: undefined
  });

  return headlessProducer;
}

/**
 * Get default configuration for service producer
 * @returns {BaseProducerPreference}
 */
export function getDefaultHTTPProducer(): BaseProducerPreference {
  const baseProducerPreferenceJSON = getDefaultBaseProducer();
  const httpProducer = _.merge({}, baseProducerPreferenceJSON, {
    PRODUCER_HOME: path.join(BITSKY_HOME_FOLDER, "http"),
  });
  return httpProducer;
}

/**
 * Get default base configuration for producer
 * @returns {BaseProducerPreference}
 */
export function getDefaultBaseProducer(): BaseProducerPreference {
  return {
    PORT: 9999,
    PRODUCER_SERIAL_ID: uuidv4(),
    // BITSKY_BASE_URL: undefined,
    // GLOBAL_ID: undefined,
    // BITSKY_SECURITY_KEY: undefined,
    PRODUCER_HOME: BITSKY_HOME_FOLDER,
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
