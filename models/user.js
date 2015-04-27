var _ = require('lodash');
var cache = require('../lib/cache');
var decorate = require(__dirname + '/../presenters/user');
var fmt = require('util').format;
var mailchimp = require('mailchimp-api');
var P = require('bluebird');
var Request = require('../lib/external-request');
var userValidate = require('npm-user-validate');
var reach = require('steeltoe');
var chimp;

var User = module.exports = function(opts) {
  _.extend(this, {
    host: process.env.USER_API || 'https://user-api-example.com',
    bearer: null,
    request: null,
  }, opts);

  // Infer bearer from hapi request object
  if (!this.bearer && reach(this).get('request.loggedInUser.name')) {
    this.bearer = this.request.loggedInUser.name;
  }

  // Infer logger from hapi request object
  if (!this.logger && reach(this).get('request.logger')) {
    this.logger = this.request.logger;
  }

  if (!this.logger) {
    this.logger = {
      error: console.error,
      info: console.log
    };
  }

  return this;
};

User.new = function(opts) {
  return new User(opts);
};

User.prototype.confirmEmail = function (user, callback) {
  var url = fmt('%s/user/%s/verify', this.host, user.name);

  return new P(function(resolve, reject) {
    var opts = {
      url: url,
      json: true,
      body: {
        verification_key: user.verification_key
      }
    };

    Request.post(opts, function (err, resp, body) {
      if (err) { return reject(err); }
      if (resp.statusCode > 399) {
        err = Error('error verifying user ' + user.name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(body);
    });
  }).nodeify(callback);
};

User.prototype.login = function(loginInfo, callback) {
  var url = fmt('%s/user/%s/login', this.host, loginInfo.name);

  return new P(function (resolve, reject) {
    Request.post({
      url: url,
      json: true,
      body: {
        password: loginInfo.password
      }
    }, function (err, resp, body) {

      if (err) { return reject(err); }

      if (resp.statusCode === 401) {
        err = Error('password is incorrect for ' + loginInfo.name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      if (resp.statusCode === 404) {
        err = Error('user ' + loginInfo.name + ' not found');
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return resolve(body);
    });
  }).nodeify(callback);
};

User.prototype.generateUserACLOptions = function generateUserACLOptions(name) {
  return {
    url: fmt('%s/user/%s', this.host, name),
    json: true,
  };
};

User.prototype.dropCache = function dropCache (name, callback) {
    cache.drop(this.generateUserACLOptions(name), callback);
};

User.prototype.get = function(name, options, callback) {
  var _this = this;
  var user;

  if (!callback) {
    callback = options;
    options = {};
  }

  return cache.getP(_this.generateUserACLOptions(name))
  .then(function(_user) {
    user = decorate(_user);
    var actions = {};
    if (options.stars) { actions.stars = _this.getStars(user.name); }
    if (options.packages) { actions.packages = _this.getPackages(user.name); }

    return P.props(actions);
  })
  .then(function(results) {
    user.stars = results.stars;
    user.packages = results.packages;

    return user;
  })
  .nodeify(callback);
};

User.prototype.getPackages = function(name, callback) {
  var _this = this;
  var url = fmt('%s/user/%s/package', this.host, name);

  return new P(function(resolve, reject) {
    var opts = {
      url: url,
      qs: {
        format: 'detailed',
        per_page: 9999
      },
      json: true
    };

    if (_this.bearer) { opts.headers = {bearer: _this.bearer}; }

    Request.get(opts, function(err, resp, body){

      if (err) { return reject(err); }
      if (resp.statusCode > 399) {
        err = Error('error getting packages for user ' + name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(body);
    });
  }).nodeify(callback);
};

User.prototype.getStars = function(name, callback) {
  var _this = this;
  var url = fmt('%s/user/%s/stars?format=detailed', this.host, name);

  return new P(function(resolve, reject) {
    var opts = {
      url: url,
      json: true
    };

    if (_this.bearer) { opts.headers = {bearer: _this.bearer}; }

    Request.get(opts, function(err, resp, body){

      if (err) { return reject(err); }
      if (resp.statusCode > 399) {
        err = Error('error getting stars for user ' + name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(body);
    });
  })
  .nodeify(callback);
};

User.prototype.login = function(loginInfo, callback) {
  var url = fmt('%s/user/%s/login', this.host, loginInfo.name);

  return new P(function (resolve, reject) {

    Request.post({
      url: url,
      json: true,
      body: {
        password: loginInfo.password
      }
    }, function (err, resp, body) {

      if (err) { return reject(err); }

      if (resp.statusCode === 401) {
        err = Error('password is incorrect for ' + loginInfo.name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      if (resp.statusCode === 404) {
        err = Error('user ' + loginInfo.name + ' not found');
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return resolve(body);
    });
  }).nodeify(callback);
};

User.prototype.lookupEmail = function(email, callback) {
  var _this = this;

  return new P(function (resolve, reject) {
    if (userValidate.email(email)) {
      var err = new Error('email is invalid');
      err.statusCode = 400;
      _this.logger.error(err);
      return reject(err);
    }

    var url = _this.host + '/user/' + email;

    Request.get({url: url, json: true}, function (err, resp, body) {
      if (err) { return reject(err); }
      if (resp.statusCode > 399) {
        err = Error('error looking up username(s) for ' + email);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return resolve(body);
    });
  }).nodeify(callback);
};

User.prototype.save = function (user, callback) {
  var url = this.host + '/user/' + user.name;

  return new P(function (resolve, reject) {
    var opts = {
      url: url,
      json: true,
      body: user
    };

    Request.post(opts, function (err, resp, body) {
      if (err) { return reject(err); }
      if (resp.statusCode > 399) {
        err = Error('error updating profile for ' + user.name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(body);
    });
  }).nodeify(callback);
};

User.prototype.signup = function (user, callback) {
  var _this = this;

  if (user.npmweekly === 'on') {
    var mc = this.getMailchimp();
    mc.lists.subscribe({id: 'e17fe5d778', email:{email:user.email}}, function() {
      // do nothing on success
    }, function(error) {
      _this.logger.error('Could not register user for npm Weekly: ' + user.email);
      if (error.error) {
        _this.logger.error(error.error);
      }
    });
  }

  var url = this.host + '/user';

  return new P(function (resolve, reject) {
    var opts = {
      url: url,
      body: user,
      json: true
    };

    Request.put(opts, function (err, resp, body) {
      if (err) { return reject(err); }
      if (resp.statusCode > 399) {
        err = Error('error creating user ' + user.name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(body);
    });
  })
  .nodeify(callback);
};

User.prototype.getMailchimp = function getMailchimp () {
  if (!chimp) {
    chimp = new mailchimp.Mailchimp(process.env.MAILCHIMP_KEY);
  }
  return chimp;
};

User.prototype.verifyPassword = function (name, password, callback) {
  var loginInfo = {
    name: name,
    password: password
  };

  return this.login(loginInfo, callback);
};
