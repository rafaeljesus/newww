var request = require('request');
var Promise = require('bluebird');
var _ = require('lodash');
var fmt = require('util').format;

var User = module.exports = function(opts) {
  _.extend(this, {
    host: process.env.USER_API
  }, opts);
}

User.prototype.get = function(name, options, callback) {
  var self = this
  var user
  var url = fmt("%s/%s", this.host, name);

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
    return options.stars ? self.getStars(user.name) : null
  })
  .then(function(_stars){
    if (_stars) user.stars = _stars
    return options.packages ? self.getPackages(user.name) : null
  })
  .then(function(_packages){
    if (_packages) user.packages = _packages
    return user
  })
  .nodeify(callback);
}

User.prototype.getPackages = function(name, callback) {
  var url = fmt("%s/%s/package?format=mini", this.host, name);

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
  var url = fmt("%s/%s/stars", this.host, name);

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
