var P = require('bluebird');
var _ = require('lodash');
var fmt = require('util').format;
var cache = P.promisifyAll(require('../lib/cache'));

var Download = module.exports = function(opts) {
  _.extend(this, {
    host: process.env.DOWNLOADS_API || "https://downloads-api-example.com",
    timeout: 2000,
  }, opts);
  return this;
};

Download.new = function(request) {
  var opts = {};

  opts.bearer = request.loggedInuser && request.loggedInuser.name;

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
  return P.all([
    this.getDaily(packageName),
    this.getWeekly(packageName),
    this.getMonthly(packageName),
  ]).then(function(result) {
    return {
      day: result[0],
      week: result[1],
      month: result[2]
    };
  });
};

Download.prototype.getSome = function(period, packageName) {

  var url = fmt("%s/point/last-%s", this.host, period);
  if (packageName) {
    url += "/" + packageName;
  }

  var opts = {
    method: "GET",
    url: url,
    json: true,
    timeout: this.timeout,
  };

  if (this.bearer) {
    opts.headers = {
      bearer: this.bearer
    };
  }

  return cache.getAsync(opts).catch(function() {
    return null;
  });
};
