import { AboutPanelOptionsOptions, app } from 'electron';

/**
 * Sets Fiddle's About panel options on Linux and macOS
 *
 * @returns
 */
export function setupAboutPanel(): void {
  if (process.platform === 'win32') return;

  const options: AboutPanelOptionsOptions = {
    applicationName: 'BitSky',
    applicationVersion: app.getVersion(),
    version: process.versions.electron,
    copyright: '© bitsky.ai',
  };

  // TODO: need to implement about page information
  switch (process.platform) {
    case 'linux':
      options.website = 'https://bitsky.ai';
      break;
    case 'darwin':
      options.credits = 'https://bitsky.ai';
      break;
    default:
      // fallthrough
      options.credits = 'https://bitsky.ai';
  }

  console.log("About Panel Options: ", options);

  app.setAboutPanelOptions(options);
}
