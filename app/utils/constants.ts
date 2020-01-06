import { app } from "electron";
import * as path from "path";
import {TypeormConnection} from '../interfaces';

// export const USER_DATA_PATH = app.getPath("userData");
export const CONFIG_PATH = path.join(app.getPath("home"), ".munew-dia");
// default sqlite db configuration
export const DEFAULT_SQLITE_DB_CONFIG = {
  TYPEORM_CONNECTION: TypeormConnection.sqlite,
  TYPEORM_DATABASE: path.join(CONFIG_PATH, "munew_dia.sql")
};

// default mongodb configuration
export const DEFAULT_MONGODB_CONFIG = {
  TYPEORM_CONNECTION: TypeormConnection.mongodb,
  TYPEORM_URL: `mongodb://localhost:27017/munew_dia`
};

export const LOG_FILES_PATH = path.join(app.getPath("userData"), "./log");

export const PREFERENCES_JSON_PATH = path.join(CONFIG_PATH, 'preferences.json');