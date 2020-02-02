import produce from "immer";
import * as path from "path";
import {
  GET_SOI_FOLDER_STRUCTURE,
  UPDATE_CURRENT_SELECTED_FILE
} from "./constants";
import { readFolderRecursiveSync } from "../../../utils";
import { MUNEW_HOME_FOLDER, DEFAULT_ANALYST_SERVICE_FOLDER } from '../../../utils/constants';

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
    switch (action.type) {
      case GET_SOI_FOLDER_STRUCTURE:
        try {
          const soiFolderStructure = readFolderRecursiveSync(
            path.join(MUNEW_HOME_FOLDER, DEFAULT_ANALYST_SERVICE_FOLDER),
            "."
          );
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
