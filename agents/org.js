var _ = require('lodash');
var assert = require('assert');
var Request = require('../lib/external-request');
var USER_HOST = process.env.USER_API || "https://user-api-example.com";
var avatar = require('../lib/avatar');
var P = require('bluebird');

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

  return new P(function(accept, reject) {
    Request.put(opts, function(err, resp, body) {
      if (err) {
        return reject(err);
      }

      if (resp.statusCode === 401) {
        err = Error('no bearer token included in creation of ' + name);
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

Org.prototype.get = function(name, callback) {
  assert(_.isString(name), "name must be a string");

  var self = this;
  var orgUrl = USER_HOST + '/org/' + name;
  var userUrl = USER_HOST + '/org/' + name + '/user';
  var packageUrl = USER_HOST + '/org/' + name + '/package';

  var makeRequest = function(url) {
    return new P(function(accept, reject) {

      Request({
        url: url,
        json: true,
        headers: {
          bearer: self.bearer
        }
      }, function(err, resp, body) {
        if (err) {
          return reject(err);
        }

        if (resp.statusCode >= 400) {
          err = new Error(body);
          err.statusCode = resp.statusCode;
          return reject(err);
        }

        return accept(body);
      });
    });
  };

  var requests = [
    makeRequest(orgUrl),
    makeRequest(userUrl),
    makeRequest(packageUrl)
  ];

  return P.all(requests).spread(function(org, users, pkg) {
    var ret = {};

    ret.info = org;
    ret.users = users;
    ret.users.items = users.items.map(function(user) {
      user.avatar = avatar(user.email);
      return user;
    });
    ret.packages = pkg;

    return ret;
  }).nodeify(callback);
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

    if (resp.statusCode >= 400) {
      err = new Error(body);
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

    if (resp.statusCode >= 400) {
      err = new Error(body);
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

    if (resp.statusCode >= 400) {
      err = new Error(body);
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
    json: true,
    headers: {
      bearer: this.bearer
    },
  }, function(err, resp, users) {
    if (err) {
      callback(err);
    }

    if (resp.statusCode === 404) {
      err = Error('org not found');
      err.statusCode = resp.statusCode;
      return callback(err);
    }

    if (resp.statusCode >= 400) {
      err = new Error(body);
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

    if (resp.statusCode >= 400) {
      err = new Error(body);
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

    if (resp.statusCode >= 400) {
      err = new Error(body);
      err.statusCode = resp.statusCode;
      return callback(err);
    }


    return callback(null, removedUser);
  });
};