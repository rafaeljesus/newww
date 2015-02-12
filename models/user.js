var request = require('request');
var Promise = require('bluebird');
var _ = require('lodash');
var fmt = require('util').format;
var decorate = require(__dirname + '/../presenters/user');

var User = module.exports = function(opts) {
  _.extend(this, {
    host: process.env.USER_API,
    bearer: false
  }, opts);

  return this;
};

User.prototype.login = function(loginInfo, callback) {
  var url = fmt("%s/user/%s/login", this.host, loginInfo.name);

  return new Promise(function (resolve, reject) {
    request.post({
      url: url,
      json: true,
      body: {
        password: loginInfo.password
      }
    }, function (err, resp, body) {

      if (err) { return reject(err); }

      if (resp.statusCode === 401) {
        err = Error('password is incorrect for ' + loginInfo.name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      if (resp.statusCode === 404) {
        err = Error('user ' + loginInfo.name + ' not found');
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return resolve(body);
    });
  }).nodeify(callback);
};

User.prototype.get = function(name, options, callback) {
  var _this = this;
  var user;
  var url = fmt("%s/user/%s", this.host, name);

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
    user = decorate(_user);

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

User.prototype.getPackages = function(name, callback) {
  var _this = this;
  var url = fmt("%s/user/%s/package", this.host, name);

  return new Promise(function(resolve, reject) {
    var opts = {
      url: url,
      qs: {
        per_page: 9999
      },
      json: true,
      headers: {bearer: _this.bearer}
    };

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

User.prototype.getStars = function(name, callback) {
  var _this = this;
  var url = fmt("%s/user/%s/stars", this.host, name);

  return new Promise(function(resolve, reject) {
    var opts = {
      url: url,
      json: true,
      headers: {bearer: _this.bearer}
    };

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
