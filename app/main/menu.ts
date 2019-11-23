import { Menu, shell } from "electron";
// const isMac = process.platform === "darwin";

/**
 * Creates the app's window menu.
 */
export function setupMenu() {
  let menu = [
    {
      label: "Document",
      click() {
        shell.openExternal("https://docs.munew.io");
      }
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
}
