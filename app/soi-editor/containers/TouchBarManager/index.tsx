import React from "react";
import { PageHeader, Button, Icon } from "antd";
import { useSelector, useDispatch } from "react-redux";
import { showOrHideConsole, showOrHideExplorer } from "../App/actions";

function TouchBarManager() {
  const dispatch = useDispatch();
  const isConsoleOpen: boolean = useSelector(state => state.app.isConsoleOpen);
  const isExplorerOpen: boolean = useSelector(
    state => state.app.isExplorerOpen
  );
  let consoleBtnType = "default";
  let explorerBtnType = "default";
  let explorerIconType = "folder";

  if (isConsoleOpen) {
    consoleBtnType = "primary";
  }
  if (isExplorerOpen) {
    explorerBtnType = "primary";
    explorerIconType = "folder-open";
  }

  const clickConsole = () => {
    dispatch(showOrHideConsole());
  };
  const clickExplorer = () => {
    dispatch(showOrHideExplorer());
  };
  return (
    <PageHeader
      ghost={false}
      onBack={() => window.history.back()}
      title="Default SOI"
      subTitle="A default SOI you can add your logic to intelligences.js"
      extra={[
        <Button key="run">
          <Icon type="caret-right" />
          Run
        </Button>,
        <Button key="console" type={consoleBtnType} onClick={clickConsole}>
          <Icon type="code" />
          Console
        </Button>,
        <Button key="explorer" type={explorerBtnType} onClick={clickExplorer}>
          <Icon type={explorerIconType} />
          Explorer
        </Button>,
        <Button key="reset">
          <Icon type="hourglass" />
          Reset to Default
        </Button>
      ]}
    ></PageHeader>
  );
}

export default TouchBarManager;
