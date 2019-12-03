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
  MosaicNode,
  MosaicZeroState
} from "react-mosaic-component";

import Explorer from "../Explorer";
import TouchBarManager from "../TouchBarManager";
import Editors from "../Editors";
import Console from "../Consle";
import { loadMonaco } from "../../utils";

let windowCount = 3;

export interface AppState {
  currentNode: MosaicNode<number | string> | null;
}

class App extends React.PureComponent<{}, AppState> {
  constructor(props: any) {
    super(props);
    this.state = {
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
    loadMonaco();
  }

  render() {
    console.log("App->render");
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
    console.log("onChange");
    this.setState({ currentNode });
  };

  private onRelease = (currentNode: MosaicNode<number> | null) => {
    console.log("Mosaic.onRelease():", currentNode);
  };

  private getMosaicWindow = (count, path) => {
    let content: React.ReactElement<any> = <div />;
    if (count === "exporer") {
      content = <Explorer path={path} />;
    } else if (count === "fileEditor") {
      content = <Editors path={path} />;
    } else if (count === "console") {
      content = <Console path={path} />;
    }

    return content;
  };

  private createNode = () => ++windowCount;

  private renderNavBar() {
    return <TouchBarManager />;
  }
}

const mapStateToProps = (state /*, ownProps*/) => {
  console.log("mapStateToProps, state: ", state);
  return {
    currentSelectedFilePath: state.explorer.currentSelectedFilePath
  };
};

const mapDispatchToProps = {};
export default connect(mapStateToProps, mapDispatchToProps)(App);
