import React from "react";
import { PageHeader, Button, Icon } from "antd";

function TouchBarManager() {
  return (
    <PageHeader
      ghost={false}
      onBack={() => window.history.back()}
      title="Default SOI"
      subTitle="A default SOI you can add your logic to intelligences.js"
      extra={[
        <Button key="3">
          <Icon type="caret-right" />
          Run
        </Button>,
        <Button key="2">
          <Icon type="code" />
          Console
        </Button>,
        <Button key="1">
          <Icon type="folder" />
          Explorer
        </Button>
      ]}
    ></PageHeader>
  );
}

export default TouchBarManager;
