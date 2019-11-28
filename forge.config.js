/* tslint:disable */

const path = require('path')
const fs = require('fs')
const packageJson = require('./package.json')

const { version } = packageJson
const iconDir = path.resolve(__dirname, 'assets', 'icons')

module.exports = {
  hooks: {
    generateAssets: require('./tools/generateAssets')
  },
  packagerConfig: {
    name: 'Munew DIA',
    executableName: 'munew-dia',
    asar: true,
    // icon: path.resolve(__dirname, 'assets', 'icons', 'munew'),
    // TODO: FIXME?
    ignore: [
      /^\/\.vscode\//,
      /^\/tools\//
    ],
    appBundleId: 'com.munew.dia',
    appCategoryType: 'public.app-category.developer-tools',
    protocols: [{
      name: 'Munew DIA Launch Protocol',
      schemes: ['munew-dia']
    }],
    win32metadata: {
      CompanyName: 'Munew',
      OriginalFilename: 'Munew DIA',
    },
    // osxSign: {
    //   identity: 'Developer ID Application: Munew (LT94ZKYDCJ)'
    // }
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: (arch) => {
        const certificateFile = process.env.CI
          ? path.join(__dirname, 'cert.p12')
          : process.env.WINDOWS_CERTIFICATE_FILE;

        if (!certificateFile || !fs.existsSync(certificateFile)) {
          console.warn(`Warning: Could not find certificate file at ${certificateFile}`)
        }

        return {
          name: 'munew-dia',
          authors: 'Munew',
          exe: 'munew-dia.exe',
          // iconUrl: 'https://raw.githubusercontent.com/electron/fiddle/0119f0ce697f5ff7dec4fe51f17620c78cfd488b/assets/icons/fiddle.ico',
          // loadingGif: './assets/loading.gif',
          noMsi: true,
          remoteReleases: '',
          setupExe: `munew-dia-${version}-${arch}-setup.exe`,
          setupIcon: path.resolve(iconDir, 'munew.ico'),
          certificatePassword: process.env.WINDOWS_CERTIFICATE_PASSWORD,
          certificateFile
        }
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    },
    {
      name: '@electron-forge/maker-deb',
      platforms: ['linux'],
      config: {
        icon: {
          scalable: path.resolve(iconDir, 'munew.png')
        }
      }
    },
    {
      name: '@electron-forge/maker-rpm',
      platforms: ['linux']
    }
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'munew',
          name: 'dia'
        },
        draft: true,
        prerelease: false
      }
    }
  ]
}
