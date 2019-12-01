import React, { useEffect } from "react";
import { Tree, Skeleton } from "antd";
import { useSelector, useDispatch } from 'react-redux';
import { SOIFolderStructure, DirType } from "../../../interfaces";
import { getSOIFolderStructue } from './actions';
const { TreeNode, DirectoryTree } = Tree;

// interface Props {
//   soiFolderStructure: SOIFolderStructure;
//   onSelect: Function;
// }

// function Explorer(props: Props) {
function Explorer() {
  const dispatch = useDispatch();
  
  useEffect(()=>{
    // second parameter is [], the effect will only run on first render
    // Get SOI Folder Structure
    dispatch(getSOIFolderStructue());
  }, []);

  const soiFolderStructure:SOIFolderStructure = useSelector(state=> state.explorer.soiFolderStructure)

  const onSelect = (keys, event) => {
    console.log('keys: ', keys);
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
