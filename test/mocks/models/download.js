var _ = require('lodash');
var fixtures = require('../../fixtures');

var Download = module.exports = function(opts) {
  _.extend(this, {
    host: process.env.USER_API,
    bearer: false,
  }, opts);

  return this;
};

Download.prototype.getAll = function (packageName, callback) {
  if (!callback) {
    callback = packageName;
    packageName = null;
  }

  if (packageName) {
    return callback(null, fixtures.downloads[packageName]);
  } else {
    return callback(null, fixtures.downloads.all);
  }
};
