var _ = require('lodash');
var assert = require('assert');
var async = require('async');
var Request = require('../lib/external-request');
var USER_HOST = process.env.USER_API || "https://user-api-example.com";
var avatar = require('../lib/avatar');

var Org = module.exports = function(bearer) {
  assert(_.isString(bearer), "Must pass a bearer (loggedInUser) to Org agent");

  if (!(this instanceof Org)) {
    return new Org(bearer);
  }

  this.bearer = bearer;
};

Org.prototype.create = function(name, callback) {
  var url = USER_HOST + '/org';

  var opts = {
    url: url,
    json: true,
    body: {
      name: name
    },
    headers: {
      bearer: this.bearer
    },
  };

  Request.put(opts, function(err, resp, body) {
    if (err) {
      return callback(err);
    }

    if (resp.statusCode === 401) {
      err = Error('no bearer token included in creation of ' + name);
      err.statusCode = resp.statusCode;
      return callback(err);
    }

    return callback(null, body);
  });
};

Org.prototype.get = function(name, callback) {
  assert(_.isString(name), "name must be a string");

  var orgUrl = USER_HOST + '/org/' + name;
  var userUrl = USER_HOST + '/org/' + name + '/user';
  var packageUrl = USER_HOST + '/org/' + name + '/package';

  var makeRequest = function(url) {
    return function(cb) {

      Request({
        url: url,
        json: true
      }, function(err, resp, body) {
        if (err) {
          return cb(err);
        }

        if (resp.statusCode === 404) {
          err = Error('org not found');
          err.statusCode = resp.statusCode;
          return cb(err);
        }

        return cb(null, body);
      });
    };
  };

  var requests = {
    org: makeRequest(orgUrl),
    users: makeRequest(userUrl),
    packages: makeRequest(packageUrl)
  };

  async.parallel(requests, function(err, results) {
    if (err) {
      return callback(err);
    }

    var org = {};

    org.info = results.org;
    org.users = results.users;
    org.users.items = org.users.items.map(function(user) {
      user.avatar = avatar(user.email);
      return user;
    });
    org.packages = results.packages;

    return callback(null, org);
  });
};

Org.prototype.update = function(data, callback) {
  var url = USER_HOST + '/org/' + data.name;

  // shall we use joi to ensure the data is legit?

  var opts = {
    url: url,
    json: true,
    body: data,
    headers: {
      bearer: this.bearer
    }
  };

  Request.post(opts, function(err, resp, body) {
    if (err) {
      callback(err);
    }

    if (resp.statusCode === 401) {
      err = Error('user is unauthorized to modify this organization');
      err.statusCode = resp.statusCode;
      return callback(err);
    }

    if (resp.statusCode === 404) {
      err = Error('org not found');
      err.statusCode = resp.statusCode;
      return callback(err);
    }

    return callback(null, body);
  });
};

Org.prototype.delete = function(name, callback) {
  assert(_.isString(name), "name must be a string");

  var url = USER_HOST + '/org/' + name;

  Request.del({
    url: url,
    json: true,
    headers: {
      bearer: this.bearer
    }
  }, function(err, resp, body) {
    if (err) {
      callback(err);
    }

    if (resp.statusCode === 401) {
      err = Error('user is unauthorized to delete this organization');
      err.statusCode = resp.statusCode;
      return callback(err);
    }

    if (resp.statusCode === 404) {
      err = Error('org not found');
      err.statusCode = resp.statusCode;
      return callback(err);
    }

    return callback(null, body);
  });
};

Org.prototype.addUser = function(name, user, callback) {
  assert(_.isString(name), "name must be a string");
  assert(_.isObject(user), "must pass a user");

  var url = USER_HOST + '/org/' + name + '/user';

  Request.put({
    url: url,
    json: true,
    body: user,
    headers: {
      bearer: this.bearer
    }
  }, function(err, resp, user) {
    if (err) {
      callback(err);
    }

    if (resp.statusCode === 401) {
      err = Error('bearer is unauthorized to add this user to this organization');
      err.statusCode = resp.statusCode;
      return callback(err);
    }

    if (resp.statusCode === 404) {
      err = Error('org or user not found');
      err.statusCode = resp.statusCode;
      return callback(err);
    }

    return callback(null, user);
  });
};

Org.prototype.getUsers = function(name, callback) {
  assert(_.isString(name), "name must be a string");

  var url = USER_HOST + '/org/' + name + '/user';

  Request.get({
    url: url,
    json: true
  }, function(err, resp, users) {
    if (err) {
      callback(err);
    }

    if (resp.statusCode === 404) {
      err = Error('org not found');
      err.statusCode = resp.statusCode;
      return callback(err);
    }

    return callback(null, users);
  });
};

Org.prototype.getTeams = function(name, callback) {
  var url = USER_HOST + '/org/' + name + '/team';

  Request.get({
    url: url,
    json: true,
    id: name,
    headers: {
      bearer: this.bearer
    }
  }, function(err, resp, teams) {
    if (err) {
      callback(err);
    }

    if (resp.statusCode === 404) {
      err = Error('org not found');
      err.statusCode = resp.statusCode;
      return callback(err);
    }

    return callback(null, teams);
  });

};

Org.prototype.removeUser = function(name, userId, callback) {
  var url = USER_HOST + '/org/' + name + '/user/' + userId;

  Request.del({
    url: url,
    json: true,
    id: name,
    userId: userId,
    headers: {
      bearer: this.bearer
    }
  }, function(err, resp, removedUser) {
    if (err) {
      callback(err);
    }

    if (resp.statusCode === 404) {
      err = Error('org or user not found');
      err.statusCode = resp.statusCode;
      return callback(err);
    }

    return callback(null, removedUser);
  });
};