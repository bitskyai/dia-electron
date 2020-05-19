/* tslint:disable */

const path = require("path");
const fs = require("fs");
const packageJson = require("./package.json");

const { version } = packageJson;
const iconDir = path.resolve(__dirname, "assets", "icons");

const config = {
  hooks: {
    generateAssets: require("./tools/generateAssets")
  },
  packagerConfig: {
    name: "munew",
    executableName: "munew",
    asar: true,
    icon: path.resolve(__dirname, 'assets', 'icons', 'munew'),
    ignore: [
      /^\/\.vscode/,
      /^\/tools/,
      /^\/app/,
      /^\/public/,
      /^\/scripts/,
      /^\/forge\.config\.js/,
      /^\/yarn-error\.log/,
      /^\/\.gitignore/,
      /^\/tslint\.json/,
      /^\/tsconfig\.json/,
      /^\/README\.md/,
      /^\/yarn\.lock/,
      /^\/package-lock\.json/,
      /^\/LICENSE/
    ],
    appBundleId: "com.munew",
    appCategoryType: "public.app-category.developer-tools",
    protocols: [
      {
        name: "Munew Launch Protocol",
        schemes: ["munew"]
      }
    ],
    win32metadata: {
      CompanyName: "Munew",
      OriginalFilename: "Munew"
    }
    // osxSign: {
    //   identity: 'Developer ID Application: Munew (LT94ZKYDCJ)'
    // }
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      platforms: ["win32"],
      config: arch => {
        const certificateFile = process.env.CI
          ? path.join(__dirname, "cert.p12")
          : process.env.WINDOWS_CERTIFICATE_FILE;

        if (!certificateFile || !fs.existsSync(certificateFile)) {
          console.warn(
            `Warning: Could not find certificate file at ${certificateFile}`
          );
        }

        return {
          name: "Munew",
          authors: "Munew",
          exe: "Munew.exe",
          // iconUrl: 'https://raw.githubusercontent.com/electron/fiddle/0119f0ce697f5ff7dec4fe51f17620c78cfd488b/assets/icons/fiddle.ico',
          // loadingGif: './assets/loading.gif',
          noMsi: true,
          remoteReleases: "",
          setupExe: `Munew-${version}-${arch}-setup.exe`,
          setupIcon: path.resolve(iconDir, "munew.ico"),
          certificatePassword: process.env.WINDOWS_CERTIFICATE_PASSWORD,
          certificateFile
        };
      }
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"]
    },
    {
      name: "@electron-forge/maker-deb",
      platforms: ["linux"],
      config: {
        icon: {
          scalable: path.resolve(iconDir, "munew.svg")
        }
      }
    },
    // {
    //   name: "@electron-forge/maker-rpm",
    //   platforms: ["linux"]
    // }
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "munew",
          name: "dia"
        },
        draft: true,
        prerelease: false
      }
    }
  ]
};

function notarizeMaybe() {
  if (process.platform !== "darwin") {
    return;
  }

  if (!process.env.CI) {
    console.log(`Not in CI, skipping notarization`);
    return;
  }

  if (!process.env.APPLE_ID || !process.env.APPLE_ID_PASSWORD) {
    console.warn(
      "Should be notarizing, but environment variables APPLE_ID or APPLE_ID_PASSWORD are missing!"
    );
    return;
  }

  config.packagerConfig.osxNotarize = {
    appBundleId: "com.electron.fiddle",
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASSWORD,
    ascProvider: "LT94ZKYDCJ"
  };
}

notarizeMaybe();

// Finally, export it
module.exports = config;
