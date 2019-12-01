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

export interface SOIFolderStructure{
  data: Array<DirStructure>|null,
  lastGetTime: number,
  fail: Error|null,
  loaded: boolean
}
