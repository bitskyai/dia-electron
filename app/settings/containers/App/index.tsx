/**
 *
 * App.js
 *
 * This component is the skeleton around the actual pages, and should only
 * contain code that should be seen on all pages. (e.g. navigation bar)
 *
 */
import React from "react";
import { FormattedMessage, FormattedHTMLMessage, injectIntl } from "react-intl";
import { Tabs, PageHeader, Button, Form, Input, Divider } from "antd";
import { ipcRenderer } from "electron";

const { TabPane } = Tabs;
import { ipcRendererManager } from "../../ipc";
import { IpcEvents } from "../../../ipc-events";

import GeneralForm from './GeneralForm';

class App extends React.PureComponent {
  constructor(props: any) {
    super(props);
    let result = ipcRendererManager.sendSync(
      IpcEvents.SYNC_GET_PREFERENCES_JSON
    );
  }

  onSave() {
    ipcRenderer.send(IpcEvents.CLOSE_SETTINGS);
  }

  onClose() {
    ipcRenderer.send(IpcEvents.CLOSE_SETTINGS);
  }

  render() {
    const { formatMessage, formatHTMLMessage } = this.props.intl;
    return (
      <div className="munew-settings">
        <PageHeader
          title={formatMessage({ id: "munew.settings.title" })}
          style={{
            border: "1px solid rgb(235, 237, 240)"
          }}
          // subTitle="This is a subtitle"
          extra={[
            <Button key="closeBtn" type="link" onClick={this.onClose}>
              X{/* <FormattedMessage id="munew.settings.close" /> */}
            </Button>
          ]}
        ></PageHeader>
        <Tabs tabPosition="left">
          <TabPane
            tab={formatMessage({ id: "munew.settings.general" })}
            key="1"
          >
            <GeneralForm />
          </TabPane>
          <TabPane tab={formatMessage({ id: "munew.settings.about" })} key="2">
            Content of About
          </TabPane>
        </Tabs>
      </div>
    );
  }
}

export default injectIntl(App);
