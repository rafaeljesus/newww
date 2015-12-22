var invalidUserName = require('npm-user-validate').username;
var URL = require('url');
var assert = require('assert');

module.exports = function(defaultPath, referrerUrl) {
  assert(typeof defaultPath !== "undefined", "The default path must be passed");

  if (typeof referrerUrl === "undefined") {
    referrerUrl = "";
  }

  var referrer = URL.parse(referrerUrl).pathname || "";
  var invalidURL = referrer.split("/").some(function(path) {
    return !!invalidUserName(path);
  });

  referrer = invalidURL ? defaultPath : referrer;

  return referrer || defaultPath;
};
