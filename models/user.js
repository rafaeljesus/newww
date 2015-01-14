var request = require('request');
var _ = require('lodash');
var fmt = require('util').format;

var User = module.exports = function(opts) {
  _.extend(this, {
    host: process.env.USER_API
  }, opts);
}

User.prototype.get = function(name, callback) {
  var url = fmt("%s/%s", this.host, name);
  request.get({url: url, json: true}, function(err, resp, body){

    if (err) return callback(err);
    if (resp.statusCode > 399) {
      var err = Error('error getting user ' + name);
      err.statusCode = resp.statusCode;
      return callback(err);
    }
    return callback(null, body)
  });
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
