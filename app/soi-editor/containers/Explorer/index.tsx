import React, { useEffect, useContext, useState } from "react";
import { Tree, Skeleton, Icon } from "antd";
import { useSelector, useDispatch } from "react-redux";
import {
  MosaicWindow,
  MosaicBranch,
  MosaicContext,
  MosaicNode
} from "react-mosaic-component";
import { SOIFolderStructure, DirType } from "../../../interfaces";
import { getSOIFolderStructue, updateCurrentSelectedFile } from "./actions";
import { responsedToExplorer } from "../App/actions";
import { initialState } from "../App/reducer";
const { TreeNode, DirectoryTree } = Tree;

export interface ExplorerProps {
  path: Array<MosaicBranch>;
}

function Explorer(props: ExplorerProps) {
  const dispatch = useDispatch();
  const context = useContext(MosaicContext);
  const isExplorerOpen: boolean = useSelector(
    state => state.app.isExplorerOpen
  );
  const waitingExplorerToResponse: boolean = useSelector(
    state => state.app.waitingExplorerToResponse
  );
  const mosaicNodes: MosaicNode<number | string> | null = useSelector(
    state => state.app.mosaicNodes
  );

  // whether show all files. This is a feedback from a user that only show necessary files at beginning
  const [showAllFiles, setShowAllFiles] = useState(false);

  useEffect(() => {
    // second parameter is [], the effect will only run on first render
    // Get SOI Folder Structure
    dispatch(getSOIFolderStructue());
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
                  $set: initialState.mosaicNodes.splitPercentage
                },
                second: {
                  first: {},
                  splitPercentage: {
                    $set: mosaicNodes && mosaicNodes.second.splitPercentage
                  }
                }
              }
            }
          ]);
        } else {
          // context.mosaicActions.hide(["second", "second"]);
          context.mosaicActions.updateTree([
            {
              path: [],
              spec: {
                splitPercentage: {
                  $set: 0
                },
                second: {
                  first: {},
                  splitPercentage: {
                    $set: mosaicNodes && mosaicNodes.second.splitPercentage
                  }
                }
              }
            }
          ]);
        }
        dispatch(responsedToExplorer());
      }
    }
  });

  const soiFolderStructure: SOIFolderStructure = useSelector(state => {
    return state.explorer.soiFolderStructure;
  });

  const generateFolderStructure = folderStructure => {
    // TODO: use function to filter this tree
    // only show frequently used files
    let arr = [
      {
        type: DirType.file,
        name: "worker.js",
        path: "worker.js"
      },
      {
        type: "button",
        name: "Show Hiding Files",
        path: "show_hiding_files",
        icon: "down-square"
      }
    ];
    if (showAllFiles) {
      arr = [].concat(folderStructure).concat([
        {
          type: "button",
          name: "Collapse Hiding Files",
          path: "collapse_hiding_files",
          icon: "up-square"
        }
      ]);
    }
    return arr;
  };

  const onSelect = keys => {
    let key = keys && keys[0];
    let arr = key.split("::");
    if (arr[0] === DirType.file) {
      // only update when select a file
      dispatch(updateCurrentSelectedFile(arr[1]));
    }else if(arr[0] === 'button'){
      setShowAllFiles(!showAllFiles);
    }
  };

  const onExpand = () => {};

  const generateTreeNodes = data =>
    data.map(item => {
      if (item.type == DirType.directory) {
        return (
          <TreeNode title={item.name} key={`${item.type}::${item.path}`}>
            {generateTreeNodes(item.children)}
          </TreeNode>
        );
      }else if(item.type == DirType.file){
        return (
          <TreeNode title={item.name} key={`${item.type}::${item.path}`} isLeaf />
        );
      }else{
        return (
          <TreeNode icon={()=><Icon type={item.icon}/>} title={item.name} key={`${item.type}::${item.path}`} isLeaf />
        );
      }
    });

  const generateContent = () => {
    if (!soiFolderStructure || !soiFolderStructure.loaded) {
      return <Skeleton active />;
    } else {
      return (
        <MosaicWindow<number>
          draggable={false}
          title={"Explorer"}
          path={props.path}
          toolbarControls={[]}
        >
          <div style={{ overflow: "scroll", height: "100%" }}>
            <DirectoryTree
              defaultExpandAll
              onSelect={onSelect}
              onExpand={onExpand}
            >
              {generateTreeNodes(generateFolderStructure(soiFolderStructure.data))}
            </DirectoryTree>
          </div>
        </MosaicWindow>
      );
    }
  };

  return generateContent();
}

export default Explorer;
