import produce from "immer";
import * as path from "path";
import {
  GET_RETAILER_FOLDER_STRUCTURE,
  UPDATE_CURRENT_SELECTED_FILE
} from "./constants";
import { readFolderRecursiveSync } from "../../../utils";
import { BITSKY_HOME_FOLDER, DEFAULT_RETAILER_SERVICE_FOLDER } from '../../../utils/constants';

export const initialState = {
  retailerFolderStructure: {
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
      case GET_RETAILER_FOLDER_STRUCTURE:
        try {
          const retailerFolderStructure = readFolderRecursiveSync(
            path.join(BITSKY_HOME_FOLDER, DEFAULT_RETAILER_SERVICE_FOLDER),
            "."
          );
          draft.retailerFolderStructure = {
            data: retailerFolderStructure,
            lastGetTime: Date.now(),
            fail: null,
            loaded: true
          };
        } catch (err) {
          draft.retailerFolderStructure = {
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
