var _ = require('lodash');
var assert = require('assert');
var Request = require('../lib/external-request');
var USER_HOST = process.env.USER_API || "https://user-api-example.com";
var P = require('bluebird');

var Team = module.exports = function(bearer) {
  assert(_.isString(bearer), "Must pass a bearer (loggedInUser) to Team agent");

  if (!(this instanceof Team)) {
    return new Team(bearer);
  }

  this.bearer = bearer;
};

Team.prototype._get = function(opts) {
  var url = USER_HOST + '/team/' + opts.orgName + '/' + opts.teamName;

  var data = {
    url: url,
    json: true,
    headers: {
      bearer: this.bearer
    }
  };

  return new P(function(accept, reject) {
    Request.get(data, function(err, resp, team) {
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

      return accept(team);
    });
  });
};

Team.prototype.get = function(opts, callback) {

  var requests = [
    this._get(opts),
    this.getUsers(opts),
    this.getPackages(opts)
  ];

  return P.all(requests).spread(function(team, users, packages) {
    team = team || {};
    users = users || [];
    packages = packages || {};

    team.users = {
      items: users,
      count: users.length
    };

    var pkgs = Object.keys(packages).map(function(name) {
      return {
        "name": name,
        "permission": packages[name]
      };
    });

    team.packages = {
      count: pkgs.length,
      items: pkgs
    };

    return team;
  }).nodeify(callback);
};

Team.prototype.getUsers = function(opts) {
  var url = USER_HOST + '/team/' + opts.orgName + '/' + opts.teamName + '/user';

  var data = {
    url: url,
    json: true,
    headers: {
      bearer: this.bearer
    }
  };

  return new P(function(accept, reject) {
    Request.get(data, function(err, resp, users) {
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

      return accept(users);
    });
  });
};

Team.prototype.getPackages = function(opts) {
  var url = USER_HOST + '/team/' + opts.orgName + '/' + opts.teamName + '/package';

  var data = {
    url: url,
    json: true,
    headers: {
      bearer: this.bearer
    }
  };

  return new P(function(accept, reject) {
    Request.get(data, function(err, resp, packages) {
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

      return accept(packages);
    });
  });
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
        err = new Error('The provided User is already on this Team');
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
  var self = this;

  var data = {
    id: opts.teamName,
    scope: opts.scope
  };


  var requests = opts.users.map(function(user) {
    return self._addUser({
      userName: user,
      id: data.id,
      scope: data.scope
    });
  });

  return P.all(requests).nodeify(callback);
};
