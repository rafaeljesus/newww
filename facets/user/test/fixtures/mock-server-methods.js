var murmurhash = require('murmurhash'),
    crypto = require('crypto'),
    Hapi = require('hapi'),
    users = require('./users'),
    fakeBrowse = require('./fakeuser-browse');

module.exports = function (server) {
  return {
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

    registry : {
      getBrowseData: function (type, arg, skip, limit, next) {
        return next(null, fakeBrowse[type])
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

      signupUser: function (acct, next) {
        return next(null, users[acct.name]);
      }
    },

    downloads: {

    },

    hiring: {
      getRandomWhosHiring: function () {
        return {
          "id": "voxer",
          "name": "Voxer",
          "description": "Come join us at <a href='http://www.voxer.com/careers/'>Voxer</a> & work on a powerful push-to-talk service! We are looking for node.js Eng, iOS/Android Eng, Ops Eng, & more!",
          "url": "http://www.voxer.com/careers/",
          "show_weight": 1
        };
      }
    },

    metrics: {
      addMetric: function (metric) {
        return;
      },

      addPageLatencyMetric: function (timer, page) {
        return;
      }
    }
  }
}

function passHash (auth) {
  return crypto.pbkdf2Sync(auth.password, users[auth.name].salt, users[auth.name].iterations, 20).toString('hex')
}