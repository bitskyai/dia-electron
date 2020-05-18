const zip = require("cross-zip");
const fs = require("fs-extra");
const path = require("path");
const glob = require("glob");

let files = glob.sync(path.join(__dirname, "../out/make/**/*.zip"));
if(!files.length){
  // then make the whole make folder as a zip
  zip.zipSync(path.join(__dirname, "../out/make"), path.join(__dirname, "../out/munew.zip"));
}else{
  files.forEach((file) => {
    fs.copySync(file, path.join(__dirname, "../out/munew.zip"));
  });
}
