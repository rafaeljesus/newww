var request = require('request');
var Promise = require('bluebird');
var _ = require('lodash');
var fmt = require('util').format;
var presenter = require(__dirname + '/../presenters/collaborator');

var Collaborator = module.exports = function(opts) {
  _.extend(this, {
    host: process.env.USER_API,
    presenter: true,
    bearer: false
  }, opts);

  return this;
};


Collaborator.prototype.list = function(package, callback) {
  var url = fmt("package/%s/collaborators", package);

  return new Promise(function (resolve, reject) {

    request.post({
      url: url,
      json: true,
      body: {
        password: loginInfo.password
      }
    }, function (err, resp, body) {

      if (err) { return reject(err); }

      if (resp.statusCode === 404) {
        err = Error('user ' + loginInfo.name + ' not found');
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return resolve(body);
    });
  }).nodeify(callback);
};

Collaborator.prototype.get = function(name, options, callback) {
  var _this = this;
  var user;
  var url = fmt("%s/user/%s", this.host, name);
  this.log(url);

  if (!callback) {
    callback = options;
    options = {};
  }

  return new Promise(function(resolve, reject) {
    request.get({url: url, json: true}, function(err, resp, body){
      if (err) { return reject(err); }
      if (resp.statusCode > 399) {
        err = Error('error getting user ' + name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(body);
    });
  })
  .then(function(_user){
    user = _user;

    if (_this.presenter) {
      user = presenter(user);
    }

    return options.stars ? _this.getStars(user.name, options.loggedInUsername) : null;
  })
  .then(function(_stars){
    if (_stars) { user.stars = _stars; }
    return options.packages ? _this.getPackages(user.name, options.loggedInUsername) : null;
  })
  .then(function(_packages){
    if (_packages) { user.packages = _packages; }
    return user;
  })
  .nodeify(callback);
};

Collaborator.prototype.getPackages = function(name, callback) {

  var _this = this;

  var url = fmt("%s/user/%s/package", this.host, name);
  this.log(url);

  return new Promise(function(resolve, reject) {
    var opts = {
      url: url,
      qs: {
        per_page: 9999
      },
      json: true
    };

    if (_this.bearer) {
      opts.headers = {bearer: _this.bearer};
    }

    request.get(opts, function(err, resp, body){

      if (err) { return reject(err); }
      if (resp.statusCode > 399) {
        err = Error('error getting packages for user ' + name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(body);
    });
  }).nodeify(callback);
};

Collaborator.prototype.getStars = function(name, callback) {
  var _this = this;

  var url = fmt("%s/user/%s/stars", this.host, name);
  this.log(url);

  return new Promise(function(resolve, reject) {
    var opts = {
      url: url,
      json: true
    };

    if (_this.bearer) {
      opts.headers = {bearer: _this.bearer};
    }

    request.get(opts, function(err, resp, body){

      if (err) { return reject(err); }
      if (resp.statusCode > 399) {
        err = Error('error getting stars for user ' + name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(body);
    });
  })
  .nodeify(callback);
};
