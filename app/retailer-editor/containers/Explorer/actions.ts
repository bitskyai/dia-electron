import {
  GET_RETAILER_FOLDER_STRUCTURE,
  UPDATE_CURRENT_SELECTED_FILE
} from "./constants";

export const getRetailerFolderStructue = () => {
  return {
    type: GET_RETAILER_FOLDER_STRUCTURE
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
