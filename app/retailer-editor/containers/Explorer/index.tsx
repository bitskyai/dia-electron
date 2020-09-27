import React, { useEffect, useContext, useState } from "react";
import { Tree, Skeleton, Icon, Button } from "antd";
import { useSelector, useDispatch } from "react-redux";
import {
  MosaicWindow,
  MosaicBranch,
  MosaicContext,
  MosaicNode,
} from "react-mosaic-component";
import { RetailerFolderStructure, DirType } from "../../../interfaces";
import {
  getRetailerFolderStructue,
  updateCurrentSelectedFile,
} from "./actions";
import {
  showOrHideExplorer
} from "../App/actions";
import { responsedToExplorer } from "../App/actions";
import { initialState } from "../App/reducer";
import './style.scss';

const { TreeNode, DirectoryTree } = Tree;

export interface ExplorerProps {
  path: Array<MosaicBranch>;
}

function Explorer(props: ExplorerProps) {
  const dispatch = useDispatch();
  const context = useContext(MosaicContext);
  const isExplorerOpen: boolean = useSelector(
    (state) => state.app.isExplorerOpen
  );
  const waitingExplorerToResponse: boolean = useSelector(
    (state) => state.app.waitingExplorerToResponse
  );
  const mosaicNodes: MosaicNode<number | string> | null = useSelector(
    (state) => state.app.mosaicNodes
  );

  // whether show all files. This is a feedback from a user that only show necessary files at beginning
  const [showAllFiles, setShowAllFiles] = useState(false);

  useEffect(() => {
    // second parameter is [], the effect will only run on first render
    // Get Retailer Folder Structure
    getFoldersStructure();
  }, []);

  useEffect(() => {
    if (context && context.mosaicActions && context.mosaicActions.updateTree) {
      if (waitingExplorerToResponse) {
        if (isExplorerOpen) {
          context.mosaicActions.updateTree([
            {
              path: [],
              spec: {
                splitPercentage: {
                  $set: initialState.mosaicNodes.splitPercentage,
                },
                second: {
                  first: {},
                  splitPercentage: {
                    $set: mosaicNodes && mosaicNodes.second.splitPercentage,
                  },
                },
              },
            },
          ]);
        } else {
          // context.mosaicActions.hide(["second", "second"]);
          context.mosaicActions.updateTree([
            {
              path: [],
              spec: {
                splitPercentage: {
                  $set: 0,
                },
                second: {
                  first: {},
                  splitPercentage: {
                    $set: mosaicNodes && mosaicNodes.second.splitPercentage,
                  },
                },
              },
            },
          ]);
        }
        dispatch(responsedToExplorer());
      }
    }
  });

  const retailerFolderStructure: RetailerFolderStructure = useSelector(
    (state) => {
      return state.explorer.retailerFolderStructure;
    }
  );

  const generateFolderStructure = (folderStructure) => {
    // TODO: use function to filter this tree
    // only show frequently used files
    const arr = [
      {
        type: DirType.file,
        name: "worker.js",
        path: "worker.js",
      }
    ];

    return showAllFiles ? folderStructure : arr;
  };

  const getFoldersStructure = () => {
    dispatch(getRetailerFolderStructue());
  }

  const clickExplorer = () => {
    dispatch(showOrHideExplorer());
  };

  const onSelect = (keys) => {
    let key = keys && keys[0];
    let arr = key.split("::");
    if (arr[0] === DirType.file) {
      // only update when select a file
      dispatch(updateCurrentSelectedFile(arr[1]));
    }
  };

  const onExpand = () => {};

  const generateTreeNodes = (data) =>
    data.map((item) => {
      if (item.type == DirType.directory) {
        return (
          <TreeNode title={item.name} key={`${item.type}::${item.path}`}>
            {generateTreeNodes(item.children)}
          </TreeNode>
        );
      } else if (item.type == DirType.file) {
        return (
          <TreeNode
            title={item.name}
            key={`${item.type}::${item.path}`}
            isLeaf
          />
        );
      } else {
        return (
          <TreeNode
            icon={() => <Icon type={item.icon} />}
            title={item.name}
            key={`${item.type}::${item.path}`}
            isLeaf
          />
        );
      }
    });

  const generateContent = () => {
    if (!retailerFolderStructure || !retailerFolderStructure.loaded) {
      return <Skeleton active />;
    } else {
      return (
        <MosaicWindow<number>
          draggable={false}
          title={"Explorer"}
          path={props.path}
          toolbarControls={[]}
          renderToolbar={() => {
            return (
              <>
                <div className="mosaic-window-title" title="Explorer">
                  Explorer
                </div>
                <div className="mosaic-window-controls">
                  <Button.Group>
                    <Button type="link" className="retailer-editor-explorer-action-button" onClick={getFoldersStructure}>
                      <Icon type="reload" />
                    </Button>
                    <Button type="link" className="retailer-editor-explorer-action-button" onClick={()=>{setShowAllFiles(!showAllFiles)}}>
                      {
                        showAllFiles ? <Icon type="eye-invisible" />: <Icon type="eye" />
                      }
                    </Button>
                    <Button type="link" className="retailer-editor-explorer-action-button" onClick={clickExplorer}>
                      <Icon type="close" />
                    </Button>
                  </Button.Group>
                </div>
              </>
            );
          }}
        >
          <div style={{ overflow: "scroll", height: "100%" }}>
            <DirectoryTree
              defaultExpandAll
              // defaultSelectedKeys={[`${DirType.file}::worker.js`]}
              onSelect={onSelect}
              onExpand={onExpand}
            >
              {generateTreeNodes(generateFolderStructure(retailerFolderStructure.data))}
            </DirectoryTree>
          </div>
        </MosaicWindow>
      );
    }
  };

  return generateContent();
}

export default Explorer;
