import React from "react";
import { Tabs, Row, Col } from "antd";
import * as MonacoType from "monaco-editor";
import { Editor } from "../Editor";
const { TabPane } = Tabs;

const defaultMonacoOptions: MonacoType.editor.IEditorOptions = {
  minimap: {
    enabled: false
  },
  wordWrap: "on"
};

class FilesEditor extends React.Component {
  newTabIndex: number;
  state: any;
  constructor(props) {
    super(props);
    this.newTabIndex = 0;
    const panes = [
      { title: "Tab 1", content: "Content of Tab Pane 1", key: "1" },
      { title: "Tab 2", content: "Content of Tab Pane 2", key: "2" }
    ];
    this.state = {
      activeKey: panes[0].key,
      panes
    };
  }

  onChange = activeKey => {
    this.setState({ activeKey });
  };

  onEdit = (targetKey, action) => {
    this[action](targetKey);
  };

  add = () => {
    const { panes } = this.state;
    const activeKey = `newTab${this.newTabIndex++}`;
    panes.push({ title: "New Tab", content: "New Tab Pane", key: activeKey });
    this.setState({ panes, activeKey });
  };

  remove = targetKey => {
    let { activeKey } = this.state;
    let lastIndex;
    this.state.panes.forEach((pane, i) => {
      if (pane.key === targetKey) {
        lastIndex = i - 1;
      }
    });
    const panes = this.state.panes.filter(pane => pane.key !== targetKey);
    if (panes.length && activeKey === targetKey) {
      if (lastIndex >= 0) {
        activeKey = panes[lastIndex].key;
      } else {
        activeKey = panes[0].key;
      }
    }
    this.setState({ panes, activeKey });
  };

  render() {
    const monaco = window.MunewDIA.app.monaco;
    // return (
    //   <div style={{ height: '100%'}}>
    //     <div style={{ height: "20px" }}>File Names</div>
    //     <div style={{ height: "100%" }}>
    //       <Editor
    //         id={"1"}
    //         monaco={monaco}
    //         appState={{}}
    //         monacoOptions={defaultMonacoOptions}
    //       />
    //     </div>
    //   </div>
    // );
    return (
      <Tabs
        hideAdd
        onChange={this.onChange}
        activeKey={this.state.activeKey}
        type="editable-card"
        onEdit={this.onEdit}
        style={{
          height: "100%"
        }}
      >
        {this.state.panes.map((pane, index) => (
          <TabPane style={{height:'100%'}} tab={pane.title} key={pane.key}>
            <Editor
                  id={index}
                  monaco={monaco}
                  appState={{}}
                  monacoOptions={defaultMonacoOptions}
                />
            {/* <Row style={{height: '100%'}}>
              <Col style={{ minHeight: "100vh", maxheight: "100vh" }}>
                
              </Col>
            </Row> */}
          </TabPane>
        ))}
      </Tabs>
    );
  }
}
export default FilesEditor;
