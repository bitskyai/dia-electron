import {
  GET_SOI_FOLDER_STRUCTURE,
  UPDATE_CURRENT_SELECTED_FILE
} from "./constants";

export const getSOIFolderStructue = () => {
  return {
    type: GET_SOI_FOLDER_STRUCTURE
  };
};

export const updateCurrentSelectedFile = (filepath: string) => {
  return {
    type: UPDATE_CURRENT_SELECTED_FILE,
    payload: {
      filepath
    }
  };
};
