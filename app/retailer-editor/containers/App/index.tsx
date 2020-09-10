/**
 *
 * App.js
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 *
 */
import React from "react";
import { connect } from "react-redux";
import {
  Mosaic,
  MosaicBranch,
  MosaicNode,
  MosaicZeroState
} from "react-mosaic-component";

import Explorer from "../Explorer";
import TouchBarManager from "../TouchBarManager";
import Editors from "../Editors";
import Console from "../Consle";
import { loadMonaco } from "../../utils";
import { updateMosaicNodes, addConoleLog, updateRetailerStatus } from "./actions";
import { initialState } from "./reducer";
import { ipcRendererManager } from "../../ipc";
import { IpcEvents } from "../../../ipc-events";

export interface AppProps {
  currentSelectedFilePath: string;
  isExplorerOpen: boolean;
  isConsoleOpen: boolean;
  dispatch: Function;
}

export interface AppState {
  mosaicNodes: MosaicNode<number | string> | null;
}

class App extends React.PureComponent<AppProps, AppState> {
  constructor(props: any) {
    super(props);
    this.state = {
      mosaicNodes: initialState.mosaicNodes
    };

    ipcRendererManager.on(IpcEvents.RETAILER_CONSOLE_LOG, (event, log) => {
      this.props.dispatch(addConoleLog(log));
    });

    this.setUpEventListeners();
    this.updateRetailerStatus();
    loadMonaco();
  }

  private setUpEventListeners() {
    ipcRendererManager.on(IpcEvents.STARTING_RETAILER_SERVER, (event, args) => {
      console.log("IpcEvents.STARTING_RETAILER_SERVER");
      this.updateRetailerStatus(args.payload.status);
    });
    ipcRendererManager.on(
      IpcEvents.STARTING_RETAILER_SERVER_SUCCESS,
      (event, args) => {
        console.log("IpcEvents.STARTING_RETAILER_SERVER_SUCCESS");
        this.updateRetailerStatus(args.payload.status);
      }
    );
    ipcRendererManager.on(IpcEvents.STARTING_RETAILER_SERVER_FAIL, (event, args) => {
      console.log("IpcEvents.STARTING_RETAILER_SERVER_FAIL");
      this.updateRetailerStatus(args.payload.status);
    });
    ipcRendererManager.on(
      IpcEvents.STOPPING_RETAILER_SERVER_SUCCESS,
      (event, args) => {
        console.log("IpcEvents.STOPPING_RETAILER_SERVER_SUCCESS");
        this.updateRetailerStatus(args.payload.status);
      }
    );
    ipcRendererManager.on(IpcEvents.STOPPING_RETAILER_SERVER, (event, args) => {
      console.log("IpcEvents.STOPPING_RETAILER_SERVER");
      this.updateRetailerStatus(args.payload.status);
    });
    ipcRendererManager.on(IpcEvents.STOPPING_RETAILER_SERVER_FAIL, (event, args) => {
      console.log("IpcEvents.STOPPING_RETAILER_SERVER_FAIL");
      this.updateRetailerStatus(args.payload.status);
    });
    ipcRendererManager.on(IpcEvents.DOWNLOADING_ELECTRON, (event, args) => {
      console.log("IpcEvents.DOWNLOADING_ELECTRON");
      this.updateRetailerStatus(args.payload.status);
    });
    ipcRendererManager.on(IpcEvents.DOWNLOAD_ELECTRON_FAIL, (event, args) => {
      console.log("IpcEvents.DOWNLOAD_ELECTRON_FAIL");
      this.updateRetailerStatus(args.payload.status);
    });
    ipcRendererManager.on(
      IpcEvents.DOWNLOAD_ELECTRON_SUCCESS,
      (event, args) => {
        console.log("IpcEvents.DOWNLOAD_ELECTRON_SUCCESS");
        this.updateRetailerStatus(args.payload.status);
      }
    );
  }

  private updateRetailerStatus(status?) {
    if (!status) {
      let result = ipcRendererManager.sendSync(IpcEvents.SYNC_RETAILER_STATUS);
      status = result.status;
    }
    console.log('updateRetailerStatus->status: ', status);
    // Need to handle error
    this.props.dispatch(updateRetailerStatus(status));
  }

  render() {
    return (
      <div className="munew-retailer-app">
        {this.renderNavBar()}
        <Mosaic<number | string>
          renderTile={this.getMosaicWindow}
          zeroStateView={<MosaicZeroState />}
          value={this.state.mosaicNodes}
          onChange={this.onChange}
          onRelease={this.onRelease}
        />
      </div>
    );
  }

  private onChange = (mosaicNodes: MosaicNode<any> | null) => {
    this.props.dispatch(updateMosaicNodes(mosaicNodes));
    this.setState({ mosaicNodes });
  };

  private onRelease = (mosaicNodes: MosaicNode<number> | null) => {};

  private getMosaicWindow = (mosaicId: string, path: Array<MosaicBranch>) => {
    let content: React.ReactElement<any> = <div />;
    if (mosaicId === "exporer") {
      content = <Explorer path={path} />;
    } else if (mosaicId === "fileEditor") {
      content = <Editors path={path} />;
    } else if (mosaicId === "console") {
      content = <Console path={path} />;
    }
    return content;
  };

  private renderNavBar() {
    return <TouchBarManager />;
  }
}

const mapStateToProps = (state /*, ownProps*/) => {
  return {
    currentSelectedFilePath: state.explorer.currentSelectedFilePath,
    isExplorerOpen: state.app.isExplorerOpen,
    isConsoleOpen: state.app.isConsoleOpen
  };
};

const mapDispatchToProps = dispatch => {
  return {
    dispatch
  };
};
export default connect(mapStateToProps, mapDispatchToProps)(App);
