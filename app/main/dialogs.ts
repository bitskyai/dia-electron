import { BrowserView } from 'electron';
import { IpcEvents } from '../ipc-events';
import { ipcMainManager } from './ipc';
import { getOrCreateMainWindow } from './windows';

/**
 * Listens to IPC events related to dialogs and message boxes
 *
 * @export
 */
export function setupDialogs() {
  ipcMainManager.on(IpcEvents.OPEN_SETTINGS, (_event, args) => {
    console.log("setupDialogs -> receiven message: ", IpcEvents.OPEN_SETTINGS);
    showSettings(args);
  });
}

/**
 * Shows a warning dialog
 *
 * @param {Electron.MessageBoxOptions} args
 */
function showSettings(args: Electron.MessageBoxOptions) {
  console.log('showSettings: ', args);
  let win = getOrCreateMainWindow();
  const view = new BrowserView({
    webPreferences: {
      nodeIntegration: false
    }
  })

  win.setBrowserView(view)
  view.setBounds({ x: 0, y: 0, width: 800, height: 600 })
  view.setAutoResize({
    width:true,
    height:true
  })

  setTimeout(()=>{
    // view.destory();
    win.setBrowserView(null);
  }, 10*1000);
  view.webContents.loadURL('https://electronjs.org')
}