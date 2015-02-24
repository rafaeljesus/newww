var util = require('util');
var _ = require('lodash');
var Promise = require('bluebird');
var fixtures = require('../../fixtures');

var Download = module.exports = function (opts) {
  _.extend(this, {
    host: process.env.DOWNLOADS_API,
    timeout: 2000,
  }, opts);
  return this;
};

util.inherits(Download, require("../../../models/download"))

Download.prototype.getSome = function(packageName) {

  return new Promise(function(resolve, reject) {
    if (packageName) {
      return resolve(fixtures.downloads[packageName]);
    } else {
      return resolve(fixtures.downloads.all);
    }
  });

};
