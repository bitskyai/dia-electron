import React from "react";
import { PageHeader, Button, Icon, message, Tag } from "antd";
import { useSelector, useDispatch } from "react-redux";
import { showOrHideConsole, showOrHideExplorer } from "../App/actions";
import { ipcRendererManager } from "../../ipc";
import { IpcEvents } from "../../../ipc-events";

function TouchBarManager() {
  const dispatch = useDispatch();
  const isConsoleOpen: boolean = useSelector(state => state.app.isConsoleOpen);
  const isExplorerOpen: boolean = useSelector(
    state => state.app.isExplorerOpen
  );
  const status: any = useSelector(state => state.app.status);
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

  const clickReset = async () => {
    try {
      // reset to default
      let result = ipcRendererManager.sendSync(
        IpcEvents.SYNC_SOI_RESET_TO_DEFAULT
      );
      if (result && result.status) {
        message.success(
          "Successfully reset to default SOI, all your changes was reverted to default"
        );
      } else {
        message.error("Failed reset to default SOI, please try again");
      }
    } catch (err) {
      message.error("Failed reset to default SOI, please try again");
    }
  };

  const stopSOI = () => {
    ipcRendererManager.send(IpcEvents.STOP_SOI_SERVER);
  };

  const startSOI = () => {
    ipcRendererManager.send(IpcEvents.START_SOI_SERVER);
  };

  const getActionBtns = () => {
    let actionBtns = [
      <Button key="console" type={consoleBtnType} onClick={clickConsole}>
        <Icon type="code" />
        Console
      </Button>,
      <Button key="explorer" type={explorerBtnType} onClick={clickExplorer}>
        <Icon type={explorerIconType} />
        Explorer
      </Button>,
      <Button key="reset" onClick={clickReset}>
        <Icon type="hourglass" />
        Reset to Default
      </Button>
    ];
    if (status.isRunning) {
      actionBtns = [
        <Button key="stop" type="primary" onClick={stopSOI}>
          <Icon type="pause-circle" />
          Stop
        </Button>
      ].concat(actionBtns);
    } else {
      actionBtns = [
        <Button key="run" onClick={startSOI}>
          <Icon type="caret-right" />
          Run
        </Button>
      ].concat(actionBtns);
    }

    return actionBtns;
  };

  let SOIURL = `http://localhost:${status.SOIPort}`;
  const content = (
    <div className="content">
      <a target="_blank" href={SOIURL}>
        {SOIURL}
      </a>
      {status.isRunning ? <Tag color="#87d068">Running</Tag>: <Tag color="#f50">Stop</Tag>}
    </div>
  );

  return (
    <PageHeader
      ghost={false}
      onBack={() => window.history.back()}
      title="Default SOI"
      subTitle="A default SOI help you to get start data crawling"
      extra={getActionBtns()}
    >
      {content}
    </PageHeader>
  );
}

export default TouchBarManager;
