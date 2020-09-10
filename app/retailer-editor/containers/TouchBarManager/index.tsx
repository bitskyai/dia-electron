import React from "react";
import { PageHeader, Button, Icon, message, Tag } from "antd";
import { useSelector, useDispatch } from "react-redux";
import { ipcRenderer } from "electron";
import PubSub from 'pubsub-js';
import { showOrHideConsole, showOrHideExplorer, updateRetailerStatus } from "../App/actions";
import { ipcRendererManager } from "../../ipc";
import { IpcEvents } from "../../../ipc-events";
import { PUBSUB_TOPICS } from '../../utils/constants';

function TouchBarManager() {
  // action buttons status
  const dispatch = useDispatch();
  const isConsoleOpen: boolean = useSelector(state => state.app.isConsoleOpen);
  const isExplorerOpen: boolean = useSelector(
    state => state.app.isExplorerOpen
  );

  function dispatchUpdateRetailerStatus(curStatus, newStatus){
    dispatch(updateRetailerStatus({...curStatus, ...newStatus}));
  }

  const status: any = useSelector(state => {
    return state.app.status;
  });
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
        IpcEvents.SYNC_RETAILER_RESET_TO_DEFAULT
      );
      if (result && result.status) {
        message.success(
          "Successfully reset to default Retailer, all your changes was reverted to default"
        );
        PubSub.publish(PUBSUB_TOPICS.RE_GET_FILE_CONTENT);
      } else {
        message.error("Failed reset to default Retailer, please try again");
      }
    } catch (err) {
      message.error("Failed reset to default Retailer, please try again");
    }
  };

  const clickBackBtn = () => {
    ipcRenderer.send(IpcEvents.CLOSE_RETAILER_EDITOR, "retailerEditor");
  };

  const downloadElectron = () => {
    dispatchUpdateRetailerStatus(status, {isDownloading: true})
    ipcRendererManager.send(IpcEvents.DOWNLOAD_ELECTRON);
  };

  const stopRetailer = () => {
    dispatchUpdateRetailerStatus(status, {isStoppingServer: true})
    ipcRendererManager.send(IpcEvents.STOP_RETAILER_SERVER);
  };

  const startRetailer = () => {
    dispatchUpdateRetailerStatus(status, {isStartingServer: true})
    ipcRendererManager.send(IpcEvents.START_RETAILER_SERVER);
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

    if (!status.isElectronDownloaded) {
      // if didn't download electron, then show Download
      actionBtns = [
        <Button
          key="download"
          type="primary"
          onClick={downloadElectron}
          loading={status.isDownloading}
        >
          {!status.isDownloading ? <Icon type="download" /> : ""}
          Download Electron
        </Button>
      ].concat(actionBtns);
    } else {
      // electron already download
      if (status.isRunning) {
        actionBtns = [
          <Button
            key="stop"
            type="primary"
            onClick={stopRetailer}
            loading={status.isStoppingServer}
          >
            {!status.isStoppingServer ? <Icon type="pause-circle" /> : ""}
            Stop
          </Button>
        ].concat(actionBtns);
      } else {
        actionBtns = [
          <Button
            key="run"
            onClick={startRetailer}
            loading={status.isStartingServer}
          >
            {!status.isStartingServer ? <Icon type="caret-right" /> : ""}
            Start
          </Button>
        ].concat(actionBtns);
      }
    }

    return actionBtns;
  };

  let RetailerURL = `http://localhost:${status.RetailerPort}`;
  const content = (
    <div className="content">
      <a target="_blank" href={RetailerURL}>
        {RetailerURL}
      </a>
      {status.isRunning ? (
        <Tag color="green">Running</Tag>
      ) : (
        <Tag color="red">Stopped</Tag>
      )}
    </div>
  );

  return (
    <PageHeader
      ghost={false}
      onBack={() => clickBackBtn()}
      title="Hello Retailer Service"
      subTitle="A default Retailer Service help you to get start with data crawling"
      extra={getActionBtns()}
    >
      {content}
    </PageHeader>
  );
}

export default TouchBarManager;
