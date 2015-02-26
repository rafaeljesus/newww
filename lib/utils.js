var crypto = require('crypto');

var utils = {};

utils.safeJsonParse = function safeJsonParse (str) {
  try {
    return JSON.parse(str);
  } catch (er) {
    return null;
  }
};

utils.pbkdf2 = function pbkdf2 (pass, salt, iterations) {
  return crypto.pbkdf2Sync(pass, salt, iterations, 20).toString('hex');
};

utils.sha = function sha (token) {
  return crypto.createHash('sha1').update(token).digest('hex');
};


module.exports = utils;