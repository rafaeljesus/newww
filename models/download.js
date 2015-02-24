var request = require('request');
var Promise = require('bluebird');
var _ = require('lodash');
var fmt = require('util').format;
var URL = require('url');

var Download = module.exports = function (opts) {
  _.extend(this, {
    host: process.env.DOWNLOADS_API,
    timeout: 2000,
  }, opts);

  return this;
};


Download.prototype.getDaily = function(packageName, callback) {
  return this.getSome("day", packageName, callback);
};

Download.prototype.getWeekly = function(packageName, callback) {
  return this.getSome("week", packageName, callback);
};

Download.prototype.getMonthly = function(packageName, callback) {
  return this.getSome("month", packageName, callback);
};


Download.prototype.getSome = function(period, packageName, callback) {
  var _this = this;
  var results;
  var url = fmt("%s/point/last-%s", this.host, period);

  if (!callback) {
    callback = packageName;
    packageName = null;
  }

  if (packageName) {
    url += "/" + packageName;
  }

  return new Promise(function(resolve, reject) {
    var opts = {url: url, json: true, timeout: _this.timeout};

    request.get(opts, function(err, resp, body){
      if (err) {
        return reject(err);
      }

      if (resp.statusCode > 399) {
        var msg = 'error getting downloads for period ' + period;
        msg += ' for ' + (packageName || "all packages");
        err = Error(msg);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return resolve(body);
    });
  })
  .nodeify(callback);
};
