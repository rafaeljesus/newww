var _ = require('lodash');
var Promise = require('bluebird');
var fixtures = require('../../fixtures');

var Package = module.exports = function(opts) {
  _.extend(this, {
    host: process.env.USER_API,
    bearer: false,
  }, opts);

  return this;
};

Package.prototype.get = function (name, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }

  var package = fixtures.packages[name]

  if (package) {
    package.downloads = {
      day: 1,
      week: 2,
      month: 3,
    }
    if (package.name === "request") {
      package.isStarred = true;
    }
  }

  return callback(null, package);
};


Package.prototype.list = function(options) {
  var _this = this;

  return new Promise(function(resolve, reject){

    switch (options.sort) {
      case "dependents":
        return resolve(fixtures.aggregates.most_depended_upon_packages);
        break;
      case "modified":
        return resolve(fixtures.aggregates.recently_updated_packages);
        break;
      default:
        return reject(Error("Package.list() doesn't mock that yet"));
    }

    });
}

Package.prototype.count = function() {
  return new Promise(function(resolve, reject) {
    return resolve(12345)
  });
}
