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
import { Icon } from "antd";
import {
  Mosaic,
  MosaicNode,
  MosaicWindow,
  MosaicZeroState
} from "react-mosaic-component";

import Explorer from "../Explorer";
import TouchBarManager from "../TouchBarManager";
import Editors from "../Editors";
import { loadMonaco } from "../../utils";

let windowCount = 3;

export interface AppState {
  currentNode: MosaicNode<number | string> | null;
}

class App extends React.PureComponent<{}, AppState> {
  state: AppState = {
    currentNode: {
      direction: "row",
      first: "exporer",
      second: {
        direction: "column",
        first: "fileEditor",
        second: "console",
        splitPercentage: 80
      },
      splitPercentage: 20
    }
  };

  constructor(props) {
    super(props);
    loadMonaco();
  }

  render() {
    return (
      <div className="munew-soi-app">
        {this.renderNavBar()}
        <Mosaic<number | string>
          renderTile={this.getMosaicWindow}
          zeroStateView={<MosaicZeroState createNode={this.createNode} />}
          value={this.state.currentNode}
          onChange={this.onChange}
          onRelease={this.onRelease}
        />
      </div>
    );
  }

  private onChange = (currentNode: MosaicNode<number> | null) => {
    this.setState({ currentNode });
  };

  private onRelease = (currentNode: MosaicNode<number> | null) => {
    console.log("Mosaic.onRelease():", currentNode);
  };

  private onSelectFile = () => {
    console.log("onselectFile ...");
  };

  private getMosaicWindow = (count, path) => {
    let title: string = "",
      className: string = "",
      content: React.ReactElement<any> = <div />;
    if (count === "exporer") {
      title = "Explorer";
      content = <Explorer />;
    } else if (count === "fileEditor") {
      className = "mosaic-window-no-toolbar";
      content = <Editors />;
    } else if (count === "console") {
      title = "Console";
      content = <div>Console</div>;
    }

    return (
      <MosaicWindow<number>
        className={className}
        draggable={false}
        title={title}
        createNode={this.createNode}
        path={path}
        toolbarControls={() => {
          return <Icon type="close" />;
        }}
      >
        {content}
      </MosaicWindow>
    );
  };

  private createNode = () => ++windowCount;

  private renderNavBar() {
    return <TouchBarManager />;
  }
}

const mapStateToProps = (state /*, ownProps*/) => {
  return {};
};

const mapDispatchToProps = {};
export default connect(mapStateToProps, mapDispatchToProps)(App);
