import produce from "immer";
import { MosaicNode } from "react-mosaic-component";
// import * as path from "path";
import {
  SHOW_OR_HIDE_CONSOLE,
  RESPONSED_TO_CONSOLE,
  SHOW_OR_HIDE_EXPLORER,
  RESPONSED_TO_EXPLORER,
  UPDATE_MOSAIC_NODES,
  ADD_CONSOLE_LOG,
  UPDATE_RETAILER_STATUS
} from "./constants";

const mosaicNodes: MosaicNode<number | string> | null = {
  direction: "row",
  first: "exporer",
  second: {
    direction: "column",
    first: "fileEditor",
    second: "console",
    splitPercentage: 100
  },
  splitPercentage: 20
};

export const initialState = {
  isExplorerOpen: true,
  waitingExplorerToResponse: false,
  isConsoleOpen: false,
  waitingConsoleToResponse: false,
  mosaicNodes,
  logs:[],
  status:{
    isElectronDownloaded: false,
    isDownloading: false,
    isRunning: false,
    isStartingServer: false,
    isStoppingServer: false
  }
};

const appReducer = (state = initialState, action) =>
  produce(state, (draft: any): any => {
    switch (action.type) {
      case SHOW_OR_HIDE_CONSOLE:
        draft.isConsoleOpen = !state.isConsoleOpen;
        draft.waitingConsoleToResponse = true;
        break;
      case RESPONSED_TO_CONSOLE:
        draft.waitingConsoleToResponse = false;
        break;
      case SHOW_OR_HIDE_EXPLORER:
        draft.isExplorerOpen = !state.isExplorerOpen;
        draft.waitingExplorerToResponse = true;
        break;
      case RESPONSED_TO_EXPLORER:
        draft.waitingExplorerToResponse = false;
        break;
      case UPDATE_MOSAIC_NODES:
        draft.mosaicNodes = action.payload.mosaicNodes;
        break;
      case ADD_CONSOLE_LOG:
        // control log order
        // draft.logs = [action.payload.log, ...state.logs]
        draft.logs = [...state.logs, action.payload.log];
        break;
      case UPDATE_RETAILER_STATUS:
        draft.status = { ...state.status, ...action.payload.status}
        break;
      default:
        break;
    }
  });

export default appReducer;
