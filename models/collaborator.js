var Request = require('../lib/external-request');
var Promise = require('bluebird');
var _ = require('lodash');
var fmt = require('util').format;
var decorate = require(__dirname + '/../presenters/collaborator');

var Collaborator = module.exports = function(opts) {
  _.extend(this, {
    host: process.env.USER_API || "https://user-api-example.com",
    bearer: false
  }, opts);

  return this;
};

Collaborator.new = function(request) {
  var bearer = request.loggedInUser && request.loggedInUser.name;
  return new Collaborator({
    bearer: bearer
  });
};

Collaborator.prototype.list = function(pkg, callback) {
  var _this = this;
  var url = fmt("%s/package/%s/collaborators", this.host, pkg.replace("/", "%2F"));

  return new Promise(function(resolve, reject) {
    var opts = {
      method: "GET",
      url: url,
      json: true,
    };

    if (_this.bearer) {
      opts.headers = {
        bearer: _this.bearer
      };
    }

    Request(opts,
      function(err, resp, body) {
        if (err) {
          return reject(err);
        }
        if (resp.statusCode > 399) {
          err = Error(fmt("error getting collaborators for package '%s': %s)", pkg, resp.body));
          err.statusCode = resp.statusCode;
          return reject(err);
        }

        Object.keys(body).forEach(function(username) {
          body[username] = decorate(body[username], pkg);
        });

        return resolve(body);
      });
  }).nodeify(callback);
};

Collaborator.prototype.add = function(pkg, collaborator, callback) {
  var _this = this;
  var url = fmt("%s/package/%s/collaborators", this.host, pkg.replace("/", "%2F"));

  return new Promise(function(resolve, reject) {
    var opts = {
      method: "PUT",
      url: url,
      json: true,
      body: collaborator
    };

    if (_this.bearer) {
      opts.headers = {
        bearer: _this.bearer
      };
    }

    Request(opts, function(err, resp, body) {
      if (err) {
        return reject(err);
      }
      if (resp.statusCode > 399) {
        err = Error(fmt("error adding collaborator to package '%s': %s)", pkg, resp.body));
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(decorate(body), pkg);
    });
  }).nodeify(callback);
};


Collaborator.prototype.update = function(pkg, collaborator, callback) {
  var _this = this;
  var url = fmt("%s/package/%s/collaborators/%s", this.host, pkg.replace("/", "%2F"), collaborator.name);

  var opts = {
    method: "POST",
    url: url,
    json: true,
    body: collaborator,
  };

  if (_this.bearer) {
    opts.headers = {
      bearer: _this.bearer
    };
  }

  return new Promise(function(resolve, reject) {
    Request(opts, function(err, resp, body) {
      if (err) {
        return reject(err);
      }
      if (resp.statusCode > 399) {
        err = Error(fmt("error updating collaborator access to package '%s': %s)", pkg, resp.body));
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(decorate(body), pkg);
    });
  }).nodeify(callback);
};

Collaborator.prototype.del = function(pkg, collaboratorName, callback) {
  var _this = this;
  var url = fmt("%s/package/%s/collaborators/%s", this.host, pkg.replace("/", "%2F"), collaboratorName);

  return new Promise(function(resolve, reject) {

    var opts = {
      method: "DELETE",
      url: url,
      json: true,
    };

    if (_this.bearer) {
      opts.headers = {
        bearer: _this.bearer
      };
    }

    Request(opts, function(err, resp, body) {
      if (err) {
        return reject(err);
      }
      if (resp.statusCode > 399) {
        err = Error(fmt("error removing collaborator from package '%s': %s)", pkg, resp.body));
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve({
        package: pkg,
        username: collaboratorName,
        deleted: true
      });
    });
  }).nodeify(callback);
};
