var _        = require('lodash');
var cache    = require('../lib/cache');
var decorate = require(__dirname + '/../presenters/package');
var fmt      = require('util').format;
var P        = require('bluebird');
var Request  = require('../lib/external-request');
var URL      = require('url');

var Package = module.exports = function(opts) {
  _.extend(this, {
    host: process.env.USER_API || "https://user-api-example.com",
    bearer: false
  }, opts);

  return this;
};

Package.new = function(request) {
  var opts = {
    bearer: request.loggedInUser && request.loggedInUser.name
  };

  return new Package(opts);
};

Package.prototype.generatePackageOpts = function generatePackageOpts(name) {
  var opts = {
    url: fmt("%s/package/%s", this.host, name.replace("/", "%2F")),
    json: true
  };

  if (this.bearer) { opts.headers = { bearer: this.bearer }; }

  return opts;
};

Package.prototype.get = function(name) {
  var opts = this.generatePackageOpts(name);

  return cache.getP(opts)
  .then(function(_package) {
    return decorate(_package);
  });

};

Package.prototype.dropCache = function dropCache(name) {
  return cache.dropP(this.generatePackageOpts(name));
};

Package.prototype.update = function(name, body) {

  var url = fmt("%s/package/%s", this.host, name.replace("/", "%2F"));
  var opts = {
    method: "POST",
    url: url,
    json: true,
    body: _.pick(body, 'private') // remove all other props
  };

  // hapi is converting the private boolean to a string
  // so... yeah.
  if (opts.body && 'private' in opts.body) {
    opts.body.private = (String(opts.body.private) === "true");
  }

  if (this.bearer) { opts.headers = {bearer: this.bearer}; }

  return this.dropCache(name)
  .then(function() {
    return new P(function(resolve, reject) {
      Request(opts, function(err, resp, body) {
        if (err) { return reject(err); }
        if (resp.statusCode > 399) {
          err = Error('error updating package ' + name);
          err.statusCode = resp.statusCode;
          return reject(err);
        }
        return resolve(body);
      });
    });
  })
  .then(function(_package) {
    return _package ? decorate(_package) : {package: name, updated: true};
  });
};

Package.prototype.list = function(options, ttl) {
  var urlBits = {
    protocol: "https",
    host: URL.parse(this.host).hostname,
    pathname: "/package",
    query: options,
  };

  if (process.env.REMOTE_DEV) {
    urlBits.protocol = "http";
  }

  var opts = {
    url: URL.format(urlBits),
    json: true,
    ttl: ttl || 500 // seconds
  };

  return cache.getP(opts);
};

Package.prototype.count = function() {
  var url = fmt("%s/package/-/count", this.host);
  var opts = {
    url: url,
    json: true
  };

  return cache.getP(opts);
};

Package.prototype.star = function (package) {

  var _this = this;
  var url = fmt("%s/package/%s/star", _this.host, encodeURIComponent(package));
  var opts = {
    url: url,
    json: true,
  };

  if (_this.bearer) { opts.headers = {bearer: _this.bearer}; }

  return this.dropCache(package)
  .then(function() {
    return new P(function (resolve, reject) {

      Request.put(opts, function (err, resp, body) {
        if (err) { return reject(err); }
        if (resp.statusCode > 399) {
          err = Error('error starring package ' + package);
          err.statusCode = resp.statusCode;
          return reject(err);
        }

        return resolve(package + ' starred by ' + _this.bearer);
      });
    });
  });
};

Package.prototype.unstar = function (package) {

  var _this = this;
  var url = fmt("%s/package/%s/star", _this.host, encodeURIComponent(package));
  var opts = {
    url: url,
    json: true,
  };

  if (_this.bearer) { opts.headers = {bearer: _this.bearer}; }

  return this.dropCache(package)
  .then(function() {
    return new P(function (resolve, reject) {

      Request.del(opts, function (err, resp, body) {
        if (err) { return reject(err); }

        if (resp.statusCode > 399) {
          err = Error('error unstarring package ' + package);
          err.statusCode = resp.statusCode;
          return reject(err);
        }

        return resolve(package + ' unstarred by ' + _this.bearer);
      });
    });
  });
};
