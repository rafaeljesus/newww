var _ = require('lodash');
var fixtures = require('../../fixtures.js');

var Collaborator = module.exports = function(opts) {
  _.extend(this, {
    host: "http://collaborator.com",
  }, opts);
}

Collaborator.prototype.list = function(package, callback) {
  if (!this.bearer) {
    var err = Error("invalid bearer token")
    err.statusCode = 401
    return callback(err)
  }
  return callback(null, fixtures.collaborators);
};

Collaborator.prototype.add = function(package, collaborator, callback) {
  return callback(null, fixtures.collaborators[collaborator.name]);
};

Collaborator.prototype.update = function(package, collaborator, callback) {
  return callback(null, fixtures.collaborators[collaborator.name]);
};

Collaborator.prototype.del = function(package, username, callback) {
  return callback(null, fixtures.collaborators[username]);
};
