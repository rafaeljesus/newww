var request = require('request');
var Promise = require('bluebird');
var _ = require('lodash');
var fmt = require('util').format;
var presenter = require(__dirname + '/../presenters/package');

var Package = module.exports = function (opts) {
  _.extend(this, {
    host: process.env.USER_API,
    presenter: true,
    debug: false,
    bearer: false,
    request: false
  }, opts);

  if (!this.request) {
    this.request = {
      logger: {
        error: console.error,
        info: console.info
      }
    };
  }

  return this;
};

Package.prototype.log = function(msg) {
  if (this.debug) {
    this.request.logger.info(msg);
  }
};

Package.prototype.get = function(name, options, callback) {
  var _this = this;
  var package;
  var url = fmt("%s/package/%s", this.host, name);
  this.log(url);

  if (!callback) {
    callback = options;
    options = {};
  }

  return new Promise(function(resolve, reject) {
    var opts = {url: url, json: true};

    if (_this.bearer) {
      opts.headers = {bearer: _this.bearer};
    }

    request.get(opts, function(err, resp, body){
      if (err) {
        _this.request.logger.err(err);
        return reject(err);
      }
      if (resp.statusCode > 399) {
        err = Error('error getting package ' + name);
        err.statusCode = resp.statusCode;
        _this.request.logger.error(err);
        return reject(err);
      }
      if (resp.statusCode === 404) {
        return resolve(null);
      }

      return resolve(body);
    });
  })
  .then(function(_package){
    package = _package;

    if (_this.presenter) {
      package = presenter(package, _this.request);
    }

    return package;
  })
  .nodeify(callback);
};
