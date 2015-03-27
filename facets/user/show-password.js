var redisSessions = require("../../adapters/redis-sessions");
var UserModel = require('../../models/user');

module.exports = function (request, reply) {
  var setSession = request.server.methods.user.setSession(request);
  var User = UserModel.new(request);

  var opts = { };
  var loggedInUser = request.auth.credentials;

  if (request.method === 'get') {
    request.timing.page = 'password';

    return reply.view('user/password', opts);
  }

  if (request.method === 'post') {
    var data = request.payload;

    User.verifyPassword(loggedInUser.name, data.current, function (err, isCorrect) {
      if (!isCorrect) {
        opts.error = {current: true};

        request.timing.page = 'password-error';
        request.metrics.metric({ name: 'password-error' });
        return reply.view('user/password', opts).code(403);
      }

      if (data.new !== data.verify) {
        opts.error = {verify: true};

        request.timing.page = 'password-error';
        request.metrics.metric({ name: 'password-error' });
        return reply.view('user/password', opts).code(403);
      }

      request.logger.warn('Changing password', { name: loggedInUser.name });

      var newAuth = { name: loggedInUser.name, password: data.new };
      newAuth.mustChangePass = false;
      User.save(newAuth, function (er, data) {
        if (er) {
          request.logger.warn('Failed to change password; user=' + newAuth.name);
          request.logger.warn(er);
          return reply.view('errors/internal', opts).code(500);
        }

        User.drop(loggedInUser.name, function (err) {
          if (err) {
            request.logger.warn('unable to drop cache for user ' + name);
            request.logger.warn(err);
          }

          // Log out all of this user's existing sessions across all devices
          redisSessions.dropKeysWithPrefix(newAuth.name, function(err){
            if (err) {
              // TODO do we want this error to bubble up to the user?
              request.logger.warn('Unable to drop all sessions; user=' + newAuth.name);
              request.logger.warn(er);
              return reply.view('errors/internal', opts).code(500);
            }

            request.logger.info("cleared all sessions; user=" + newAuth.name);

            User.login(newAuth, function (er, user) {
              if (er) {
                request.logger.warn('Unable to log user in; user=' + newAuth.name);
                request.logger.warn(er);
                return reply.view('errors/internal', opts).code(500);
              }

              setSession(user, function (err) {
                if (err) {
                  // TODO consider the visibility of this error
                  request.logger.warn('Unable to set session; user=' + user.name);
                  request.logger.warn(er);
                  return reply.view('errors/internal', opts).code(500);
                }

                request.timing.page = 'changePass';
                request.metrics.metric({name: 'changePass'});

                return reply.redirect('/profile');
              });
            });
          });
        });
      });
    });
  }
};
