var Boom = require('boom');
var Hapi = require('hapi');
var murmurhash = require('murmurhash');
var crypto = require('crypto');

var browse = require('./browse/index.js');
var enterprise = require('./enterprise-data');
var users = require('./users');
var pkgs = {
      fake: require('./packages/fake.json'),
      unpublished: require('./packages/unpublished.json'),
      benchmark: require('./packages/benchmark.json')
    };
var policies = require('./policies');

module.exports = function (server) {
  var methods = {

    corp: {
      getPage: function (name, next) {
        if (name === 'jobs') {
          return next(null, "<h1 id='jobs'>JOBS</h1>");
        }

        // if (name === '%2f..%2fboom') {
        //   return next();
        // }

        return next(new Error('OMGBOOM'));
      },

      getPolicy: function (name, next) {
        if (policies[name]) {
          return next(null, policies[name]);
        }

        return next(new Error('Not Found'));
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
        var d = [
                  { day: 32789, week: 268291, month: 1480446 },
                  null,
                  { msec: 3, error: null }
                ];

        return next(null, d);
      },

      getDownloadsForPackage: function (period, detail, package, next) {
        return next(null, [{day: '2014-07-12', downloads: 0}, {day: '2014-07-13', downloads: 0}]);
      }
    },

    npme: {
      createCustomer: function (data, next) {
        return next(null, enterprise.newUser);
      },

      createTrial: function (customer, next) {
        return next(null, customer);
      },

      getCustomer: function (email, next) {
        var key = email.split('@')[0];

        switch (key) {
          case 'exists':
            // user already exists
            return next(null, enterprise.existingUser);
          case 'new':
            // user doesn't exist yet
            return next(null, null);
          case 'noLicense':
            // for license testing
            return next(null, enterprise.noLicenseUser);
          case 'tooManyLicenses':
            // for license testing
            return next(null, enterprise.tooManyLicensesUser);
          case 'licenseBroken':
            // for license testing
            return next(null, enterprise.licenseBrokenUser);
          default:
            // something went wrong with hubspot
            return next(new Error('something went wrong'));
        }
      },

      getLicenses: function (productId, customerId, next) {
        var key = customerId.split('@')[0];

        switch (key) {
          case 'noLicense':
            return next(null, enterprise.noLicense);
          case 'tooManyLicenses':
            return next(null, enterprise.tooManyLicenses);
          case 'exists':
            return next(null, enterprise.goodLicense);
          default:
            return next(new Error('license machine brokened'));
        }
      },

      sendData: function (formID, data, next) {
        if (data.email.indexOf('error') !== -1) {
          return next(new Error('ruh roh broken'));
        }

        return next(null);
      },

      verifyTrial: function (verificationKey, next) {
        switch (verificationKey) {
          case '12345':
            return next(null, enterprise.newTrial);
          case '23456':
            return next(null, enterprise.noCustomerTrial);
          case 'noLicense':
            return next(null, enterprise.noLicenseTrial);
          case 'tooManyLicenses':
            return next(null, enterprise.tooManyLicensesTrial);
          case 'licenseBroken':
            return next(null, enterprise.licenseBrokenTrial);
          default:
            return next(new Error('cannot verify trial'));
        }
      }
    },

    registry: {
      getBrowseData: function (type, arg, skip, limit, noPackageData, next) {

        if (typeof noPackageData === 'function') {
          next = noPackageData;
          noPackageData = false;
        }

        return next(null, browse[type]);
      },

      getPackage: function (pkgName, next) {
        if (pkgs[pkgName]) {
          return next(null, pkgs[pkgName]);
        }

        if (pkgs.benchmark[pkgName]) {
          return next(null, pkgs.benchmark[pkgName]);
        }

        return next();
      },

      getAllPackages: function (skip, limit, next) {
        return next(null, browse.all);
      },

      getAllByKeyword: function (arg, skip, limit, next) {
        return next(null, browse.keyword);
      },

      getAuthors: function (arg, skip, limit, next) {
        return next(null, browse.author);
      },

      getDependedUpon: function (arg, skip, limit, next) {
        return next(null, browse.depended);
      },

      getStarredPackages: function (arg, skip, limit, next) {
        return next(null, browse.star);
      },

      getUserStars: function (arg, skip, limit, next) {
        return next(null, browse.userstar);
      },

      getUpdated: function (skip, limit, next) {
        return next(null, browse.updated);
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

    user: {
      changeEmail: function (name, email, next) {
        if (name !== 'fakeusercouch') {
          return next(Boom.notFound('Username not found: ' + name));
        }

        users.fakeusercouch.email = email;
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
              return next(Boom.internal('there was an error clearing the cache'));
            }

            request.auth.session.clear();
            return next(null);
          });
        };
      },

      getUser: function (username, next) {
        if (users[username]) {
          return next(null, users[username]);
        }

        return next(Boom.notFound('Username not found: ' + username));
      },

      loginUser: function (auth, next) {
        if (auth.name === 'fakeusercli') {
          return next(null, users.fakeusercli);
        }

        if (auth.name !== 'fakeusercouch' || passHash(auth) !== users.fakeusercouch.derived_key) {
          return next('Username and/or Password is wrong');
        }
        return next(null, users.fakeusercouch);
      },

      lookupUserByEmail: function (email, next) {
        if (email === users.fakeusercli.email) {
          return next(null, ['fakeusercli']);
        } else if (email === users.fakeusercouch.email) {
          return next(null, ['fakeusercouch', 'fakeusercli']);
        } else {
          return next(null, []);
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
              return next(Boom.internal('there was an error setting the cache'));
            }

            request.auth.session.set({sid: sid});
            return next(null);
          });
        };
      },

      signupUser: function (acct, next) {
        return next(null, users.fakeusercli);
      }
    }
  };

  methods.registry.getPackage.cache = {
    drop: function (pkg, cb) {
      return cb(null, 200);
    }
  };

  methods.user.getUser.cache = {
    drop: function (pkg, cb) {
      return cb(null, 200);
    }
  };

  return methods;
};

function passHash (auth) {
  return crypto.pbkdf2Sync(auth.password, users[auth.name].salt, users[auth.name].iterations, 20).toString('hex');
}
