var _ = require('lodash');
var Promise = require('bluebird');
var fixtures = require('../../fixtures');
var model = require("../../../models/download");
var Download = module.exports = model

Download.prototype.getSome = function(packageName) {

  return new Promise(function(resolve, reject) {
    if (packageName) {
      return resolve(fixtures.downloads[packageName]);
    } else {
      return resolve(fixtures.downloads.all);
    }
  });

};
