const { compileParcel } = require("./parcel");
module.exports = async () => {
  await Promise.all([compileParcel()]);
};
