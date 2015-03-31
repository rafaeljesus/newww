var request = require('request');
var Promise = require('bluebird');
var _ = require('lodash');
var fmt = require('util').format;

var Download = module.exports = function (opts) {
  _.extend(this, {
    host: process.env.DOWNLOADS_API || "https://downloads-api-example.com",
    timeout: 2000,
  }, opts);
  return this;
};

Download.new = function(request) {
  var opts = {};

  opts.bearer = request.loggedInuser && request.loggedInuser.name;

  if (process.env.USE_CACHE) {
    opts.cache = require("../lib/cache");
  }
  return new Download(opts);
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

  return Promise.all([
    _this.getDaily(packageName),
    _this.getWeekly(packageName),
    _this.getMonthly(packageName),
  ]).then(function(result) {
    return {
      day: result[0],
      week: result[1],
      month: result[2]
    };
  });
};

Download.prototype.getSome = function(period, packageName) {
  var _this = this;

  var url = fmt("%s/point/last-%s", this.host, period);
  if (packageName) {
    url += "/" + packageName;
  }

  return new Promise(function(resolve, reject) {
    var opts = {
      method: "GET",
      url: url,
      json: true,
      timeout: _this.timeout,
    };

    if (_this.bearer) opts.headers = {bearer: _this.bearer};

    if (_this.cache) {
      _this.cache.get(opts, function(err, body){
        return resolve(body || null);
      });
    } else {
      request(opts, function(err, resp, body){
        return resolve(body || null);
      });
    }

  });
};
