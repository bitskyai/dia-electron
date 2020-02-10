import { AboutPanelOptionsOptions, app } from 'electron';

/**
 * Sets Fiddle's About panel options on Linux and macOS
 *
 * @returns
 */
export function setupAboutPanel(): void {
  if (process.platform === 'win32') return;

  const options: AboutPanelOptionsOptions = {
    applicationName: 'Munew DIA',
    applicationVersion: app.getVersion(),
    version: process.versions.electron,
    copyright: '© munew.io',
  };

  // TODO: need to implement about page information
  switch (process.platform) {
    case 'linux':
      options.website = 'https://munew.io';
      break;
    case 'darwin':
      options.credits = 'https://munew.io';
      break;
    default:
      // fallthrough
      options.credits = 'https://munew.io';
  }

  console.log("About Panel Options: ", options);

  app.setAboutPanelOptions(options);
}
