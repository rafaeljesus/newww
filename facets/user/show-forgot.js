var User = require('../../models/user'),
    userValidate = require('npm-user-validate'),
    utils = require('../../lib/utils'),
    crypto = require('crypto'),
    from = "support@npmjs.com";

module.exports = function (request, reply) {
  var opts = { };

  if (request.method === 'post') {
    return handle(request, reply);
  }

  if (request.method === 'get') {

    if (request.params && request.params.token) {
      return processToken(request, reply);
    }

    request.timing.page = 'password-recovery-form';

    request.metrics.metric({name: 'password-recovery-form'});
    return reply.view('user/password-recovery-form', opts);
  };
};

function processToken(request, reply) {
  var opts = {},
      cache = request.server.app.cache._cache.connection.client;

  var token = request.params.token,
      hash = utils.sha(token),
      pwKey = 'pwrecover_' + hash;

  cache.get(pwKey, function (err, value) {
    if (err) {
      request.logger.error('Error getting token from redis', pwKey);
      request.logger.error(err);
      reply.view('errors/internal', opts).code(500);
      return;
    }

    var cached = utils.safeJsonParse(value);

    if (!cached) {
      request.logger.error('Token not found or invalid: ', pwKey);
      reply.view('errors/internal', opts).code(500);
      return;
    }

    var name = cached.name,
        verify = cached.token;

    if (verify !== token) {
      request.logger.error('token in cache does not match user token; cached=' + cached.token + '; token=' + token);
      reply.view('errors/internal', opts).code(500);
      return;
    }

    var newPass = crypto.randomBytes(18).toString('base64'),
        newAuth = {
          name: name,
          password: newPass,
          mustChangePass: true
        };

    request.logger.warn('About to change password', { name: name });

    User.new(request)
      .save(newAuth, function (err) {

      if (err) {
        request.logger.error('Failed to set password for ' + newAuth.name);
        request.logger.error(err);
        reply.view('errors/internal', opts).code(500);
        return;
      }

      // make sure we're getting the latest user object next time we need it
      User.drop(name, function (err) {
        if (err) {
          request.logger.warn('unable to drop cache for user ' + name);
          request.logger.warn(err);
        }

        cache.del(pwKey, function (err) {

          if (err) {
            request.logger.warn('Unable to drop key ' + pwKey);
            request.logger.warn(err);
          }

          opts.password = newPass;

          request.timing.page = 'password-changed';

          request.metrics.metric({ name: 'password-changed' });
          return reply.view('user/password-changed', opts);
        });
      });
    });
  });
}

function handle(request, reply) {
  var opts = { };

  var data = request.payload;

  if (data.selected_name) {
    return lookupUserByUsername(data.selected_name, request, reply);
  }

  if (!data.name_email) {
    opts.error = "All fields are required";

    request.timing.page = 'password-recovery-error';

    request.metrics.metric({ name: 'password-recovery-error' });
    return reply.view('user/password-recovery-form', opts).code(400);
  }

  var nameEmail = data.name_email.trim();

  if (userValidate.username(nameEmail) && userValidate.email(nameEmail)) {
    opts.error = "Need a valid username or email address";

    request.timing.page = 'password-recovery-error';

    request.metrics.metric({ name: 'password-recovery-error' });
    return reply.view('user/password-recovery-form', opts).code(400);
  }

  // look up the user
  if (nameEmail.indexOf('@') !== -1) {
    return lookupUserByEmail(nameEmail, request, reply);
  } else {
    return lookupUserByUsername(nameEmail, request, reply);
  }
}

function lookupUserByEmail (email, request, reply) {
  var opts = { };

   User.new(request).lookupEmail(email, function (er, users) {
    if (er) {
      opts.error = er.message;

      request.timing.page = 'password-recovery-error';

      request.metrics.metric({ name: 'password-recovery-error' });
      return reply.view('user/password-recovery-form', opts).code(404);
    }

    if (users.length > 1) {
      opts.users = users;

      request.timing.page = 'password-recovery-multiuser';

      request.metrics.metric({ name: 'password-recovery-multiuser' });
      return reply.view('user/password-recovery-form', opts);
    }

    if (!users || !users.length) {
      opts.error = "No user found with email address " + email;
      return reply.view('user/password-recovery-form', opts).code(400);
    }

    request.timing.page = 'emailLookup';

    request.metrics.metric({ name: 'emailLookup' });
    return lookupUserByUsername(users[0].trim(), request, reply);
  });
}

function lookupUserByUsername (name, request, reply) {
  var opts = { };

  User.new(request).get(name, function (er, user) {
    if (er) {
      opts.error = er.message;

      request.timing.page = 'password-recovery-error';

      request.metrics.metric({ name: 'password-recovery-error' });
      return reply.view('user/password-recovery-form', opts).code(404);
    }

    var email = user.email;
    if (!email) {
      opts.error = "Username does not have an email address; please contact support";

      request.timing.page = 'password-recovery-error';

      request.metrics.metric({ name: 'password-recovery-error' });
      return reply.view('user/password-recovery-form', opts).code(400);
    }

    var error = userValidate.email(email);
    if (error) {
      opts.error = "Username's email address is invalid; please contact support";

      request.timing.page = 'password-recovery-error';

      request.metrics.metric({ name: 'password-recovery-error' });
      return reply.view('user/password-recovery-form', opts).code(400);
    }

    request.timing.page = 'getUser';

    request.metrics.metric({ name: 'getUser' });
    return sendEmail(request, reply, {name: name, email: email});
  });
}

function sendEmail(request, reply, data) {

  var opts = {};

  var emailIt = request.server.methods.email.send;

  emailIt('forgot-password', data, request.redis)
    .catch(function (er) {
      request.logger.error('Unable to sent revert email to ' + mail.to);
      request.logger.error(er);
      return reply.view('errors/internal', opts).code(500);
    })
    .then(function () {
      opts.sent = true;

      request.timing.page = 'sendForgotEmail';
      request.metrics.metric({ name: 'sendForgotEmail' });

      return reply.view('user/password-recovery-form', opts);
    });
}
