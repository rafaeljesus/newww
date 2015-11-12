var decorate = require(__dirname + '/../presenters/collaborator');
var fmt = require('util').format;
var P = require('bluebird');
var Request = require('../lib/external-request');
var USER_HOST = process.env.USER_API || "https://user-api-example.com";

var Collaborator = module.exports = function(bearer) {
  if (!(this instanceof Collaborator)) {
    return new Collaborator(bearer);
  }

  this.bearer = bearer;
  return this;
};

Collaborator.prototype.list = function(pkg, callback) {
  var self = this;
  var url = fmt("%s/package/%s/collaborators", USER_HOST, pkg.replace("/", "%2F"));

  return new P(function(resolve, reject) {
    var opts = {
      method: "GET",
      url: url,
      json: true,
    };

    if (self.bearer) {
      opts.headers = {
        bearer: self.bearer
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
  }).asCallback(callback);
};

Collaborator.prototype.add = function(pkg, collaborator, callback) {
  var self = this;
  var url = fmt("%s/package/%s/collaborators", USER_HOST, pkg.replace("/", "%2F"));

  return new P(function(resolve, reject) {
    var opts = {
      method: "PUT",
      url: url,
      json: true,
      body: collaborator
    };

    if (self.bearer) {
      opts.headers = {
        bearer: self.bearer
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
  }).asCallback(callback);
};


Collaborator.prototype.update = function(pkg, collaborator, callback) {
  var self = this;
  var url = fmt("%s/package/%s/collaborators/%s", USER_HOST, pkg.replace("/", "%2F"), collaborator.name);

  var opts = {
    method: "POST",
    url: url,
    json: true,
    body: collaborator,
  };

  if (self.bearer) {
    opts.headers = {
      bearer: self.bearer
    };
  }

  return new P(function(resolve, reject) {
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
  }).asCallback(callback);
};

Collaborator.prototype.del = function(pkg, collaboratorName, callback) {
  var self = this;
  var url = fmt("%s/package/%s/collaborators/%s", USER_HOST, pkg.replace("/", "%2F"), collaboratorName);

  return new P(function(resolve, reject) {

    var opts = {
      method: "DELETE",
      url: url,
      json: true,
    };

    if (self.bearer) {
      opts.headers = {
        bearer: self.bearer
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
  }).asCallback(callback);
};
