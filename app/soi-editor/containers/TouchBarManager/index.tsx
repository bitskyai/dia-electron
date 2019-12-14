import React from "react";
import { PageHeader, Button, Icon, message } from "antd";
import { useSelector, useDispatch } from "react-redux";
import { showOrHideConsole, showOrHideExplorer } from "../App/actions";
import { ipcRendererManager } from '../../ipc';
import { IpcEvents } from '../../../ipc-events';

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

  const clickReset = async()=>{
    try{
      // reset to default
      let result = ipcRendererManager.sendSync(IpcEvents.SYNC_SOI_RESET_TO_DEFAULT);
      if(result&&result.status){
        message.success('Successfully reset to default SOI, all your changes was reverted to default');
      }else{
        message.error('Failed reset to default SOI, please try again');
      }
    }catch(err){
      message.error('Failed reset to default SOI, please try again');
    }
  }

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
        <Button key="reset" onClick = {clickReset}>
          <Icon type="hourglass" />
          Reset to Default
        </Button>
      ]}
    ></PageHeader>
  );
}

export default TouchBarManager;
