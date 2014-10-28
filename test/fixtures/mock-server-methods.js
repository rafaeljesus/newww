var Hapi = require('hapi');
var murmurhash = require('murmurhash');
var crypto = require('crypto');

var browse = require('./browseData');
var enterprise = require('./enterprise-data');
var whosHiring = require('./whosHiring');
var users = require('./users');
var pkgs = {
      fake: require('./fake.json'),
      unpub: require('./fake-unpublished')
    };

module.exports = function (server) {
  var methods = {

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

    errors: {
      showError: function (reply) {
        return function (err, code, message, opts) {
          opts.errId = '12345';

          if (opts.isXhr) {
            return reply(message).code(code);
          }

          var template;
          switch (code) {
            case 404:
              template = 'errors/notfound';
              break;
            case 500:
            default:
              template = 'errors/internal';
              break;
          }


          return reply.view(template, opts).code(code);
        }
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
      getBrowseData: function (type, arg, skip, limit, next) {
        return next(null, browse[type]);
      },

      getPackage: function (pkgName, next) {
        if (pkgs[pkgName]) {
          return next(null, pkgs[pkgName]);
        }

        return next(Hapi.error.notFound('Username not found: ' + pkgName));
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

    static: {
      getPage: function (name, next) {
        return next(null);
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
