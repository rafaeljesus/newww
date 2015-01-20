var request = require('request');
var Promise = require('bluebird');
var _ = require('lodash');
var fmt = require('util').format;
var presenter = require(__dirname + '/../presenters/user');

var User = module.exports = function(opts) {
  _.extend(this, {
    host: process.env.USER_API,
    presenter: true,
    debug: false
  }, opts);
}

User.init = function(opts) {
  return new User(opts)
}

User.log = function(msg) {
  if (this.debug) {
    return console.log(msg);
  }
}

User.prototype.get = function(name, options, callback) {
  var _this = this
  var user
  var url = fmt("%s/user/%s", this.host, name);
  User.log(url)

  if (!callback) {
    callback = options
    options = {}
  }

  return new Promise(function(resolve, reject) {
    request.get({url: url, json: true}, function(err, resp, body){
      if (err) return reject(err);
      if (resp.statusCode > 399) {
        var err = Error('error getting user ' + name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(body);
    });
  })
  .then(function(_user){
    user = _user

    if (_this.presenter) {
      user = presenter(user)
    }

    return options.stars ? _this.getStars(user.name) : null
  })
  .then(function(_stars){
    if (_stars) user.stars = _stars
    return options.packages ? _this.getPackages(user.name) : null
  })
  .then(function(_packages){
    if (_packages) user.packages = _packages
    return user
  })
  .nodeify(callback);
}

User.prototype.getPackages = function(name, callback) {
  var url = fmt("%s/user/%s/package", this.host, name);
  User.log(url)

  return new Promise(function(resolve, reject) {
    request.get({
      url: url,
      headers: {bearer: name},
      json: true
    }, function(err, resp, body){

      if (err) return reject(err);
      if (resp.statusCode > 399) {
        var err = Error('error getting packages for user ' + name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(body);
    });
  }).nodeify(callback);
}

User.prototype.getStars = function(name, callback) {
  var url = fmt("%s/user/%s/stars", this.host, name);
  User.log(url)

  return new Promise(function(resolve, reject) {
    request.get({
      url: url,
      headers: {bearer: name},
      json: true
    }, function(err, resp, body){

      if (err) return reject(err);
      if (resp.statusCode > 399) {
        var err = Error('error getting stars for user ' + name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(body);
    })
  })
  .nodeify(callback);
}
