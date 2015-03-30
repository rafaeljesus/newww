var userValidate = require('npm-user-validate'),
    crypto = require('crypto'),
    utils = require('../../lib/utils'),
    UserModel = require('../../models/user');

module.exports = function (request, reply) {
  var opts = { };

  if (request.method === 'get') {
    if (request.params && request.params.token) {
      switch (request.params.token.split('/')[0]) {
        case 'revert':
          return revertEmail(request, reply);
        case 'confirm':
          return confirmEmail(request, reply);
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
        emailTo = data.email;

    if (!emailTo || userValidate.email(emailTo)) {
      opts.error = {email: true};

      request.timing.page = 'email-edit-error';

      request.metrics.metric({ name: 'email-edit-error' });
      return reply.view('user/email-edit', opts).code(400);
    }

    var loggedInUser = request.loggedInUser;

    UserModel.new(request)
      .verifyPassword(loggedInUser.name, data.password, function (err, isCorrect) {
        if (!isCorrect) {
          opts.error = {password: true};

          request.timing.page = 'email-edit-error';

          request.metrics.metric({ name: 'email-edit-error' });
          return reply.view('user/email-edit', opts).code(403);
        }

        return handle(request, reply, emailTo);
      });
  }
};

// ======== functions ======

function handle (request, reply, emailTo) {
  var opts = { };

  var name = request.auth.credentials.name;

  var data = {
    name: name,
    changeEmailFrom: request.auth.credentials.email,
    changeEmailTo: emailTo,
    confToken: crypto.randomBytes(18).toString('hex'),
    revToken: crypto.randomBytes(18).toString('hex')
  };

  var sendEmail = request.server.methods.email.send;

  // don't send the confmail until we know the revert mail was sent!
  data.email = data.changeEmailFrom;
  sendEmail('revert-email-change', data, request.redis)
    .catch(function (er) {
      request.logger.error('Unable to send revert email to ' + data.changeEmailFrom);
      request.logger.error(er);
      reply.view('errors/internal', opts).code(500);
      return;
    })
    .then(function () {
      data.email = data.changeEmailTo;
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

function confirmEmail (request, reply) {
  var User = UserModel.new(request);

  var opts = { },
      loggedInUser = request.loggedInUser;

  var token = request.params.token.split('/')[1],
      confHash = utils.sha(token),
      confKey = 'email_change_conf_' + confHash;

  request.redis.get(confKey, function (er, value) {

    if (er) {
      request.logger.error('Unable to get token from Redis: ' + confKey);
      request.logger.error(er);
      reply.view('errors/internal', opts).code(500);
      return;
    }

    var cached = utils.safeJsonParse(value);

    if (!cached) {
      request.logger.error('Token not found or invalid: ' + confKey);
      reply.view('errors/not-found', opts).code(404);
      return;
    }

    var name = cached.name;
    if (name !== loggedInUser.name) {
      request.logger.error(loggedInUser.name + ' attempted to change email for ' + name);
      // TODO we should really bubble this one up to the user!
      reply.view('errors/internal', opts).code(500);
      return;
    }

    var emailTo = cached.changeEmailTo,
        hash = cached.hash;

    if (hash !== confHash) {
      request.logger.error('these should be equal: hash=' + hash + '; confHash: ' + confHash);
      reply.view('errors/internal', opts).code(500);
      return;
    }

    request.redis.del(confKey, function (err) {

      if (err) {
        request.logger.warn('Unable to drop key ' + confKey);
      }

      var toSave = {
        name: loggedInUser.name,
        email: emailTo
      };

      User.save(toSave, function (er) {

        if (er) {
          request.logger.error('Unable to change email for ' + loggedInUser.name + ' to ' + emailTo);
          request.logger.error(er);
          reply.view('errors/internal', opts).code(500);
          return;
        }

        loggedInUser.email = emailTo;
        opts.confirmed = true;

        // drop the user in the cache to reflect the updated email address
        User.drop(loggedInUser.name, function (err) {

          if (err) {
            request.logger.warn('Unable to drop cache for user ' + loggedInUser.name);
            request.logger.warn(err);
          }

          request.timing.page = 'confirmEmailChange';
          request.metrics.metric({ name: 'confirmEmailChange' });

          opts.title = "Edit Profile";

          return reply.view('user/email-edit-confirmation', opts);
        });
      });
    });
  });
}

function revertEmail (request, reply) {
  var User = UserModel.new(request);

  var opts = { },
      loggedInUser = request.loggedInUser;

  var token = request.params.token.split('/')[1],
      revHash = utils.sha(token),
      revKey = 'email_change_rev_' + revHash;

  request.redis.get(revKey, function (er, value) {

    if (er) {
      request.logger.error('Error getting revert token from redis: ', revKey);
      reply.view('errors/internal', opts).code(500);
      request.logger.error(er);
      return;
    }

    var cached = utils.safeJsonParse(value);

    if (!cached) {
      request.logger.error('Token not found or invalid: ' + revKey);
      reply.view('errors/not-found', opts).code(404);
      return;
    }

    var name = cached.name;
    if (name !== loggedInUser.name) {
      request.logger.error(loggedInUser.name + ' attempted to revert email for ' + name);
      // TODO we should really bubble this one up to the user!
      reply.view('errors/internal', opts).code(500);
      return;
    }

    var emailFrom = cached.changeEmailFrom,
        confHash = utils.sha(cached.confToken),
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

        var toSave = {
          name: loggedInUser.name,
          email: emailFrom
        };

        User.save(toSave, function (er) {

          if (er) {
            request.logger.error('Unable to revert email for ' + loggedInUser.name + ' to ' + emailFrom);
            request.logger.error(er);
            reply.view('errors/internal', opts).code(500);
            return;
          }

          // drop the user in the cache to reflect the updated email address
          User.drop(loggedInUser.name, function (err) {

            if (err) {
              request.logger.warn('Unable to drop cache for user ' + loggedInUser.name);
              request.logger.warn(err);
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
}
