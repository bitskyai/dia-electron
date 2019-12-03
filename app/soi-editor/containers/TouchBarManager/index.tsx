import React from "react";
import { PageHeader, Button, Icon } from "antd";
import { useDispatch } from 'react-redux';
import { showOrHideConsole } from "../App/actions";

function TouchBarManager() {
  const dispatch = useDispatch();
  const clickConsole = ()=>{
    dispatch(showOrHideConsole());
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
        <Button
          key="console"
          onClick={clickConsole}
        >
          <Icon type="code" />
          Console
        </Button>,
        <Button key="explorer">
          <Icon type="folder" />
          Explorer
        </Button>,
        <Button key="reset">
          <Icon type="folder" />
          Reset to Default
        </Button>
      ]}
    ></PageHeader>
  );
}

export default TouchBarManager;
