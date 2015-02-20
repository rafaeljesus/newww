var request = require('request');
var Promise = require('bluebird');
var _ = require('lodash');
var fmt = require('util').format;
var decorate = require(__dirname + '/../presenters/package');

var Package = module.exports = function (opts) {
  _.extend(this, {
    host: process.env.USER_API,
    bearer: false
  }, opts);

  return this;
};

Package.prototype.get = function(name, options, callback) {
  var _this = this;
  var package;
  var url = fmt("%s/package/%s", this.host, name);

  if (!callback) {
    callback = options;
    options = {};
  }

  return new Promise(function(resolve, reject) {
    var opts = {url: url, json: true, headers: {bearer: _this.bearer}};

    request.get(opts, function(err, resp, body){
      if (err) {
        return reject(err);
      }

      if (resp.statusCode > 399) {
        err = Error('error getting package ' + name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return resolve(body);
    });
  })
  .then(function(_package){
    return decorate(_package);
  })
  .nodeify(callback);
};
