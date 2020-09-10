import { app, remote } from "electron";
import * as path from "path";
import {TypeormConnection} from '../interfaces';

const getHomeFolder = () => {
  try {
    return path.join(app.getPath("home"));
  } catch (err) {
    return path.join(remote.app.getPath("home"));
  }
};
export const BITSKY_HOME_FOLDER = path.join(getHomeFolder(), ".bitsky");
export const DEFAULT_RETAILER_SERVICE_FOLDER = 'hello-retailer';
// default sqlite db configuration
export const DEFAULT_SQLITE_DB_CONFIG = {
  TYPEORM_CONNECTION: TypeormConnection.sqlite,
  TYPEORM_DATABASE: path.join(BITSKY_HOME_FOLDER, "bitsky.sql")
};

// default mongodb configuration
export const DEFAULT_MONGODB_CONFIG = {
  TYPEORM_CONNECTION: TypeormConnection.mongodb,
  TYPEORM_URL: `mongodb://localhost:27017/bitsky`
};

// log files path for engine
export const LOG_FILES_PATH = path.join(BITSKY_HOME_FOLDER, "./engine/log");

export const PREFERENCES_JSON_PATH = path.join(BITSKY_HOME_FOLDER, 'preferences.json');

// Timeout value for check whether a Retailer start successfully
export const RETAILER_CHECK_TIMEOUT = 15*1000;