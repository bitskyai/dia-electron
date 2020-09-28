// Setup Event Listeners
import { dialog } from "electron";
import * as fs from "fs-extra";
import * as path from "path";
import {
  getPreferencesJSON,
  updatePreferencesJSON,
  getDefaultDBsConfig,
} from "./preferences";
import { ipcMainManager } from "./ipc";
import { hideSettings, showSettings } from "./menu";
import { IpcEvents } from "../ipc-events";
import logger from "../utils/logger";
import { testDBConnection } from "../web-app/build/server";
import supplier from "../utils/supplier";
import RetailerManager from "../utils/retailer-manager";
import { getOrCreateRetailerEditorWindow } from "./retailerEditorWindows";
import {
  getFileContent,
  updateFileContent,
  copyDefaultRetailer,
} from "../utils/retailer-file-manager";

export function setUpEventListeners() {
  ipcMainManager.on(IpcEvents.CLOSE_SETTINGS, () => {
    try {
      hideSettings();
    } catch (err) {
      logger.error("IpcEvents.CLOSE_SETTINGS failed. Error: ", err);
    }
  });

  ipcMainManager.on(IpcEvents.SYNC_SUPPLIER_UI_TO_MAIN, async (event, body) => {
    const subject = body && body.subject;
    switch (subject) {
      case "common/openDirectoryPicker":
        dialog
          .showOpenDialog({
            properties: ["openDirectory", "showHiddenFiles"],
          })
          .then((result) => {
            if (result.canceled) {
              event.returnValue = {
                status: true,
                directory: undefined,
              };
            } else {
              const dir = result.filePaths && result.filePaths[0];
              event.returnValue = {
                status: true,
                directory: dir,
              };
            }
          })
          .catch((err) => {
            console.log(err);
            event.returnValue = {
              status: false,
              error: err,
              directory: undefined,
            };
          });
        break;
      case "common/isUserDataDirectory":
        let isUserDataDir = {
          validPath: false,
          userDataDir: false,
        };

        try {
          let userDataDir = body.data.directory;
          const exist = fs.pathExistsSync(userDataDir);
          if (exist) {
            isUserDataDir.validPath = true;
            // now check whether it is a user data directory
            // it should have a default folder if it is a Chrome User Data Directory
            const defaultFolder = path.join(userDataDir, "Default");
            isUserDataDir.userDataDir = fs.pathExistsSync(defaultFolder);
          }
        } catch (err) {
          logger.error(
            `common/isUserDataDirectory failed. Error: ${err.message}`,
            { error: err, body: body }
          );
        }

        event.returnValue = isUserDataDir;
        break;
      case "retailerEditor/open":
        let retailerEditorWindow = getOrCreateRetailerEditorWindow();
        retailerEditorWindow.show();
        retailerEditorWindow.focus();
        event.returnValue = {
          status: true,
        };
        break;
      case "settings/open":
        showSettings();
        event.returnValue = {
          status: true,
        };
        break;
    }
  });

  ipcMainManager.on(IpcEvents.OPEN_RETAILER_EDITOR, () => {
    try {
      // let retailerEditorWindow: Electron.BrowserWindow | null = null;
      console.log("****IpcEvents.OPEN_RETAILER_EDITOR");
      let retailerEditorWindow = getOrCreateRetailerEditorWindow();
      retailerEditorWindow.show();
      retailerEditorWindow.focus();
    } catch (err) {
      logger.error("IpcEvents.OPEN_RETAILER_EDITOR failed. Error: ", err);
    }
  });

  ipcMainManager.on(IpcEvents.CLOSE_RETAILER_EDITOR, () => {
    try {
      // let retailerEditorWindow: Electron.BrowserWindow | null = null;
      let retailerEditorWindow = getOrCreateRetailerEditorWindow();
      retailerEditorWindow.close();
    } catch (err) {
      logger.error("IpcEvents.CLOSE_RETAILER_EDITOR failed. Error: ", err);
    }
  });

  ipcMainManager.on(IpcEvents.SYNC_GET_PREFERENCES_JSON, (event) => {
    try {
      event.returnValue = {
        status: true,
        payload: {
          preferences: getPreferencesJSON(),
        },
      };
    } catch (err) {
      event.returnValue = {
        status: false,
        error: err,
      };
    }
  });

  ipcMainManager.on(
    IpcEvents.SYNC_UPDATE_PREFERENCES_JSON,
    async (event, arg) => {
      try {
        updatePreferencesJSON(arg.preferences);
        await supplier.restartSupplier();
        event.returnValue = {
          status: true,
        };
      } catch (err) {
        event.returnValue = {
          status: false,
          error: err,
        };
      }
    }
  );

  ipcMainManager.on(IpcEvents.SYNC_TEST_DB_CONNECTION, async (event, arg) => {
    try {
      console.log("dbConfig: ", arg.dbConfig);
      let dbConfig = {
        type: arg.dbConfig.TYPEORM_CONNECTION,
      };
      if (arg.dbConfig.TYPEORM_CONNECTION === "sqlite") {
        dbConfig.database = arg.dbConfig.TYPEORM_DATABASE;
      } else if (arg.dbConfig.TYPEORM_CONNECTION === "mongodb") {
        dbConfig.url = arg.dbConfig.TYPEORM_URL;
      }
      console.log("SYNC_TEST_DB_CONNECTION-> dbConfig: ", dbConfig);
      let connected = await testDBConnection(dbConfig);
      console.log("connected: ", connected);
      event.returnValue = {
        status: true,
        payload: {
          connected,
        },
      };
    } catch (err) {
      event.returnValue = {
        status: false,
        error: err,
        payload: {
          connected: false,
        },
      };
    }
  });

  ipcMainManager.on(IpcEvents.SYNC_GET_DEFAULT_DB_CONFIGURATIONS, (event) => {
    try {
      // Get default DBs Configuration
      const defaultDBsConfig = getDefaultDBsConfig();
      event.returnValue = {
        status: true,
        payload: {
          defaultDBsConfig: defaultDBsConfig,
        },
      };
    } catch (err) {
      event.returnValue = {
        status: false,
        error: err,
      };
    }
  });

  // get Retailer file content by path
  /*
     arg = {
       filePath
     }
     */
  ipcMainManager.on(IpcEvents.SYNC_RETAILER_GET_FILE_CONTENT, (event, arg) => {
    try {
      event.returnValue = {
        status: true,
        fileContent: getFileContent(arg.filePath),
      };
    } catch (err) {
      event.returnValue = {
        status: false,
      };
    }
  });

  // update Retailer file content
  /*
      arg = {
        filePath,
        fileContent
      }
     */
  ipcMainManager.on(
    IpcEvents.SYNC_RETAILER_UPDATE_FILE_CONTENT,
    (event, arg) => {
      try {
        updateFileContent(arg.filePath, arg.fileContent);
        event.returnValue = {
          status: true,
        };
        if (arg.filePath.search(/\.js\s*$/)!=-1) {
          RetailerManager.needToRestart = true;
          ipcMainManager.sendToRetailerEditor(
            IpcEvents.UPDATE_RETAILER_STATUS,
            [
              {
                status: "update",
                payload: {
                  status: RetailerManager.status(),
                },
              },
            ]
          );
        }
      } catch (err) {
        event.returnValue = {
          status: false,
        };
      }
    }
  );

  // reset Retailer to default
  ipcMainManager.on(IpcEvents.SYNC_RETAILER_STATUS, async (event) => {
    try {
      let status = await RetailerManager.status();
      event.returnValue = {
        status,
      };
    } catch (err) {
      logger.error(`${IpcEvents.SYNC_RETAILER_STATUS} error: `, err);
      event.returnValue = {
        status: undefined,
        error: err,
      };
    }
  });

  // reset Retailer to default
  ipcMainManager.on(IpcEvents.SYNC_RETAILER_RESET_TO_DEFAULT, (event) => {
    try {
      copyDefaultRetailer(true);
      event.returnValue = {
        status: true,
      };
      RetailerManager.needToRestart = true;
      ipcMainManager.sendToRetailerEditor(IpcEvents.UPDATE_RETAILER_STATUS, [
        {
          status: "update",
          payload: {
            status: RetailerManager.status(),
          },
        },
      ]);
    } catch (err) {
      event.returnValue = {
        status: false,
      };
    }
  });

  // reset stop Retailer server
  ipcMainManager.on(IpcEvents.STOP_RETAILER_SERVER, () => {
    try {
      RetailerManager.stopRetailer();
    } catch (err) {
      logger.error(`${IpcEvents.STOP_RETAILER_SERVER} error: `, err);
    }
  });

  // reset start Retailer server
  ipcMainManager.on(IpcEvents.START_RETAILER_SERVER, () => {
    try {
      RetailerManager.runRetailer();
    } catch (err) {
      logger.error(`${IpcEvents.START_RETAILER_SERVER} error: `, err);
    }
  });

  ipcMainManager.on(IpcEvents.DOWNLOAD_ELECTRON, () => {
    try {
      RetailerManager.downloadElectron();
    } catch (err) {
      logger.error(`${IpcEvents.DOWNLOAD_ELECTRON} error: `, err);
    }
  });
}
