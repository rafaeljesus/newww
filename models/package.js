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
  var opts = {
    logger: request.logger
  };

  opts.bearer = request.loggedInUser && request.loggedInUser.name;
  return new Package(opts);
};

Package.prototype.get = function(name) {
  var _this = this;
  var url = fmt("%s/package/%s", this.host, name.replace("/", "%2F"));

  return new Promise(function(resolve, reject) {
    var opts = {
      url: url,
      json: true,
    };

    if (_this.bearer) { opts.headers = {bearer: _this.bearer}; }

    request.get(opts, function(err, resp, body) {
      if (err) { return reject(err); }

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

Package.prototype.update = function(name, body) {
  var _this = this;
  var url = fmt("%s/package/%s", this.host, name.replace("/", "%2F"));

  return new Promise(function(resolve, reject) {
    var opts = {
      method: "POST",
      url: url,
      json: true,
      body: _.pick(body, 'private') // remove all other props
    };

    // hapi is converting the private boolean to a string
    // so... yeah.
    if (opts.body && 'private' in opts.body) {
      opts.body.private = String(opts.body.private) === "true";
    }

    if (_this.bearer) { opts.headers = {bearer: _this.bearer}; }

    request(opts, function(err, resp, body) {
      if (err) { return reject(err); }
      if (resp.statusCode > 399) {
        err = Error('error updating package ' + name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(body);
    });
  })
  .then(function(_package) {
    return _package ? decorate(_package) : {package: name, updated: true};
  });

};

Package.prototype.list = function(options) {
  var url = URL.format({
    protocol: "https",
    host: URL.parse(this.host).hostname,
    pathname: "/package",
    query: options,
  });

  return new Promise(function(resolve, reject) {
    var opts = {
      url: url,
      json: true
    };

    request.get(opts, function(err, resp, body) {
      if (err) { return reject(err); }

      if (resp.statusCode > 399) {
        err = Error('error getting package list');
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return resolve(body);
    });
  });

};

Package.prototype.count = function() {
  var url = fmt("%s/package/-/count", this.host);
  return new Promise(function(resolve, reject) {
    var opts = {
      url: url,
      json: true
    };
    request.get(opts, function(err, resp, body) {
      if (err) { return reject(err); }
      if (resp.statusCode > 399) {
        err = Error('error getting package count');
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(body);
    });
  });
};

Package.prototype.star = function (package) {
  var _this = this;
  var url = fmt("%s/package/%s/star", _this.host, package);

  return new Promise(function (resolve, reject) {
    var opts = {
      url: url,
      json: true,
    };

    if (_this.bearer) { opts.headers = {bearer: _this.bearer}; }

    request.put(opts, function (err, resp, body) {
      if (err) {
        _this.logger.error(err);
        return reject(err);
      }

      if (resp.statusCode > 399) {
        err = Error('error starring package ' + package);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(package + ' starred by ' + _this.bearer);
    });
  });
};

Package.prototype.unstar = function (package) {
  var _this = this;
  var url = fmt("%s/package/%s/star", _this.host, package);

  return new Promise(function (resolve, reject) {
    var opts = {
      url: url,
      json: true,
    };

    if (_this.bearer) { opts.headers = {bearer: _this.bearer}; }

    request.del(opts, function (err, resp, body) {
      if (err) { return reject(err); }

      if (resp.statusCode > 399) {
        err = Error('error unstarring package ' + package);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(package + ' unstarred by ' + _this.bearer);
    });
  });
};
