
function getIdStr(obj) {
      return typeof obj === 'object' && obj !== null && '_id' in obj
    ? obj._id.toString()
    : obj?.toString();
}
module.exports = {
  getIdStr,
};

