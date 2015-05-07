var crypto = require('crypto');
var moment = require('moment-tokens');

var utils = {};

utils.safeJsonParse = function safeJsonParse (str) {
  try {
    return JSON.parse(str);
  } catch (er) {
    return null;
  }
};

utils.sha = function sha (token) {
  return crypto.createHash('sha1').update(token).digest('hex');
};

utils.toCommonLogFormat = function toCommonLogFormat (resp) {

  var method = resp.request.method,
      path = resp.request.uri.href,
      httpProtocol = 'HTTP/' + resp.httpVersion;

  var clientIp = '-',
      clientId = process.env.CANONICAL_HOST,
      userid = '-',
      time = '[' + moment().strftime('%d/%b/%Y:%H:%M:%S %z') + ']',
      requestLine = '"' + [method, path, httpProtocol].join(' ') + '"',
      statusCode = resp.statusCode,
      objectSize = '-';

  return [clientIp, clientId, userid, time, requestLine, statusCode, objectSize].join(' ');
};

utils.getUserIP = function (request) {
  console.log(request.headers)
  console.log(request.info)
  var IP = request.headers['fastly-client-ip'] || request.headers['fastly-client-ip'] || "unknown";
  console.log('===IP===', IP)
  return IP;
};

module.exports = utils;