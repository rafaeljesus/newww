var _ = require('lodash');

var User = module.exports = function(opts) {
  _.extend(this, {
    host: process.env.USER_API,
    presenter: true,
    debug: false,
    bearer: false
  }, opts);

  return this;
};

var fixtures = {
  user: {
    name: "forrest",
    email: "forrest@example.com",
    password: "12345",
    meta: {
      github: "forrest",
      twitter: "forrest"
    }
  },
  usercli: {
    name: "forrestcli",
    email: "forrest@example.com",
    password: "12345",
    mustChangePass: true
  },
  packages: [
    {name: "foo", description: "It's a foo!"},
    {name: "bar", description: "It's a bar!"}
  ],
  stars: [
    'minimist',
    'hapi'
  ]
};

User.prototype.get = function(name, options, callback) {
  var res = fixtures.user;

  if (!callback) {
    callback = options;
    options = {};
  }

  if (name === "mr-perdido") {
    var err = Error("User not found");
    err.statusCode = 404;
    return callback(err);
  }

  if (options.stars) { res.stars = fixtures.stars; }

  if (options.packages) { res.packages = fixtures.packages; }

  return callback(null, res);
};

User.prototype.getStars = function(name, callback) {
  return callback(null, fixtures.stars);
};

User.prototype.getPackages = function(name, callback) {
  return callback(null, fixtures.packages);
};

User.prototype.login = function (loginInfo, callback) {

  if (loginInfo.name === fixtures.usercli.name &&
      loginInfo.password === fixtures.usercli.password) {
    return callback(null, fixtures.usercli);
  }

  if (loginInfo.name !== fixtures.user.name ||
      loginInfo.password !== fixtures.user.password) {
    var err = Error("password is incorrect for " + fixtures.user.name);
    err.statusCode = 401;
    return callback(err);
  }

  return callback(null, fixtures.user);
};
