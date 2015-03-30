var request = require('request');
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
  var bearer = request.auth.credentials && request.auth.credentials.name;
  return new Collaborator({bearer: bearer});
};

Collaborator.prototype.list = function(package, callback) {
  var _this = this;
  var url = fmt("%s/package/%s/collaborators", this.host, package.replace("/", "%2F"));

  return new Promise(function(resolve, reject) {
    var opts = {
      method: "GET",
      url: url,
      json: true,
    };

    if (_this.bearer) { opts.headers = {bearer: _this.bearer}; }

    request(opts,
      function(err, resp, body) {
        if (err) {return reject(err);}
        if (resp.statusCode > 399) {
          err = Error(fmt("error getting collaborators for package '%s': %s)", package, resp.body));
          err.statusCode = resp.statusCode;
          return reject(err);
        }

        Object.keys(body).forEach(function(username){
          body[username] = decorate(body[username], package);
        });

        return resolve(body);
      });
  }).nodeify(callback);
};

Collaborator.prototype.add = function(package, collaborator, callback) {
  var _this = this;
  var url = fmt("%s/package/%s/collaborators", this.host, package.replace("/", "%2F"));

  return new Promise(function(resolve, reject) {
    var opts = {
      method: "PUT",
      url: url,
      json: true,
      body: collaborator
    };

    if (_this.bearer) { opts.headers = {bearer: _this.bearer}; }

    request(opts, function(err, resp, body) {
      if (err) { return reject(err); }
      if (resp.statusCode > 399) {
        err = Error(fmt("error adding collaborator to package '%s': %s)", package, resp.body));
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(decorate(body), package);
    });
  }).nodeify(callback);};


Collaborator.prototype.update = function(package, collaborator, callback) {
  var _this = this;
  var url = fmt("%s/package/%s/collaborators/%s", this.host, package.replace("/", "%2F"), collaborator.name);

  var opts = {
    method: "POST",
    url: url,
    json: true,
    body: collaborator,
  };

  if (_this.bearer) { opts.headers = {bearer: _this.bearer}; }

  return new Promise(function(resolve, reject) {
    request(opts, function(err, resp, body) {
      if (err) { return reject(err); }
      if (resp.statusCode > 399) {
        err = Error(fmt("error updating collaborator access to package '%s': %s)", package, resp.body));
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(decorate(body), package);
    });
  }).nodeify(callback);};

Collaborator.prototype.del = function(package, collaboratorName, callback) {
  var _this = this;
  var url = fmt("%s/package/%s/collaborators/%s", this.host, package.replace("/", "%2F"), collaboratorName);

  return new Promise(function (resolve, reject) {

    var opts = {
      method: "DELETE",
      url: url,
      json: true,
    };

    if (_this.bearer) { opts.headers = {bearer: _this.bearer}; }

    request(opts, function(err, resp, body){
      if (err) { return reject(err); }
      if (resp.statusCode > 399) {
        err = Error(fmt("error removing collaborator from package '%s': %s)", package, resp.body));
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve({
        package: package,
        username: collaboratorName,
        deleted: true
      });
    });
  }).nodeify(callback);
};
