import {
  SHOW_OR_HIDE_CONSOLE,
  RESPONSED_TO_CONSOLE,
  SHOW_OR_HIDE_EXPLORER,
  RESPONSED_TO_EXPLORER,
  UPDATE_MOSAIC_NODES,
  ADD_CONSOLE_LOG,
  UPDATE_RETAILER_STATUS
} from "./constants";

export const showOrHideConsole = () => {
  return {
    type: SHOW_OR_HIDE_CONSOLE
  };
};

export const responsedToConsole = () =>{
  return {
    type: RESPONSED_TO_CONSOLE
  };
}

export const showOrHideExplorer = () => {
  return {
    type: SHOW_OR_HIDE_EXPLORER
  };
};

export const responsedToExplorer = () =>{
  return {
    type: RESPONSED_TO_EXPLORER
  };
}

export const updateMosaicNodes = (mosaicNodes) => {
  return {
    type: UPDATE_MOSAIC_NODES,
    payload:{
      mosaicNodes
    }
  };
};

export const addConoleLog = (log)=>{
  return {
    type: ADD_CONSOLE_LOG,
    payload: {
      log
    }
  }
}

export const updateRetailerStatus = (status)=>{
  return {
    type: UPDATE_RETAILER_STATUS,
    payload: {
      status
    }
  }
}
