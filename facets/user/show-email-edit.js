
var userValidate = require('npm-user-validate'),
    crypto = require('crypto');

var from, host, devMode;

module.exports = function (options) {
  return function (request, reply) {

    var opts = { };

    from = options.emailFrom;
    host = options.canonicalHost;

    if (request.method === 'get' || request.method === 'head') {
      if (request.params && request.params.token) {
        switch (request.params.token.split('/')[0]) {
          case 'revert':
            return revert(request, reply);
          case 'confirm':
            return confirm(request, reply);
          default:
            request.logger.warn('Page not found: ', request.url.path);
            reply.view('errors/not-found', opts).code(404);
            return;
        }
      } else {
        request.timing.page = 'email-edit';

        opts.title = 'Edit Profile';

        request.metrics.metric({ name: 'email-edit' });
        return reply.view('user/email-edit', opts);
      }
    }

    if (request.method === 'post' || request.method === 'put') {
      var data = request.payload,
          email2 = data.email;

      if (!email2 || userValidate.email(email2)) {
        opts.error = {email: true};

        request.timing.page = 'email-edit-error';

        request.metrics.metric({ name: 'email-edit-error' });
        return reply.view('user/email-edit', opts).code(400);
      }

      var user = request.auth.credentials;

      var salt = user.salt,
          pwHash = user.password_sha ? sha(data.password + salt) :
                   pbkdf2(data.password, salt, parseInt(user.iterations, 10)),
          profHash = user.password_sha || user.derived_key;

      if (pwHash !== profHash) {
        opts.error = {password: true};

        request.timing.page = 'email-edit-error';

        request.metrics.metric({ name: 'email-edit-error' });
        return reply.view('user/email-edit', opts).code(403);
      }

      return handle(request, reply, email2);
    }
  };
};

// ======== functions ======

function handle (request, reply, email2) {
  var opts = { };

  var name = request.auth.credentials.name;

  var data = {
    name: name,
    changeEmailFrom: request.auth.credentials.email,
    changeEmailTo: email2,
    confToken: crypto.randomBytes(18).toString('hex'),
    revToken: crypto.randomBytes(18).toString('hex')
  };

  var sendEmail = request.server.methods.email.send;

  // don't send the confmail until we know the revert mail was sent!
  sendEmail('revert-email-change', data, request.redis)
    .catch(function (er) {
      request.logger.error('Unable to send revert email to ' + data.changeEmailFrom);
      request.logger.error(er);
      reply.view('errors/internal', opts).code(500);
      return;
    })
    .then(function () {
      sendEmail('confirm-email-change', data, request.redis)
        .catch(function (er) {
          request.logger.error('Unable to send confirmation email to ' + data.changeEmailTo);
          request.logger.error(er);
          reply.view('errors/internal', opts).code(500);
          return;
        })
        .then(function () {
          opts.submitted = true;
          request.timing.page = 'email-edit-send-emails';
          request.metrics.metric({ name: 'email-edit-send-emails' });
          return reply.view('user/email-edit', opts);
        });
    });
}

