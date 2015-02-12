var _ = require('lodash');
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
    console.log("wtf")
    if (package.name === "request") {
      package.isStarred = true;
    }
  }

  return callback(null, package);
};
