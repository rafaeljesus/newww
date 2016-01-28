var redisSessions = require("../adapters/redis-sessions");
var UserAgent = require('../agents/user');
var VError = require('verror');

module.exports = function(request, reply) {
  var setSession = request.server.methods.user.setSession(request);

  var opts = { };
  var loggedInUser = request.loggedInUser;
  var User = new UserAgent(loggedInUser);

  if (request.method === 'get') {
    request.timing.page = 'password';

    return reply.view('user/password', opts);
  }

  if (request.method === 'post') {
    var data = request.payload;

    User.verifyPassword(loggedInUser.name, data.current, function(err, isCorrect) {

      if (!isCorrect) {
        opts.error = {
          current: true
        };

        request.timing.page = 'password-error';
        request.metrics.metric({
          name: 'password-error'
        });
        return reply.view('user/password', opts).code(403);
      }

      if (data.new !== data.verify) {
        opts.error = {
          verify: true
        };

        request.timing.page = 'password-error';
        request.metrics.metric({
          name: 'password-error'
        });
        return reply.view('user/password', opts).code(403);
      }

      request.logger.warn('Changing password', {
        name: loggedInUser.name
      });

      var newAuth = {
        name: loggedInUser.name,
        password: data.new,
        resource: {
          mustChangePass: null
        }
      };

      User.save(newAuth, function(err, data) {
        if (err) {
          return reply(new VError(err, "Failed to change password for user '%s'", newAuth.name));
        }

        User.dropCache(loggedInUser.name, function(err) {
          if (err) {
            return reply(new VError(err, "Unable to drop cached user object for user '%s'", newAuth.name));
          }

          // Log out all of this user's existing sessions across all devices
          redisSessions.dropKeysWithPrefix(newAuth.name, function(err) {
            if (err) {
              return reply(new VError(err, "Unable to drop all sessions for user '%s'", newAuth.name));
            }

            request.logger.info("cleared all sessions; user=" + newAuth.name);

            User.login(newAuth, function(err, user) {
              if (err) {
                return reply(new VError(err, "Unable to log in user '%s'", newAuth.name));
              }

              setSession(user, function(err) {
                if (err) {
                  return reply(new VError(err, "Unable to set session for user '%s'", newAuth.name));
                }

                request.timing.page = 'changePass';
                request.metrics.metric({
                  name: 'changePass'
                });

                return reply.redirect('/profile');
              });
            });
          });
        });
      });
    });
  }
};
