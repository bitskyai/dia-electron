import React, { useEffect, useContext } from "react";
import { Tree, Skeleton } from "antd";
import { useSelector, useDispatch } from "react-redux";
import {
  MosaicWindow,
  MosaicBranch,
  MosaicContext,
  MosaicNode
} from "react-mosaic-component";
import { SOIFolderStructure, DirType } from "../../../interfaces";
import { getSOIFolderStructue, updateCurrentSelectedFile } from "./actions";
import { responsedToExplorer } from '../App/actions';
import { initialState } from '../App/reducer';
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

  useEffect(() => {
    // second parameter is [], the effect will only run on first render
    // Get SOI Folder Structure
    dispatch(getSOIFolderStructue());
  }, []);

  useEffect(()=>{
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

  const soiFolderStructure: SOIFolderStructure = useSelector(
    state => state.explorer.soiFolderStructure
  );

  const onSelect = keys => {
    let key = keys && keys[0];
    let arr = key.split("::");
    if (arr[0] === DirType.file) {
      // only update when select a file
      dispatch(updateCurrentSelectedFile(arr[1]));
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
      }
      return (
        <TreeNode title={item.name} key={`${item.type}::${item.path}`} isLeaf />
      );
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
              {generateTreeNodes(soiFolderStructure.data)}
            </DirectoryTree>
          </div>
        </MosaicWindow>
      );
    }
  };

  return generateContent();
}

export default Explorer;
