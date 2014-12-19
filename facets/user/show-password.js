var Hapi = require('hapi'),
    crypto = require('crypto'),
    userValidate = require('npm-user-validate'),
    redisSessions = require("../../adapters/redis-sessions");

module.exports = function (request, reply) {
  var opts = {
    user: request.auth.credentials,

    namespace: 'user-password',
    title: 'Edit Profile'
  };

  var changePass = request.server.methods.user.changePass,
      loginUser = request.server.methods.user.loginUser,
      setSession = request.server.methods.user.setSession(request);

  if (request.method === 'get' || request.method === 'head') {
    request.timing.page = 'password';

    return reply.view('user/password', opts);
  }

  if (request.method === 'post') {
    var data = request.payload;

    var prof = opts.user,
        salt = prof.salt,
        hashCurrent = prof.password_sha ? sha(data.current + salt) :
                        pbkdf2(data.current, salt, parseInt(prof.iterations, 10)),
        hashProf = prof.password_sha || prof.derived_key;

    if (hashCurrent !== hashProf) {
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

    request.logger.warn('Changing password', { name: prof.name });

    var newAuth = { name: prof.name, password: data.new };
    newAuth.mustChangePass = false;

    changePass(newAuth, function (er, data) {
      if (er) {
        request.logger.warn('Failed to change password; user=' + newAuth.name);
        request.logger.warn(er);
        return reply.view('errors/internal', opts).code(500);
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

        loginUser(newAuth, function (er, user) {
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
            request.metrics.metric({name: 'changePass'})

            return reply.redirect('/profile');
          });
        });
      });
    });
  }
}


// ======== functions =======

function pbkdf2 (pass, salt, iterations) {
  return crypto.pbkdf2Sync(pass, salt, iterations, 20).toString('hex')
}

function sha (s) {
  return crypto.createHash("sha1").update(s).digest("hex")
}
