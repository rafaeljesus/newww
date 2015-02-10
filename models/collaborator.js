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
  var url = fmt("%s/package/%s/collaborators", this.host, package);
  return new Promise(function (resolve, reject) {
    request.get({url: url, json: true}, function(err, resp, body){
      if (err) { return reject(err); }
      if (resp.statusCode > 399) {
        err = Error('error getting collaborators for package: ' + package);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(body);
    });
  }).nodeify(callback);
};

Collaborator.prototype.add = function(package, collaborator, callback) {
  var url = fmt("%s/package/%s/collaborators", this.host, package);

  return new Promise(function (resolve, reject) {
    request.put({url: url, json: true, body: collaborator}, function(err, resp, body){
      if (err) { return reject(err); }
      if (resp.statusCode > 399) {
        err = Error('error adding collaborator to package: ' + package);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(body);
    });
  }).nodeify(callback);
};
