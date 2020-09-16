import React, { useState } from "react";
import { useSelector } from "react-redux";
import { MosaicWindow, MosaicBranch } from "react-mosaic-component";
import { Empty } from "antd";
import * as MonacoType from "monaco-editor";
import * as path from "path";
import { Editor } from "../Editor";
import { FilePane } from "../../../interfaces";

const defaultMonacoOptions: MonacoType.editor.IEditorOptions = {
  minimap: {
    enabled: false
  },
  wordWrap: "on"
};

export interface EditorsProps {
  path: Array<MosaicBranch>;
}

/**
 * Current only support CRUD one file
 */
function Editors(props: EditorsProps) {
  const monaco = window.Bitsky.app.monaco;

  const currentSelectedFilePath: string = useSelector(
    state => state.explorer.currentSelectedFilePath
  );
  const initPanes: Array<FilePane> = [];
  const initActivePaneKey: string = "";
  const [panes, setPanes] = useState(initPanes);
  // which pane is active, default is empty
  const [activePaneKey, setActivePaneKey] = useState(initActivePaneKey);

  /**
   * Get pane by key
   * @param {string} key - file path string
   *
   * @returns {FilePane|null}
   */
  const getPaneByKey = (key): FilePane | null => {
    for (let i = 0; i < panes.length; i++) {
      if (panes[i].key == key) {
        return panes[i];
      }
    }
    return null;
  };

  if (currentSelectedFilePath && !getPaneByKey(currentSelectedFilePath)) {
    //Since we only support one tab, so if this file doesn't exist, instead of open new tab, will replace current tab
    let newPanes: Array<FilePane> = [];
    // if this pane doesn't exist, then open a new tab
    let pane: FilePane = {
      key: currentSelectedFilePath,
      title: path.basename(currentSelectedFilePath),
      path: currentSelectedFilePath
    };
    newPanes.push(pane);
    setPanes(newPanes);
    setActivePaneKey(currentSelectedFilePath);
  } else {
    // If already opened this file before, then open this pane
    // setActivePaneKey(currentSelectedFilePath);
  }

  // if not file is selected, then return Empty UI
  if (!currentSelectedFilePath || !panes.length) {
    return (
      <MosaicWindow<number>
        draggable={false}
        className="mosaic-window-no-toolbar"
        title={currentSelectedFilePath}
        path={props.path}
        toolbarControls={[]}
      >
        <Empty
          style={{ marginTop: "100px" }}
          description={
            <span>
              Please select a file from <b>Explorer</b>
            </span>
          }
        />
      </MosaicWindow>
    );
  } else {
    // current only support CRUD one file
    let pane = panes[0];
    return (
      <MosaicWindow<number>
        draggable={false}
        title={currentSelectedFilePath}
        path={props.path}
        toolbarControls={[]}
      >
        <Editor
          monaco={monaco}
          monacoOptions={defaultMonacoOptions}
          path={pane.path}
        />
      </MosaicWindow>
    );
  }

  // TODO: support open multiple files
  // return panes.map((pane)=>
  //   <Editor
  //     id={pane.key}
  //     monaco={monaco}
  //     monacoOptions={defaultMonacoOptions}
  //   />
  // );
}

export default Editors;
