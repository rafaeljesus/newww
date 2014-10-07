var Hapi = require('hapi');
var murmurhash = require('murmurhash');
var crypto = require('crypto');

var browse = require('./browseData');
var whosHiring = require('./whosHiring');
var users = require('./users');
var pkgs = {
      fake: require('./fake.json'),
      unpub: require('./fake-unpublished')
    };

module.exports = function (server) {
  var methods = {

    registry: {
      getBrowseData: function (type, arg, skip, limit, next) {
        return next(null, browse[type]);
      },

      getPackage: function (pkgName, next) {
        if (pkgs[pkgName]) {
          return next(null, pkgs[pkgName]);
        }

        return next(Hapi.error.notFound('Username not found: ' + pkgName));
      },

      getRecentAuthors: function (arg, skip, limit, next) {
        return next(null, browse.recentauthors);
      },

      packagesCreated: function (next) {
        return next(null, 0);
      },

      star: function (package, username, next) {
        return next(null, 'ok');
      },

      unstar: function (package, username, next) {
        return next(null, 'ok');
      }
    },

    downloads: {
      getAllDownloads: function (next) {
        var d = {
          day: 0,
          week: 0,
          month: 0
        };

        return next(null, d);
      },

      getAllDownloadsForPackage: function (name, next) {
        var d = {
          day: 0,
          week: 0,
          month: 0
        };

        return next(null, d);
      },

      getDownloadsForPackage: function (period, detail, package, next) {
        return next(null, [{day: '2014-07-12', downloads: 0}, {day: '2014-07-13', downloads: 0}]);
      }
    },

    hiring: {
      getAllWhosHiring: function () {
        return whosHiring.all;
      },

      getRandomWhosHiring: function () {
        return whosHiring.random;
      }
    },

    static: {
      getPage: function (name, next) {
        return next(null)
      }
    },

    user: {
      changeEmail: function (name, email, next) {
        if (name !== 'fakeuser') {
          return next(Hapi.error.notFound('Username not found: ' + username));
        }

        users.fakeuser.email = email;
        return next(null);
      },

      changePass: function (auth, next) {
        if (!users[auth.name].salt) {
          return next(null);
        }

        users[auth.name].derived_key = passHash(auth);
        return next(null);
      },

      delSession: function (request) {
        return function (user, next) {
          var sid = murmurhash.v3(user.name, 55).toString(16);

          user.sid = sid;

          request.server.app.cache.drop(sid, function (err) {
            if (err) {
              return next(Hapi.error.internal('there was an error clearing the cache'));
            }

            request.auth.session.clear();
            return next(null);
          });
        }
      },

      getUser: function (username, next) {
        if (users[username]) {
          return next(null, users[username]);
        }

        return next(Hapi.error.notFound('Username not found: ' + username));
      },

      loginUser: function (auth, next) {
        if (auth.name === 'fakeusercli') {
          return next(null, users.fakeusercli);
        }

        if (auth.name !== 'fakeuser' || passHash(auth) !== users.fakeuser.derived_key) {
          return next('Username and/or Password is wrong')
        }
        return next(null, users.fakeuser);
      },

      lookupUserByEmail: function (email, next) {
        if (email === users.fakeusercli.email) {
          return next(null, ['fakeusercli']);
        } else if (email === users.fakeuser.email) {
          return next(null, ['fakeuser', 'fakeusercli']);
        } else {
          return next(Hapi.error.notFound("Bad email, no user found with this email"));
        }
      },

      saveProfile: function (user, next) {
        return next(null, "yep, it's cool");
      },

      setSession: function (request) {
        return function (user, next) {
          var sid = murmurhash.v3(user.name, 55).toString(16);

          user.sid = sid;

          server.app.cache.set(sid, user, 0, function (err) {
            if (err) {
              return next(Hapi.error.internal('there was an error setting the cache'));
            }

            request.auth.session.set({sid: sid});
            return next(null);
          });
        }
      },

      signupUser: function (acct, next) {
        return next(null, users[acct.name]);
      }
    }
  };

  methods.registry.getPackage.cache = {
    drop: function (pkg, cb) {
      return cb(null, 200);
    }
  }

  return methods;
};

function passHash (auth) {
  return crypto.pbkdf2Sync(auth.password, users[auth.name].salt, users[auth.name].iterations, 20).toString('hex')
}
