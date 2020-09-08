export interface NpmVersion {
  version: string;
  name?: string;
  localPath?: string;
}

export const enum DirType {
  "file" = "file",
  "directory" = "directory",
}

export interface DirStructure {
  type: DirType;
  name: string;
  path: string;
  children?: Array<DirStructure>;
}

export interface SOIFolderStructure {
  data: Array<DirStructure> | null;
  lastGetTime: number;
  fail: Error | null;
  loaded: boolean;
}

export interface OpenFile {
  path: string;
  name: string;
  extName: string;
  content?: string;
}

export interface OpenFilesHash {
  [key: string]: OpenFile;
}

export interface FilePane {
  key: string;
  title: string;
  path: string;
}

export interface LogItem {
  timestamp: number;
  text: string;
}
export type mosaicId = "exporer" | "fileEditor" | "console";

export const enum TypeormConnection {
  "sqlite" = "sqlite",
  "mongodb" = "mongodb",
}

export const enum LogLevel {
  "error" = "error",
  "warn" = "warn",
  "info" = "info",
  "debug" = "debug",
}

export interface BaseAgentPreference {
  TYPE?: string;
  PORT: number;
  BITSKY_BASE_URL?: string; // format is URL
  GLOBAL_ID?: string; // format is uuid
  BITSKY_SECURITY_KEY?: string;
  PRODUCER_HOME: string; // format is path string
  LOG_LEVEL: LogLevel; // enum
  PRODUCER_SERIAL_ID: string; 
  //-------------------------------
  // Runtime relative config. 
  // Blow is system config, user cannot direct change
  // following values normally changed because of user's action.
  // Like: start agent, stop agent...
  RUNNING?: boolean;
  STARTING?: boolean;
  STOPPING?: boolean;
}

export interface HeadlessAgentPreference extends BaseAgentPreference {
  CUSTOM_FUNCTION_TIMEOUT: number; // unit: ms
  HEADLESS: boolean; // whether headless or not
  SCREENSHOT: boolean; // whether take screenshot
}

export interface Preferences {
  version: string;
  LOG_FILES_PATH: string;
  TYPEORM_CONNECTION: TypeormConnection;
  TYPEORM_DATABASE?: string;
  TYPEORM_URL?: string;
  HEADLESS_AGENT: HeadlessAgentPreference;
  SERVICE_AGENT: BaseAgentPreference;
}
