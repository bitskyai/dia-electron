import produce from "immer";
import { MosaicNode } from "react-mosaic-component";
// import * as path from "path";
import {
  SHOW_OR_HIDE_CONSOLE,
  RESPONSED_TO_CONSOLE,
  SHOW_OR_HIDE_EXPLORER,
  RESPONSED_TO_EXPLORER,
  UPDATE_MOSAIC_NODES
} from "./constants";

const mosaicNodes: MosaicNode<number | string> | null = {
  direction: "row",
  first: "exporer",
  second: {
    direction: "column",
    first: "fileEditor",
    second: "console",
    splitPercentage: 70
  },
  splitPercentage: 20
};

export const initialState = {
  isExplorerOpen: true,
  waitingExplorerToResponse: false,
  isConsoleOpen: true,
  waitingConsoleToResponse: false,
  mosaicNodes
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

      default:
        break;
    }
  });

export default appReducer;
