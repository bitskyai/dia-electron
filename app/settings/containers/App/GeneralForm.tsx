import _ from "lodash";
import React from "react";
import { remote } from "electron";
import * as path from "path";
import { FormattedMessage, FormattedHTMLMessage, injectIntl } from "react-intl";
import { Form, Input, Typography, Select, Button, Icon } from "antd";
const { Title, Text } = Typography;
const { Option } = Select;
const formItemStyle = { marginBottom: 0, paddingBottom: 0 };

import {
  showErrorNotification,
  showSuccessNotification
} from "../../notification";
import { ipcRendererManager } from "../../ipc";
import { IpcEvents } from "../../../ipc-events";
import { clear } from "winston";

const DEAULT_SQLITE_DATABASE = "munew_dia.sql";

class GeneralForm extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = {
      isValid: false,
      testingDBConnection: false,
      savingPreferences: false,
      preferences: {},
      error: false
    };
    const defaultDBsConfig = ipcRendererManager.sendSync(
      IpcEvents.SYNC_GET_DEFAULT_DB_CONFIGURATIONS
    );
    this.defaultDBsConfig =
      defaultDBsConfig && defaultDBsConfig.payload.defaultDBsConfig;
  }

  componentDidMount() {
    this.getPreferences();
    setTimeout(() => {
      this.validateForm();
    }, 1000);
  }

  async validateForm() {
    return new Promise(resolve => {
      this.props.form.validateFields(["TYPEORM_URL"], err => {
        if (err) {
          this.setState({
            isValid: false
          });
          resolve(false);
        } else {
          this.setState({
            isValid: true
          });
          resolve(true);
        }
      });
    });
  }

  setOriginalPreferences(preferences) {
    if (!preferences) {
      preferences = this.originalPrefences || {};
    }
    // remove *LOG_FILES_PATH*, 'version'
    delete preferences.LOG_FILES_PATH;
    delete preferences.version;
    if (preferences.TYPEORM_CONNECTION === "mongodb") {
      delete preferences.TYPEORM_DATABASE;
    } else if (preferences.TYPEORM_CONNECTION === "sqlite") {
      delete preferences.TYPEORM_URL;
    }
    this.originalPrefences = preferences;
    return preferences;
  }

  dynamicValidateForm() {
    // clear previous validation
    clearTimeout(this.validateFormHandler);
    setTimeout(() => {
      this.validateForm();
    }, 500);
  }

  /**
   * Get preferences and update preferences in state
   */
  getPreferences() {
    const { formatMessage, formatHTMLMessage } = this.props.intl;
    try {
      let result = ipcRendererManager.sendSync(
        IpcEvents.SYNC_GET_PREFERENCES_JSON
      );
      if (!result.status) {
        // get preferences failed
        showErrorNotification(
          formatMessage({ id: "munew.settings.error.getPreferencesTitle" }),
          formatHTMLMessage({
            id: "munew.settings.error.getPreferencesDescription"
          })
        );
        throw result.error;
      } else {
        // get preferences successfully
        // return result.payload;
        this.setOriginalPreferences(
          result.payload && result.payload.preferences
        );
        this.setState({
          preferences: this.originalPrefences
        });
      }
    } catch (err) {
      showErrorNotification(
        formatMessage({ id: "munew.settings.error.getPreferencesTitle" }),
        formatHTMLMessage({
          id: "munew.settings.error.getPreferencesDescription"
        })
      );
      throw err;
    }
  }

  onFormChange() {
    clearTimeout(this.onFormChangeHandler);
    this.onFormChangeHandler = setTimeout(() => {
      // console.log(arguments);
      let values = this.props.form.getFieldsValue();
      let { preferences } = this.state;
      if(!preferences.TYPEORM_CONNECTION){
        delete preferences.TYPEORM_CONNECTION;
      }
      if(!preferences.TYPEORM_DATABASE){
        delete preferences.TYPEORM_DATABASE;
      }
      if(!preferences.TYPEORM_URL){
        delete preferences.TYPEORM_URL;
      }
      preferences = {
        ...this.defaultDBsConfig[values["TYPEORM_CONNECTION"]],
        ...preferences,
        ...values
      };
      this.setState({
        preferences
      });
      console.log("preferences: ", preferences);
      this.dynamicValidateForm();
    }, 200);
  }

  onSavePreferences() {
    const { formatMessage } = this.props.intl;
    this.setState({
      savingPreferences: true
    });
    let isConnected = this.testDBConnection();
    if (isConnected) {
      let result = ipcRendererManager.sendSync(
        IpcEvents.SYNC_UPDATE_PREFERENCES_JSON,
        {
          preferences: this.state.preferences
        }
      );
      if (result.status) {
        this.setOriginalPreferences(this.state.preferences);
        showSuccessNotification(
          formatMessage({
            id: "munew.settings.savePreferencesSuccessful"
          })
        );
      } else {
        showErrorNotification(
          formatMessage({ id: "munew.settings.error.savePreferencesFailed" })
        );
      }
    } else {
      showErrorNotification(
        formatMessage({ id: "munew.settings.error.testDBNFailWhenSave" })
      );
    }
    this.setState({
      savingPreferences: false
    });
  }

  // test database connection
  testDBConnection() {
    const { formatMessage } = this.props.intl;
    this.setState({
      testingDBConnection: true
    });
    let dbConfig = this.props.form.getFieldsValue();
    let result = ipcRendererManager.sendSync(
      IpcEvents.SYNC_TEST_DB_CONNECTION,
      {
        dbConfig
      }
    );
    if (result && result.payload && result.payload.connected) {
      showSuccessNotification(
        formatMessage({
          id: "munew.settings.error.testDBConnectionSuccessTitle"
        })
      );
    } else {
      showErrorNotification(
        formatMessage({ id: "munew.settings.error.testDBConnectionFailTitle" })
      );
    }
    this.setState({
      testingDBConnection: false
    });

    return result && result.payload && result.payload.connected;
  }

  openDirectoryPicker() {
    remote.dialog
      .showOpenDialog({
        properties: ["openDirectory"]
      })
      .then(result => {
        if (result.canceled) {
        } else {
          const dir = result.filePaths && result.filePaths[0];
          let { preferences } = this.state;
          preferences["TYPEORM_DATABASE"] = path.join(
            dir,
            DEAULT_SQLITE_DATABASE
          );
          this.setState({
            preferences
          });
        }
      })
      .catch(err => {
        console.log(err);
      });
  }

  render() {
    const { formatMessage, formatHTMLMessage } = this.props.intl;
    const {
      getFieldDecorator,
      isFieldsTouched,
      getFieldsValue
    } = this.props.form;
    const {
      preferences,
      testingDBConnection,
      isValid,
      savingPreferences
    } = this.state;
    let disableSaveBtn = true;
    if (isFieldsTouched()) {
      // console.log('isFieldsTouched: ', isFieldsTouched());
      let currentFormValue = getFieldsValue();
      // console.log("currentFormValue: ", currentFormValue);
      // console.log("this.originalPrefences: ", this.originalPrefences);
      if (_.isEqual(currentFormValue, this.originalPrefences)) {
        disableSaveBtn = true;
      } else {
        disableSaveBtn = false;
      }
    }
    return (
      <div className="tab-panel-content general-form">
        <Title level={4}>
          <FormattedHTMLMessage id="munew.settings.dbTitle" />
        </Title>
        <p>
          <FormattedHTMLMessage id="munew.settings.dbDescription" />
        </p>
        <Form layout="vertical">
          <div className="form-item-container">
            <Form.Item
              label={formatMessage({ id: "munew.settings.dbNameTitle" })}
              style={formItemStyle}
              hasFeedback={false}
            >
              {getFieldDecorator("TYPEORM_CONNECTION", {
                initialValue: preferences.TYPEORM_CONNECTION,
                rules: [
                  {
                    required: true,
                    message: formatMessage({
                      id: "munew.settings.dbNameRequired"
                    })
                  }
                ]
              })(
                <Select
                  style={{ width: 200 }}
                  onSelect={this.onFormChange.bind(this)}
                >
                  <Option value="sqlite">SQLite</Option>
                  <Option value="mongodb">MongoDB</Option>
                </Select>
              )}
            </Form.Item>
            <div className="form-item-description">
              <FormattedHTMLMessage id="munew.settings.dbNameDescription" />
            </div>
          </div>
          {preferences.TYPEORM_CONNECTION == "sqlite" ? (
            <div className="form-item-container">
              <Form.Item
                label={formatMessage({ id: "munew.settings.dbPathTitle" })}
                style={formItemStyle}
                hasFeedback={false}
              >
                {getFieldDecorator("TYPEORM_DATABASE", {
                  initialValue: preferences.TYPEORM_DATABASE,
                  rules: [
                    {
                      required: true,
                      message: formatMessage({
                        id: "munew.settings.dbPathRequired"
                      })
                    }
                  ]
                })(
                  <div>
                    <Text code>{preferences.TYPEORM_DATABASE}</Text>
                    <Button
                      size="small"
                      onClick={this.openDirectoryPicker.bind(this)}
                      title={formatMessage({
                        id: "munew.settings.selectFolderTooltip"
                      })}
                    >
                      <Icon type="folder-open" />
                      {/* <FormattedMessage id="munew.settings.selectFolder" /> */}
                    </Button>
                  </div>
                )}
              </Form.Item>
              <div className="form-item-description">
                <FormattedHTMLMessage id="munew.settings.dbPathDescription" />
              </div>
            </div>
          ) : (
            ""
          )}
          {preferences.TYPEORM_CONNECTION != "sqlite" ? (
            <div className="form-item-container">
              <Form.Item
                label={formatMessage({ id: "munew.settings.dbURLTitle" })}
                style={formItemStyle}
                hasFeedback={false}
              >
                {getFieldDecorator("TYPEORM_URL", {
                  initialValue: preferences.TYPEORM_URL,
                  rules: [
                    {
                      required: true,
                      message: formatMessage({
                        id: "munew.settings.dbURLRequired"
                      })
                    }
                  ]
                })(<Input onKeyDown={this.onFormChange.bind(this)} />)}
              </Form.Item>
              <div className="form-item-description">
                <FormattedHTMLMessage id="munew.settings.dbURLDescription" />
              </div>
            </div>
          ) : (
            ""
          )}
        </Form>
        <div className="action-btn-container">
          <Button
            className="action-btn"
            loading={testingDBConnection}
            disabled={!isValid}
            title={formatHTMLMessage({ id: "munew.settings.testDescription" })}
            onClick={this.testDBConnection.bind(this)}
          >
            <Icon type="api" />
            <FormattedMessage id="munew.settings.test" />
          </Button>

          <Button
            className="action-btn"
            type="primary"
            disabled={!isValid || disableSaveBtn}
            loading={savingPreferences}
            title={formatHTMLMessage({
              id: "munew.settings.testAndSaveDescription"
            })}
            onClick={this.onSavePreferences.bind(this)}
          >
            <Icon type="save" />
            <FormattedMessage id="munew.settings.testAndSave" />
          </Button>

          {/* <Button
            className="action-btn"
            title={formatHTMLMessage({ id: "munew.settings.resetDescription" })}
          >
            <Icon type="hourglass" />
            <FormattedMessage id="munew.settings.reset" />
          </Button> */}
        </div>
      </div>
    );
  }
}

export default Form.create()(injectIntl(GeneralForm));
