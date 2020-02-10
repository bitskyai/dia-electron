export interface NpmVersion {
  version: string;
  name?: string;
  localPath?: string;
}

export const enum DirType {
  "file" = "file",
  "directory" = "directory"
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

export const enum TypeormConnection{
  "sqlite" = "sqlite",
  "mongodb" = "mongodb"
}

export interface Preferences{
  version: string,
  LOG_FILES_PATH: string,
  TYPEORM_CONNECTION: TypeormConnection,
  TYPEORM_DATABASE?: string,
  TYPEORM_URL?: string
}
