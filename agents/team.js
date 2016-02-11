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
  var url = USER_HOST + '/team/' + opts.orgScope + '/' + encodeURIComponent(opts.teamName);

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
        err = Error('user is unauthorized to perform this action');
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

    team.frontUsers = users.slice(0, 3);

    team.packages = packages;

    return team;

  }).asCallback(callback);
};

Team.prototype.getUsers = function(opts) {
  var url = USER_HOST + '/team/' + opts.orgScope + '/' + encodeURIComponent(opts.teamName) + '/user';

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
        err = Error('user is unauthorized to perform this action');
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
  var url = USER_HOST + '/team/' + opts.orgScope + '/' + encodeURIComponent(opts.teamName) + '/package';

  url += '?format=' + (opts.detailed ? 'detailed' : 'mini');

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
        err = Error('user is unauthorized to perform this action');
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      if (resp.statusCode === 404) {
        err = Error('Team or Org not found');
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      if (resp.statusCode >= 400) {
        err = new Error(packages.error);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return accept(packages);
    });
  });
};

Team.prototype.addPackage = function(opts) {
  opts = opts || {};

  var url = USER_HOST + '/team/' + opts.scope + '/' + encodeURIComponent(opts.id) + '/package';

  var data = {
    url: url,
    json: true,
    body: {
      package: opts.package,
      permissions: opts.permissions
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
        err = Error('user is unauthorized to perform this action');
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      if (resp.statusCode === 404) {
        err = Error(body.error);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      if (resp.statusCode >= 400) {
        err = new Error(body.error);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return accept(body);
    });
  });
};

Team.prototype.addPackages = function(opts) {
  opts = opts || {};
  var packages = (opts.packages || []).map(function (xs) {
    return {
      name: xs.name,
      permissions: xs.permissions
    };
  });
  var url = USER_HOST + '/team/' + opts.scope + '/' + encodeURIComponent(opts.id) + '/package';
  return P.promisify(Request.put, {context: Request})({
    url: url,
    json: true,
    body: {
      packages: packages
    },
    headers: {
      bearer: this.bearer
    }
  }).spread(function (resp, body) {
    if (resp.statusCode >= 400) {
      throw _.extend(new Error(
        resp.statusCode === 400 ? body.error :
        resp.statusCode === 401 ? 'user is unauthorized to perform this action' :
        resp.statusCode === 404 ? 'Team or Org not found' :
        body.error
      ), {statusCode: resp.statusCode});
    }
    return body;
  })
};

Team.prototype.removePackage = function(opts) {
  opts = opts || {};

  var url = USER_HOST + '/team/' + opts.scope + '/' + encodeURIComponent(opts.id) + '/package';

  var data = {
    url: url,
    json: true,
    body: {
      package: opts.package
    },
    headers: {
      bearer: this.bearer
    }
  };

  return new P(function(accept, reject) {
    Request.del(data, function(err, resp, body) {
      if (err) {
        return reject(err);
      }

      if (resp.statusCode === 401) {
        err = Error('user is unauthorized to perform this action');
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      if (resp.statusCode === 404) {
        err = Error('Team or Org not found');
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      if (resp.statusCode >= 400) {
        err = new Error(body.error);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return accept(body);
    });
  });
};

Team.prototype._addUser = function(opts, callback) {
  opts = opts || {};

  var url = USER_HOST + '/team/' + opts.scope + '/' + encodeURIComponent(opts.id) + '/user';

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
        err = Error('user is unauthorized to perform this action');
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
        err = new Error(body.error);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return accept(body);
    });
  }).asCallback(callback);
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

  return P.all(requests).asCallback(callback);
};

Team.prototype.removeUser = function(opts) {
  opts = opts || {};

  var url = USER_HOST + '/team/' + opts.scope + '/' + encodeURIComponent(opts.id) + '/user';

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
    Request.del(data, function(err, resp, body) {
      if (err) {
        return reject(err);
      }

      if (resp.statusCode === 401) {
        err = Error('user must be admin to perform this operation');
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
        err = new Error(body.error);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return accept(body);
    });
  });
};

Team.prototype.removeTeam = function(opts) {
  opts = opts || {};

  var url = USER_HOST + '/team/' + opts.scope + '/' + encodeURIComponent(opts.id);

  var data = {
    body: {},
    headers: {bearer: this.bearer},
    json: true,
    url: url
  };

  return new P(function(accept, reject) {
    Request.del(data, function(err, resp, body) {
      if (err) {
        return reject(err);
      }

      if (resp.statusCode === 401) {
        err = new Error('You do not have permission to perform this operation.');
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      if (resp.statusCode === 404) {
        err = new Error('The team or organization was not found.');
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      if (resp.statusCode >= 400) {
        err = new Error(body.error);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return accept(body);
    });
  });
};

Team.prototype.updateInfo = function(opts) {
  opts = opts || {};

  var url = USER_HOST + '/team/' + opts.scope + '/' + encodeURIComponent(opts.id);

  var data = {
    url: url,
    json: true,
    body: {
      description: opts.description
    },
    headers: {
      bearer: this.bearer
    }
  };

  return new P(function(accept, reject) {
    Request.post(data, function(err, resp, body) {
      if (err) {
        return reject(err);
      }

      if (resp.statusCode === 401) {
        err = Error('user must be admin to perform this operation');
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      if (resp.statusCode === 404) {
        err = Error('Team or Org not found');
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      if (resp.statusCode >= 400) {
        err = new Error(body.error);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return accept(body);
    });
  });
};
