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


Package.prototype.list = function(options, callback) {
  var _this = this;

  if (!callback) {
    callback = options;
    options = {};
  }

  console.log("options", options)

  return new Promise(function(resolve, reject){
    if (options.sort === "depended") {
      return resolve(fixtures.aggregates.most_depended_upon_packages);
    }

    if (options.sort === "modified") {
      return resolve(fixtures.aggregates.recently_updated_packages);
    }
    
    return reject(Error("Package.list() doesn't mock that yet"));
  });

}
