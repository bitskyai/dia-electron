import React from "react";
import { MosaicWindow } from "react-mosaic-component";
import { Icon } from "antd";

function Console(props) {
  return (
    <MosaicWindow<number>
      draggable={false}
      title={"Console"}
      path={props.path}
      toolbarControls={() => {
        return <Icon type="close" />;
      }}
    >
      <div>Console</div>
    </MosaicWindow>
  );
}

export default Console;
