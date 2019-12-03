import produce from "immer";
// import * as path from "path";
import {
  SHOW_OR_HIDE_CONSOLE
} from "./constants";

export const initialState = {
  isExplorerOpen: true,
  isConsoleOpen: true
};

const appReducer = (state = initialState, action) =>
  produce(state, (draft: any): any => {
    switch (action.type) {
      case SHOW_OR_HIDE_CONSOLE:
        console.log(state);
        draft.isConsoleOpen = !state.isConsoleOpen;
        break;
      default:
        break;
    }
  });

export default appReducer;
