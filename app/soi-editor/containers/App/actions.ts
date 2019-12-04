import {
  SHOW_OR_HIDE_CONSOLE,
  RESPONSED_TO_CONSOLE,
  SHOW_OR_HIDE_EXPLORER,
  RESPONSED_TO_EXPLORER,
  UPDATE_MOSAIC_NODES
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
