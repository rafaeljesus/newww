var _ = require('lodash');
var async = require('async');
var logger = require('bole')('user-agent');
var cache = require('../lib/cache');
var decorate = require('../presenters/user');
var fmt = require('util').format;
var LicenseAPI = require('../agents/customer');
var mailchimp = require('mailchimp-api');
var P = require('bluebird');
var Request = require('../lib/external-request');
var userValidate = require('npm-user-validate');
var USER_API = process.env.USER_API || 'https://user-api-example.com';
var utils = require('../lib/utils');
var VError = require('verror');

var redis = require('../lib/redis-pool');

var chimp;

var User = module.exports = function(loggedInUser) {

  if (!(this instanceof User)) {
    return new User(loggedInUser);
  }

  this.bearer = loggedInUser && loggedInUser.name;

  this.get = P.promisify(this._get);

  return this;
};

User.prototype.confirmEmail = function(user, callback) {
  var url = fmt('%s/user/%s/verify', USER_API, user.name);

  return new P(function(resolve, reject) {
    var opts = {
      url: url,
      json: true,
      body: {
        verification_key: user.verification_key
      }
    };

    Request.post(opts, function(err, resp, body) {
      if (err) {
        return reject(err);
      }
      if (resp.statusCode > 399) {
        err = new Error('error verifying user ' + user.name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(body);
    });
  }).nodeify(callback);
};

User.prototype.generateUserACLOptions = function generateUserACLOptions(name) {
  return {
    url: fmt('%s/user/%s', USER_API, name),
    json: true,
  };
};

User.prototype.dropCache = function dropCache(name, callback) {
  cache.dropKey(name, callback);
};


User.prototype.fetchFromUserACL = function fetchFromUserACL(name, callback) {
  return new P(function(resolve, reject) {
    Request.get(this.generateUserACLOptions(name), function(err, response, body) {
      if (err) {
        return reject(err);
      }

      if (response.statusCode !== 200) {
        var e = new Error('unexpected status code ' + response.statusCode);
        e.statusCode = response.statusCode;
        return reject(e);
      }

      return resolve(body);
    });
  }.bind(this)).nodeify(callback);
};

User.prototype.fetchCustomer = function fetchCustomer(name, callback) {
  LicenseAPI(name)
    .getStripeData(function(err, customer) {
      return callback(null, customer);
    });
};

User.prototype._get = function _get(name, callback) {
  var self = this;
  var user;

  cache.getKey(name, function(err, value) {
    if (err) {
      return callback(err);
    }
    if (value) {
      user = utils.safeJsonParse(value);
      return callback(null, user);
    }

    self.fetchData(name, function(err, user) {
      if (err) {
        return callback(err);
      }
      cache.setKey(name, cache.DEFAULT_TTL, JSON.stringify(user), function(err, result) {
        return callback(null, user);
      });
    });
  });
};

User.prototype.fetchData = function fetchData(name, callback) {
  var self = this;

  var actions = {
    user: function(cb) {
      self.fetchFromUserACL(name, cb);
    },
    customer: function(cb) {
      self.fetchCustomer(name, cb);
    },
  };

  async.parallel(actions, function(err, results) {
    if (err) {
      return callback(err);
    }

    var user = decorate(results.user);

    user.customer = results.customer;
    user.isPaid = !!user.customer;

    callback(null, user);
  });
};

User.prototype.getPackages = function(name, page, callback) {
  var self = this;
  var url = fmt('%s/user/%s/package', USER_API, name);

  if (typeof page === 'function' || typeof page === 'undefined') {
    callback = page;
    page = 0;
  }

  return new P(function(resolve, reject) {
    var PER_PAGE = 100;

    var opts = {
      url: url,
      qs: {
        format: 'mini',
        per_page: PER_PAGE,
        page: page
      },
      json: true
    };

    if (self.bearer) {
      opts.headers = {
        bearer: self.bearer
      };
    }

    Request.get(opts, function(err, resp, body) {

      if (err) {
        return reject(err);
      }
      if (resp.statusCode > 399) {
        var err = new Error('error getting packages for user ' + name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      // it feels like this should really go in the handler instead,
      // though we have client-side code
      // (assets/scripts/fetch-packages.js) that needs this
      // functionality as well... thoughts?
      if (body.items) {
        body.items = body.items.map(function(p) {
          if (p.access === 'restricted') {
            p.isPrivate = true;
          }
          return p;
        });
      }

      var num = _.get(body, 'items.length');

      if (+num * (+page + 1) < body.count && num >= PER_PAGE) {
        body.hasMore = true;
      }

      return resolve(body);
    });
  }).nodeify(callback);
};

User.prototype.getOwnedPackages = function(name) {
  var self = this;
  var url = fmt('%s/user/%s/package/owner', USER_API, name);

  return new P(function(resolve, reject) {
    var PER_PAGE = 9999;

    var opts = {
      url: url,
      qs: {
        per_page: PER_PAGE
      },
      json: true
    };

    if (self.bearer) {
      opts.headers = {
        bearer: self.bearer
      };
    }

    Request.get(opts, function(err, resp, body) {

      if (err) {
        return reject(err);
      }
      if (resp.statusCode > 399) {
        err = new Error('error getting packages for user ' + name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      if (body.items) {
        body.items = body.items.map(function(p) {
          if (p.access === 'restricted') {
            p.isPrivate = true;
          }
          return p;
        });
      }

      return resolve(body);
    });
  });
};

User.prototype.getStars = function(name, callback) {
  var self = this;
  var url = fmt('%s/user/%s/stars?format=detailed', USER_API, name);

  return new P(function(resolve, reject) {
    var opts = {
      url: url,
      json: true
    };

    if (self.bearer) {
      opts.headers = {
        bearer: self.bearer
      };
    }

    Request.get(opts, function(err, resp, body) {

      if (err) {
        return reject(err);
      }
      if (resp.statusCode > 399) {
        var err = new Error('error getting stars for user ' + name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(body);
    });
  })
    .nodeify(callback);
};

User.prototype.login = function(loginInfo, callback) {
  var url = fmt('%s/user/%s/login', USER_API, loginInfo.name);

  return new P(function(resolve, reject) {

    Request.post({
      url: url,
      json: true,
      body: {
        password: loginInfo.password
      }
    }, function(err, resp, body) {

      if (err) {
        return reject(err);
      }

      if (resp.statusCode === 401) {
        var err = new Error('password is incorrect for ' + loginInfo.name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      if (resp.statusCode === 404) {
        var err = new Error('user ' + loginInfo.name + ' not found');
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return resolve(body);
    });
  }).nodeify(callback);
};

User.prototype.lookupEmail = function(email, callback) {
  return new P(function(resolve, reject) {
    if (userValidate.email(email)) {
      var err = new Error('email is invalid');
      err.statusCode = 400;
      return reject(err);
    }

    var url = USER_API + '/user/' + email;

    Request.get({
      url: url,
      json: true
    }, function(err, resp, body) {
      if (err) {
        return reject(err);
      }
      if (resp.statusCode > 399) {
        err = new Error('error looking up username(s) for ' + email);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return resolve(body);
    });
  }).nodeify(callback);
};

User.prototype.save = function(user, callback) {
  var url = USER_API + '/user/' + user.name;

  return new P(function(resolve, reject) {
    var opts = {
      url: url,
      json: true,
      body: user
    };

    Request.post(opts, function(err, resp, body) {
      if (err) {
        return reject(err);
      }
      if (resp.statusCode > 399) {
        return reject(Object.assign(new VError('error updating profile for ' + user.name), {
          statusCode: resp.statusCode,
          what: 'user'
        }));
      }
      return resolve(body);
    });
  }).nodeify(callback);
};

User.prototype.signup = function(user, callback) {

  if (user.npmweekly === 'on') {
    var mc = this.getMailchimp();
    mc.lists.subscribe({
      id: 'e17fe5d778',
      email: {
        email: user.email
      }
    }, function() {
      // do nothing on success
    }, function(error) {
      logger.error('Could not register user for npm Weekly: ' + user.email);
      if (error.error) {
        logger.error(error.error);
      }
    });
  }

  var url = USER_API + '/user';

  return new P(function(resolve, reject) {
    var opts = {
      url: url,
      body: user,
      json: true
    };

    Request.put(opts, function(err, resp, body) {
      if (err) {
        return reject(err);
      }
      if (resp.statusCode === 409) {
        err = new Error("The username you're trying to create already exists.");
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      if (resp.statusCode > 399) {
        err = new Error('error creating user ' + user.name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(body);
    });
  })
    .nodeify(callback);
};

User.prototype.getCliTokens = function getCliTokens(name) {
  var url = fmt('%s/user/%s/tokens', USER_API, name);

  return new P(function(accept, reject) {

    var opts = {
      url: url,
      json: true
    };

    Request.get(opts, function(err, resp, body) {

      if (err) {
        return reject(err);
      }

      if (resp.statusCode > 399) {
        err = Error('error getting cli tokens for user ' + name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return accept(body);
    });
  });
};

User.prototype.logoutCliToken = function logoutCliToken(token) {
  var url = fmt('%s/user/-/logout', USER_API);

  var opts = {
    url: url,
    json: true,
    form: {
      'auth_token': token
    }
  };

  return new P(function(accept, reject) {

    Request.post(opts, function(err, resp, body) {
      if (err) {
        return reject(err);
      }

      if (resp.statusCode > 399) {
        err = Error('error logging token out; token=' + token);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return accept(body);
    });
  });
};

User.prototype.getMailchimp = function getMailchimp() {
  if (!chimp) {
    chimp = new mailchimp.Mailchimp(process.env.MAILCHIMP_KEY);
  }
  return chimp;
};

User.prototype.verifyPassword = function(name, password, callback) {
  var loginInfo = {
    name: name,
    password: password
  };

  return this.login(loginInfo, callback);
};

User.prototype.getOrgs = function(name, callback) {
  var self = this;
  var url = fmt('%s/user/%s/org', USER_API, name);

  return new P(function(resolve, reject) {

    var opts = {
      url: url,
      json: true
    };

    if (self.bearer) {
      opts.headers = {
        bearer: self.bearer
      };
    }

    Request.get(opts, function(err, resp, body) {

      if (err) {
        return reject(err);
      }

      if (resp.statusCode > 399) {
        err = Error('error getting orgs for user ' + name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return resolve(body);
    });
  }).nodeify(callback);
};

User.prototype.toOrg = function(name, newUsername, callback) {

  var url = fmt('%s/user/%s/to-org', USER_API, name);

  var opts = {
    url: url,
    json: true,
    body: {
      new_username: newUsername
    }
  };

  if (this.bearer) {
    opts.headers = {
      bearer: this.bearer
    };
  }

  return new P(function(resolve, reject) {

    Request.post(opts, function(err, resp, body) {
      if (err) {
        return reject(err);
      }

      if (resp.statusCode === 400) {
        err = new Error("you need authentication to give ownership of the new org to another existing user");
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      if (resp.statusCode === 409) {
        err = new Error("a user or org already exists with the username you're trying to create as an owner");
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      if (resp.statusCode > 399) {
        err = new Error('error renaming user ' + name + ": " + body);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(body);
    });

  }).nodeify(callback);
};

User.prototype.getPagesSeenThisSession = function(user) {
  return redis.acquireAsync().then(function(redis) {
    return redis.getAsync(`pagesSeenThisSession:${user.sid}`).then(function(val) {
      return Number(val) || 0;
    });
  });
};

User.prototype.incrPagesSeenThisSession = function(user) {
  if (!user) {
    return Promise.resolve();
  }
  return redis.acquireAsync().then(function(redis) {
    var key = `pagesSeenThisSession:${user.sid}`;
    return redis.incrAsync(key).then(function() {
      return redis.expireAsync(key, 60 * 60 * 3);
    });
  });
};
