var request = require('request');
var Promise = require('bluebird');
var _ = require('lodash');
var fmt = require('util').format;
var URL = require('url');

var Download = module.exports = function (opts) {
  _.extend(this, {
    host: process.env.DOWNLOADS_API || "https://downloads-api-example.com",
    timeout: 2000,
  }, opts);
  return this;
};

Download.prototype.getDaily = function(packageName) {
  return this.getSome("day", packageName);
};

Download.prototype.getWeekly = function(packageName) {
  return this.getSome("week", packageName);
};

Download.prototype.getMonthly = function(packageName) {
  return this.getSome("month", packageName);
};

Download.prototype.getAll = function(packageName) {
  var _this = this;
  var result = {};

  return _this.getDaily(packageName)
    .then(function(dailies){
      result['day'] = dailies
      return _this.getWeekly(packageName)
    })
    .then(function(weeklies){
      result['week'] = weeklies
      return _this.getMonthly(packageName)
    })
    .then(function(monthlies){
      result['month'] = monthlies
      return result
    })

}

Download.prototype.getSome = function(period, packageName) {
  var _this = this;
  var results;

  var url = fmt("%s/point/last-%s", this.host, period);
  if (packageName) {
    url += "/" + packageName;
  }

  return new Promise(function(resolve, reject) {
    var opts = {url: url, json: true, timeout: _this.timeout, headers: {bearer: _this.bearer}};

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
};
