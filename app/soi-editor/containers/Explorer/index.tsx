import React from "react";
import { Tree, Skeleton } from "antd";
import { useSelector } from 'react-redux';
import { SOIFolderStructure, DirType } from "../../../interfaces";
const { TreeNode, DirectoryTree } = Tree;

// interface Props {
//   soiFolderStructure: SOIFolderStructure;
//   onSelect: Function;
// }

// function Explorer(props: Props) {
function Explorer() {

  const soiFolderStructure:SOIFolderStructure = useSelector(state=> state.app.soiFolderStructure)

  const onSelect = (keys, event) => {
    // onSelect(keys);
  };

  const onExpand = () => {
    console.log("onExpand");
  };

  const generateTreeNodes = data =>
    data.map(item => {
      if (item.type == DirType.directory) {
        return (
          <TreeNode title={item.name} key={item.path}>
            {generateTreeNodes(item.children)}
          </TreeNode>
        );
      }
      return <TreeNode title={item.name} key={item.path} isLeaf />;
    });

  const generateContent = () => {
    if (!soiFolderStructure || !soiFolderStructure.loaded) {
      return <Skeleton active />;
    } else {
      return (
        <div style={{overflow:'scroll', height:'100%'}}>
          <DirectoryTree defaultExpandAll onSelect={onSelect} onExpand={onExpand}>
            {generateTreeNodes(soiFolderStructure.data)}
          </DirectoryTree>
        </div>
      );
    }
  };

  return generateContent();
}

export default Explorer;
