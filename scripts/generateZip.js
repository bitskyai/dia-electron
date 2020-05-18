const zip = require("cross-zip");
const fs = require("fs-extra");
const path = require("path");
const glob = require("glob");

const files = glob.sync(path.join(__dirname, "../out/make/**/*.zip"));
// console.log(files);
files.forEach((file) => {
  fs.copySync(file, path.join(__dirname, "../out/munew.zip"));
});
