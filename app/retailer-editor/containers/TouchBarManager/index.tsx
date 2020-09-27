import React from "react";
import {
  PageHeader,
  Button,
  Icon,
  message,
  Tag,
  Typography,
  Tooltip,
} from "antd";
import { useSelector, useDispatch } from "react-redux";
import { ipcRenderer } from "electron";
import PubSub from "pubsub-js";
import {
  showOrHideConsole,
  showOrHideExplorer,
  updateRetailerStatus,
} from "../App/actions";
import {
  getRetailerFolderStructue
} from '../Explorer/actions';
import { ipcRendererManager } from "../../ipc";
import { IpcEvents } from "../../../ipc-events";
import { PUBSUB_TOPICS } from "../../utils/constants";
const { Paragraph, Text } = Typography;

function TouchBarManager() {
  // action buttons status
  const dispatch = useDispatch();
  const isConsoleOpen: boolean = useSelector(
    (state) => state.app.isConsoleOpen
  );
  const isExplorerOpen: boolean = useSelector(
    (state) => state.app.isExplorerOpen
  );

  function dispatchUpdateRetailerStatus(curStatus, newStatus) {
    dispatch(updateRetailerStatus({ ...curStatus, ...newStatus }));
  }

  const status: any = useSelector((state) => {
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
      dispatch(getRetailerFolderStructue());
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
    dispatchUpdateRetailerStatus(status, { isDownloading: true });
    ipcRendererManager.send(IpcEvents.DOWNLOAD_ELECTRON);
  };

  const stopRetailer = () => {
    dispatchUpdateRetailerStatus(status, { isStoppingServer: true });
    ipcRendererManager.send(IpcEvents.STOP_RETAILER_SERVER);
  };

  const startRetailer = () => {
    dispatchUpdateRetailerStatus(status, { isStartingServer: true });
    ipcRendererManager.send(IpcEvents.START_RETAILER_SERVER);
  };

  const getActionBtns = () => {
    let actionBtns = [
      // <Tooltip title="Open or Close Console panel">
      //   <Button key="console" type={consoleBtnType} onClick={clickConsole}>
      //     <Icon type="code" />
      //     Console
      //   </Button>
      // </Tooltip>,
      <Tooltip title="Open or Close Explorer panel">
        <Button key="explorer" type={explorerBtnType} onClick={clickExplorer}>
          <Icon type={explorerIconType} />
          Explorer
        </Button>
      </Tooltip>,
      <Tooltip title="Reset Hello Retailer to default, all your changes will be reverted to default">
        <Button key="reset" onClick={clickReset}>
          <Icon type="hourglass" />
          Reset to Default
        </Button>
      </Tooltip>,
    ];

    // Don't need user to download electron, so comment this
    // if (!status.isElectronDownloaded) {
    //   // if didn't download electron, then show Download
    //   actionBtns = [
    //     <Tooltip title="Download Electron">
    //       <Button
    //         key="download"
    //         type="primary"
    //         onClick={downloadElectron}
    //         loading={status.isDownloading}
    //       >
    //         {!status.isDownloading ? <Icon type="download" /> : ""}
    //         Download Electron
    //       </Button>
    //     </Tooltip>,
    //   ].concat(actionBtns);
    // } else {
    // electron already download
    if (status.isRunning) {
      actionBtns = [
        <Tooltip title="Stop retailer service">
          <Button
            key="stop"
            type="primary"
            onClick={stopRetailer}
            loading={status.isStoppingServer}
          >
            {!status.isStoppingServer ? <Icon type="pause-circle" /> : ""}
            Stop
          </Button>
        </Tooltip>,
      ].concat(actionBtns);
    } else {
      actionBtns = [
        <Tooltip title="Start retailer service">
          <Button
            key="run"
            onClick={startRetailer}
            loading={status.isStartingServer}
          >
            {!status.isStartingServer ? <Icon type="caret-right" /> : ""}
            Start
          </Button>
        </Tooltip>,
      ].concat(actionBtns);
    }
    // }

    return actionBtns;
  };

  const linkBtn = {
    lineHeight: "24px",
    marginRight: "16px",
  };

  const linkBtnIcon = {
    marginRight: "8px",
  };

  const retailerURL = `http://localhost:${status.RetailerPort}`;
  const content = (
    <div className="content">
      <Paragraph>
        A code editor to help you start data crawling, already installed
        necessary&nbsp;
        <a href="https://www.npmjs.com/" target="_blank">
          node_modules
        </a>
        . Most of time you only need to implement your logic inside{" "}
        <Text code>worker.js</Text>. <Text code>CTRL+S(Win/Linux)</Text> or{" "}
        <Text code>CMD+S(MacOS)</Text>
        to save your change. After save successfully, you need to{" "}
        <b>Stop and Start</b> to take effect of your changes. Hover each button
        to see more detail
      </Paragraph>
      <div>
        <Tooltip title="View more detail in User Manual">
          <a
            target="_blank"
            style={linkBtn}
            href={"https://docs.bitsky.ai/user-manual/retailer-editor"}
          >
            <img
              style={linkBtnIcon}
              src={
                "https://gw.alipayobjects.com/zos/rmsportal/NbuDUAuBlIApFuDvWiND.svg"
              }
              alt={"Retailer Editor User Manual"}
            />
            User Manual
          </a>
        </Tooltip>
        {status.isRunning ? (
          <>
            <Tooltip title="Retailer Service Base URL">
              <a target="_blank" href={retailerURL} style={linkBtn}>
                <img
                  style={linkBtnIcon}
                  src={
                    "https://gw.alipayobjects.com/zos/rmsportal/ohOEPSYdDTNnyMbGuyLb.svg"
                  }
                  alt={"Open Retailer Service"}
                />
                {retailerURL}
              </a>
            </Tooltip>
            <Tooltip title="Add trigger tasks is used to trigger data crawling. By default will call trigger function inside worker.js">
              <a
                target="_blank"
                style={linkBtn}
                href={`${retailerURL}${"/apis/tasks/trigger"}`}
              >
                <img
                  style={linkBtnIcon}
                  src={
                    "https://gw.alipayobjects.com/zos/rmsportal/MjEImQtenlyueSmVEfUD.svg"
                  }
                  alt={"Retailer Editor User Manual"}
                />
                Add trigger tasks
              </a>
            </Tooltip>
          </>
        ) : (
          <></>
        )}
      </div>
    </div>
  );

  return (
    <PageHeader
      ghost={false}
      onBack={() => clickBackBtn()}
      title="Hello Retailer"
      subTitle="Start data crawling now"
      tags={
        status.isRunning ? (
          <>
            <Tag color="green">Running</Tag>
          </>
        ) : (
          <Tag color="red">Stopped</Tag>
        )
      }
      extra={getActionBtns()}
    >
      {content}
    </PageHeader>
  );
}

export default TouchBarManager;
