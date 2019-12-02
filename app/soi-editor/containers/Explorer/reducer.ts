import produce from "immer";
import * as path from "path";
import { remote } from "electron";
import {
  GET_SOI_FOLDER_STRUCTURE,
  UPDATE_CURRENT_SELECTED_FILE
} from "./constants";
import { readFolderRecursiveSync } from "../../../utils";

export const initialState = {
  soiFolderStructure: {
    data: [],
    lastGetTime: null,
    fail: null,
    loaded: false
  },
  currentSelectedFilePath: null
};

const explorerReducer = (state = initialState, action) =>
  produce(state, (draft: any): any => {
    console.log("action.type: ", action.type);
    switch (action.type) {
      case GET_SOI_FOLDER_STRUCTURE:
        try {
          const soiFolderStructure = readFolderRecursiveSync(
            path.join(remote.app.getPath("userData"), "soi"),
            "."
          );
          console.log("soiFolderStructure: ", soiFolderStructure);
          draft.soiFolderStructure = {
            data: soiFolderStructure,
            lastGetTime: Date.now(),
            fail: null,
            loaded: true
          };
        } catch (err) {
          draft.soiFolderStructure = {
            data: [],
            lastGetTime: Date.now(),
            fail: err,
            loaded: true
          };
        }
        break;
      case UPDATE_CURRENT_SELECTED_FILE:
        draft.currentSelectedFilePath = action.payload.filepath;
        break;
      default:
        break;
    }
  });

export default explorerReducer;
