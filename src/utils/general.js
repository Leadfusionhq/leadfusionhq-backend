function randomNumberGenerate(length) {
  let result = '';
  const characters = '0123456789';
  const charactersLength = characters?.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return String(result);
}

function isEmpty(str) {
  let string = typeof str === 'string' ? str.replace(/\s/g, '') : str;
  string = typeof string === 'number' ? string.toString() : string;
  string = isJsonObj(string) && Object.keys(string)?.length === 0 ? '' : string;
  string = isJsonStr(string) && Object.keys(JSON.parse(string))?.length === 0 ? '' : string;
  return (
    typeof string === 'undefined' ||
    !string ||
    string?.length === 0 ||
    string === '' ||
    string === '0000-00-00 00:00:00' ||
    string === null
  );
}
function isJsonObj(obj) {
  if (typeof obj !== 'object') return false;
  try {
    const type = Object.prototype.toString.call(obj).toLowerCase();
    return type === '[object object]' || type === '[object array]';
  } catch (err) {
    return false;
  }
}
function isJsonStr(str) {
  if (typeof str !== 'string') return false;
  try {
    const result = JSON.parse(str);
    const type = Object.prototype.toString.call(result).toLowerCase();
    return type === '[object object]' || type === '[object array]';
  } catch (err) {
    return false;
  }
}
module.exports = {
  randomNumberGenerate,
  isEmpty,
  isJsonStr,
  isJsonObj,
};
