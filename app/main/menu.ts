import { Menu, shell, MenuItemConstructorOptions, app } from "electron";
import logger from "../utils/logger";
import { IpcEvents } from "../ipc-events";
import { ipcMainManager } from "./ipc";
// const isMac = process.platform === "darwin";

/**
 * Is the passed object a constructor for an Electron Menu?
 *
 * @param {(Array<Electron.MenuItemConstructorOptions> | Electron.Menu)} [submenu]
 * @returns {submenu is Array<Electron.MenuItemConstructorOptions>}
 */
function isSubmenu(
  submenu?: Array<MenuItemConstructorOptions> | Menu
): submenu is Array<MenuItemConstructorOptions> {
  return !!submenu && Array.isArray(submenu);
}

/**
 * Returns additional items for the help menu
 *
 * @returns {Array<Electron.MenuItemConstructorOptions>}
 */
function getHelpItems(): Array<MenuItemConstructorOptions> {
  return [
    {
      label: "Open Munew Repository...",
      click() {
        shell.openExternal("https://github.com/munew");
      }
    },
    {
      label: "Documents",
      click() {
        shell.openExternal("https://docs.munew.io");
      }
    },
    {
      label: "Open Munew Issue Tracker...",
      click() {
        shell.openExternal("https://github.com/munew/dia/issues");
      }
    }
  ];
}

/**
 * Returns the top-level "File" menu
 *
 * @returns {Array<Electron.MenuItemConstructorOptions>}
 */
function getFileMenu(): MenuItemConstructorOptions {
  const fileMenu: Array<MenuItemConstructorOptions> = [
    {
      label: "Save",
      click: () => ipcMainManager.send(IpcEvents.FS_SAVE_FIDDLE),
      accelerator: "CmdOrCtrl+S"
    }
  ];

  return {
    label: "File",
    submenu: fileMenu
  };
}

/**
 * Creates the app's window menu.
 */
export function setupMenu() {
  const defaultMenu = require("electron-default-menu");
  const fullmenu = defaultMenu(app, shell);
  const menus: Array<MenuItemConstructorOptions> = [];
  fullmenu.forEach((menu: MenuItemConstructorOptions) => {
    const { label } = menu;

    // Append items to "Help"
    if (label === "Help" && isSubmenu(menu.submenu)) {
      menu.submenu = getHelpItems();
    }

    if (label !== "Edit") {
      menus.push(menu);
    }
  });
  // menus.splice(process.platform === "darwin" ? 1 : 0, 0, getFileMenu());
  logger.debug("setupMenu->menu: ", JSON.stringify(menus, null, 2));
  Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
}
