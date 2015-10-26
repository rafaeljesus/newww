var _ = require('lodash');
var assert = require('assert');
var Request = require('../lib/external-request');
var USER_HOST = process.env.USER_API || "https://user-api-example.com";
var P = require('bluebird');
var async = require('async');

var Team = module.exports = function(bearer) {
  assert(_.isString(bearer), "Must pass a bearer (loggedInUser) to Team agent");

  if (!(this instanceof Team)) {
    return new Team(bearer);
  }

  this.bearer = bearer;
};

Team.prototype._addUser = function(opts, callback) {
  opts = opts || {};

  var url = USER_HOST + '/team/' + opts.scope + '/' + opts.id + '/user';

  var data = {
    url: url,
    json: true,
    body: {
      user: opts.userName
    },
    headers: {
      bearer: this.bearer
    }
  };

  return new P(function(accept, reject) {
    Request.put(data, function(err, resp, body) {
      if (err) {
        return reject(err);
      }

      if (resp.statusCode === 401) {
        err = Error('no bearer token included');
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      if (resp.statusCode === 404) {
        err = Error('Team or Org not found');
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      if (resp.statusCode === 409) {
        err = new Error('The provided User\'s is already on this Team');
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      if (resp.statusCode >= 400) {
        err = new Error(body);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return accept(body);
    });
  }).nodeify(callback);
};

Team.prototype.addUsers = function(opts, callback) {
  opts = opts || {};
  opts.users = opts.users || [];

  var data = {
    id: opts.teamName,
    scope: opts.orgScope
  };


  var requests = opts.users.map(function(user) {
    return this._addUser({
      userName: user,
      id: data.id,
      scope: data.scope
    });
  }.bind(this));

  return P.all(requests).nodeify(callback);
};
