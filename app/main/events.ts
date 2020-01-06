// Setup Event Listeners
import { getPreferencesJSON, updatePreferencesJSON, getDefaultDBsConfig } from "./preferences";
import { ipcMainManager } from "./ipc";
import { hideSettings } from "./menu";
import { IpcEvents } from "../ipc-events";
import logger from '../utils/logger';
import { testDBConnection } from '../engine-ui/src/server';
import engine from '../utils/engine';

export function setUpEventListeners() {
  ipcMainManager.on(IpcEvents.CLOSE_SETTINGS, () => {
    try {
      hideSettings();
    } catch (err) {
      logger.error("IpcEvents.CLOSE_SETTINGS failed. Error: ", err);
    }
  });

  ipcMainManager.on(IpcEvents.SYNC_GET_PREFERENCES_JSON, event => {
    try {
      event.returnValue = {
        status: true,
        payload: {
          preferences: getPreferencesJSON()
        }
      };
    } catch (err) {
      event.returnValue = {
        status: false,
        error: err
      };
    }
  });

  ipcMainManager.on(IpcEvents.SYNC_UPDATE_PREFERENCES_JSON, async(event, arg) => {
    try {
      updatePreferencesJSON(arg.preferences);
      await engine.restartEngine();
      event.returnValue = {
        status: true
      };
    } catch (err) {
      event.returnValue = {
        status: false,
        error: err
      };
    }
  });

  ipcMainManager.on(IpcEvents.SYNC_TEST_DB_CONNECTION, async(event, arg) => {
    try {
      console.log('dbConfig: ', arg.dbConfig);
      let dbConfig = {
        type: arg.dbConfig.TYPEORM_CONNECTION
      }
      if(arg.dbConfig.TYPEORM_CONNECTION === 'sqlite'){
        dbConfig.database = arg.dbConfig.TYPEORM_DATABASE;
      }else if(arg.dbConfig.TYPEORM_CONNECTION === 'mongodb'){
        dbConfig.url = arg.dbConfig.TYPEORM_URL;
      }
      console.log('SYNC_TEST_DB_CONNECTION-> dbConfig: ', dbConfig);
      let connected = await testDBConnection(dbConfig);
      console.log('connected: ', connected);
      event.returnValue = {
        status: true,
        payload:{
          connected
        }
      };
    } catch (err) {
      event.returnValue = {
        status: false,
        error: err,
        payload:{
          connected: false
        }
      };
    }
  });

  ipcMainManager.on(IpcEvents.SYNC_GET_DEFAULT_DB_CONFIGURATIONS, (event, arg) => {
    try {
      // Get default DBs Configuration
      const defaultDBsConfig = getDefaultDBsConfig();
      event.returnValue = {
        status: true,
        payload:{
          defaultDBsConfig: defaultDBsConfig
        }
      };
    } catch (err) {
      event.returnValue = {
        status: false,
        error: err
      };
    }
  });

}
