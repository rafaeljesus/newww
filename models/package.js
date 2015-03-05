var request = require('request');
var Promise = require('bluebird');
var _ = require('lodash');
var fmt = require('util').format;
var URL = require('url');
var decorate = require(__dirname + '/../presenters/package');

var Package = module.exports = function(opts) {
  _.extend(this, {
    host: process.env.USER_API || "https://user-api-example.com",
    bearer: false
  }, opts);

  return this;
};

Package.new = function(request) {
  var bearer = request.auth.credentials && request.auth.credentials.name;
  return new Package({bearer: bearer});
}

Package.prototype.get = function(name, options) {
  var _this = this;
  var package;
  var url = fmt("%s/package/%s", this.host, name.replace("/", "%2F"));

  return new Promise(function(resolve, reject) {
    var opts = {
      url: url,
      json: true,
      headers: {bearer: _this.bearer}
    };

    request.get(opts, function(err, resp, body) {
      if (err) return reject(err);

      if (resp.statusCode > 399) {
        err = Error('error getting package ' + name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return resolve(body);
    });
  })
  .then(function(_package) {
    return decorate(_package);
  });

};

Package.prototype.list = function(options) {
  var _this = this
  var url = URL.format({
    protocol: "https",
    host: URL.parse(this.host).hostname,
    pathname: "/package",
    query: options,
  })

  return new Promise(function(resolve, reject) {
    var opts = {
      url: url,
      json: true
    };

    request.get(opts, function(err, resp, body) {
      if (err) return reject(err);

      if (resp.statusCode > 399) {
        err = Error('error getting package list');
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return resolve(body);
    });
  });

}

Package.prototype.count = function() {
  var url = fmt("%s/package/-/count", this.host);
  return new Promise(function(resolve, reject) {
    var opts = {
      url: url,
      json: true
    };
    request.get(opts, function(err, resp, body) {
      if (err) return reject(err);
      if (resp.statusCode > 399) {
        err = Error('error getting package count');
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(body);
    });
  });
}
