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
import { updateMosaicNodes } from "./actions";
import { initialState } from "./reducer";

export interface AppProps {
  currentSelectedFilePath: string;
  isExplorerOpen: boolean;
  isConsoleOpen: boolean;
  dispatch: Function
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
    loadMonaco();
  }

  render() {
    return (
      <div className="munew-soi-app">
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
    console.log("onChange ", mosaicNodes);
    this.props.dispatch(updateMosaicNodes(mosaicNodes));
    this.setState({ mosaicNodes });
  };

  private onRelease = (mosaicNodes: MosaicNode<number> | null) => {
    console.log("Mosaic.onRelease():", mosaicNodes);
  };

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
