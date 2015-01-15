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

  // options are optional!
  if (!callback) {
    callback = options
    options = {}
  }

  var url = fmt("%s/%s", this.host, name);

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
  // .then(function(user){
  //   return body
  //   User.getStars(user.name, )
  // })
  .nodeify(callback);

  // request.get({url: url, json: true}, function(err, resp, body){
  //
  //   if (err) return callback(err);
  //   if (resp.statusCode > 399) {
  //     var err = Error('error getting user ' + name);
  //     err.statusCode = resp.statusCode;
  //     return callback(err);
  //   }
  //   return callback(null, body)
  // });
}

User.prototype.getPackages = function(name, callback) {
  var url = fmt("%s/%s/package?format=mini", this.host, name);

  request.get({
    url: url,
    headers: {bearer: name},
    json: true
  }, function(err, resp, body){

    if (err) return callback(err);
    if (resp.statusCode > 399) {
      var err = Error('error getting packages for user ' + name);
      err.statusCode = resp.statusCode;
      return callback(err);
    }
    return callback(null, body)
  });
}

User.prototype.getStars = function(name, callback) {
  var url = fmt("%s/%s/stars", this.host, name);

  request.get({
    url: url,
    headers: {bearer: name},
    json: true
  }, function(err, resp, body){

    if (err) return callback(err);
    if (resp.statusCode > 399) {
      var err = Error('error getting stars for user ' + name);
      err.statusCode = resp.statusCode;
      return callback(err);
    }
    return callback(null, body)
  });
}
