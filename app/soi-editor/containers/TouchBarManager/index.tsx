import React, { useState } from "react";
import { PageHeader, Button, Icon, message, Tag } from "antd";
import { useSelector, useDispatch } from "react-redux";
import PubSub from 'pubsub-js';
import { showOrHideConsole, showOrHideExplorer, updateSOIStatus } from "../App/actions";
import { ipcRendererManager } from "../../ipc";
import { IpcEvents } from "../../../ipc-events";
import { getOrCreateSOIEditorWindow } from "../../../render/windows";
import { PUBSUB_TOPICS } from '../../utils/constants';

function TouchBarManager() {
  // action buttons status
  const dispatch = useDispatch();
  const isConsoleOpen: boolean = useSelector(state => state.app.isConsoleOpen);
  const isExplorerOpen: boolean = useSelector(
    state => state.app.isExplorerOpen
  );

  function dispatchUpdateSOIStatus(curStatus, newStatus){
    dispatch(updateSOIStatus({...curStatus, ...newStatus}));
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
        IpcEvents.SYNC_SOI_RESET_TO_DEFAULT
      );
      if (result && result.status) {
        message.success(
          "Successfully reset to default SOI, all your changes was reverted to default"
        );
        PubSub.publish(PUBSUB_TOPICS.RE_GET_FILE_CONTENT);
      } else {
        message.error("Failed reset to default SOI, please try again");
      }
    } catch (err) {
      message.error("Failed reset to default SOI, please try again");
    }
  };

  const clickBackBtn = () => {
    let win = getOrCreateSOIEditorWindow();
    win.close();
  };

  const downloadElectron = () => {
    dispatchUpdateSOIStatus(status, {isDownloading: true})
    ipcRendererManager.send(IpcEvents.DOWNLOAD_ELECTRON);
  };

  const stopSOI = () => {
    dispatchUpdateSOIStatus(status, {isStoppingServer: true})
    ipcRendererManager.send(IpcEvents.STOP_SOI_SERVER);
  };

  const startSOI = () => {
    dispatchUpdateSOIStatus(status, {isStartingServer: true})
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
            onClick={stopSOI}
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
            onClick={startSOI}
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

  let SOIURL = `http://localhost:${status.SOIPort}`;
  const content = (
    <div className="content">
      <a target="_blank" href={SOIURL}>
        {SOIURL}
      </a>
      {status.isRunning ? (
        <Tag color="#87d068">Running</Tag>
      ) : (
        <Tag color="#f50">Stop</Tag>
      )}
    </div>
  );

  return (
    <PageHeader
      ghost={false}
      onBack={() => clickBackBtn()}
      title="Default Analyst Service"
      subTitle="A default Analyst Service help you to get start data crawling"
      extra={getActionBtns()}
    >
      {content}
    </PageHeader>
  );
}

export default TouchBarManager;
