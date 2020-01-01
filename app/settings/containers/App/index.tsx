/**
 *
 * App.js
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 *
 */
import React from "react";
import { Tabs, PageHeader, Button } from "antd";
import { ipcRenderer } from 'electron';

const { TabPane } = Tabs;
import { IpcEvents } from "../../../ipc-events";

export default class App extends React.PureComponent {
  constructor(props: any) {
    super(props);
  }

  onSave(){
    console.log("on click save button...");
    ipcRenderer.send(IpcEvents.CLOSE_SETTINGS);
  }

  render() {
    return (
      <div className="munew-settings">
        <PageHeader
          title="Title"
          style={{
            border: "1px solid rgb(235, 237, 240)"
          }}
          subTitle="This is a subtitle"
          extra={[
            <Button key="1" type="primary" onClick={this.onSave}>
              Save
            </Button>,
            <Button key="2">Reset to Default</Button>
          ]}
        ></PageHeader>
        <Tabs tabPosition="left">
          <TabPane tab="General" key="1">
            Content of General
          </TabPane>
          <TabPane tab="About" key="2">
            Content of About
          </TabPane>
        </Tabs>
      </div>
    );
  }
}