function confirm (request, reply) {
  var methods = request.server.methods,
      setSession = request.server.methods.user.setSession(request);

  var opts = { },
      user = request.auth.credentials,
      cache = request.server.app.cache;

  var token = request.params.token.split('/')[1],
      confHash = sha(token),
      confKey = 'email_change_conf_' + confHash;

  request.redis.get(confKey, function (er, cached) {

    if (er) {
      request.logger.error('Unable to get token from Redis: ' + confKey);
      request.logger.error(er);
      reply.view('errors/internal', opts).code(500);
      return;
    }

    if (!cached) {
      request.logger.error('Token not found or invalid: ' + confKey);
      reply.view('errors/not-found', opts).code(404);
      return;
    }

    cached = JSON.parse(cached);

    var name = cached.name;
    if (name !== user.name) {
      request.logger.error(user.name + ' attempted to change email for ' + name);
      // TODO we should really bubble this one up to the user!
      reply.view('errors/internal', opts).code(500);
      return;
    }

    var email2 = cached.changeEmailTo,
        hash = cached.hash;

    if (hash !== confHash) {
      request.logger.error('these should be equal: hash=' + hash + '; confHash: ' + confHash);
      reply.view('errors/internal', opts).code(500);
      return;
    }

    cache.drop(confKey, function (err) {

      if (err) {
        request.logger.warn('Unable to drop key ' + confKey);
      }

      methods.user.changeEmail(user.name, email2, function (er) {

        if (er) {
          request.logger.error('Unable to change email for ' + user.name + ' to ' + email2);
          request.logger.error(er);
          reply.view('errors/internal', opts).code(500);
          return;
        }

        user.email = email2;
        opts.confirmed = true;

        setSession(user, function (err) {

          if (err) {
            request.logger.error('Unable to set the session for user ' + user.name);
            request.logger.error(err);
            reply.view('errors/internal', opts).code(500);
            return;
          }

          methods.user.getUser.cache.drop(user.name, function (er) {
            if (er) {
              request.logger.warn('Unable to drop profile cache for ' + user.name);
            }

            request.timing.page = 'confirmEmailChange';
            request.metrics.metric({ name: 'confirmEmailChange' });

            opts.title = "Edit Profile";

            return reply.view('user/email-edit-confirmation', opts);
          });
        });
      });
    });
  });
}

function revert (request, reply) {
  var methods = request.server.methods,
      setSession = request.server.methods.user.setSession(request);

  var opts = { },
      user = request.auth.credentials,
      cache = request.server.app.cache;

  var token = request.params.token.split('/')[1],
      revHash = sha(token),
      revKey = 'email_change_rev_' + revHash;

  request.redis.get(revKey, function (er, cached) {

    if (er) {
      request.logger.error('Error getting revert token from redis: ', revKey);
      reply.view('errors/internal', opts).code(500);
      request.logger.error(er);
      return;
    }

    if (!cached) {
      request.logger.error('Token not found or invalid: ' + revKey);
      reply.view('errors/not-found', opts).code(404);
      return;
    }

    cached = JSON.parse(cached);

    var name = cached.name;
    if (name !== user.name) {
      request.logger.error(user.name + ' attempted to revert email for ' + name);
      // TODO we should really bubble this one up to the user!
      reply.view('errors/internal', opts).code(500);
      return;
    }

    var email1 = cached.changeEmailFrom,
        confHash = sha(cached.confToken),
        confKey = 'email_change_conf_' + confHash,
        hash = cached.hash;

    if (hash !== revHash) {
      request.logger.error('these should be equal: hash=' + hash + '; revHash: ' + revHash);
      reply.view('errors/internal', opts).code(500);
      return;
    }

    request.redis.del(confKey, function (err) {

      if (err) {
        request.logger.warn('Unable to drop key ' + confKey);
      }

      request.redis.del(revKey, function (err) {

        if (err) {
          request.logger.warn('Unable to drop key ' + revKey);
        }

        methods.user.changeEmail(user.name, email1, function (er) {

          if (er) {
            request.logger.error('Unable to revert email for ' + user.name + ' to ' + email1);
            request.logger.error(er);
            reply.view('errors/internal', opts).code(500);
            return;
          }

          user.email = email1;

          setSession(user, function (err) {

            if (err) {
              request.logger.error('Unable to set the session for user ' + user.name);
              request.logger.error(err);
              reply.view('errors/internal', opts).code(500);
              return;
            }

            methods.user.getUser.cache.drop(user.name, function (er) {
              if (er) {
                request.logger.warn('Unable to drop profile cache for ' + user.name);
              }

              request.timing.page = 'revertEmailChange';

              request.metrics.metric({ name: 'revertEmailChange' });

              opts.title = "Edit Profile";

              return reply.view('user/email-edit-confirmation', opts);
            });
          });
        });
      });
    });
  });
}

function sha (s) {
  return crypto.createHash("sha1").update(s).digest("hex");
}

function pbkdf2 (pass, salt, iterations) {
  return crypto.pbkdf2Sync(pass, salt, iterations, 20).toString('hex');
}
