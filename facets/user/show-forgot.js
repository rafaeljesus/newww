
var userValidate = require('npm-user-validate'),
    crypto = require('crypto');

var from, host;

var ONE_HOUR = 60 * 60 * 1000; // in milliseconds

module.exports = function (options) {
  return function (request, reply) {

    var opts = { };

    from = options.emailFrom;
    host = options.canonicalHost;

    if (request.method === 'post') {
      return handle(request, reply);
    }

    if (request.method === 'get' || request.method === 'head') {

      if (request.params && request.params.token) {
        return processToken(request, reply);
      }

      request.timing.page = 'password-recovery-form';

      request.metrics.metric({name: 'password-recovery-form'});
      return reply.view('user/password-recovery-form', opts);
    }
  };
};

// ======= functions =======

function processToken(request, reply) {
  var opts = {},
      cache = request.server.app.cache;

  var token = request.params.token,
      hash = sha(token),
      pwKey = 'pwrecover_' + hash;

  cache.get(pwKey, function (err, item, cached) {
    if (err) {
      request.logger.error('Error getting token from redis', pwKey);
      request.logger.error(err);
      reply.view('errors/internal', opts).code(500);
      return;
    }

    if (!cached) {
      request.logger.error('Token not found or invalid: ', pwKey);
      reply.view('errors/internal', opts).code(500);
      return;
    }

    var name = cached.item.name,
        verify = cached.item.token;

    if (verify !== token) {
      request.logger.error('token in cache does not match user token; cached=' + cached.item.token + '; token=' + token);
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

    request.server.methods.user.changePass(newAuth, function (err) {

      if (err) {
        request.logger.error('Failed to set password for ' + newAuth.name);
        request.logger.error(err);
        reply.view('errors/internal', opts).code(500);
        return;
      }

      cache.drop(pwKey, function (err) {

        if (err) {
          request.logger.warn('Unable to drop key ' + pwKey);
          request.logger.warn(err);
        }

        opts.password = newPass;
        opts.user = null;

        request.timing.page = 'password-changed';

        request.metrics.metric({ name: 'password-changed' });
        return reply.view('user/password-changed', opts);
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
  var opts = {
    user: request.auth.credentials
   };

  request.server.methods.user.lookupUserByEmail(email, function (er, usernames) {
    if (er) {
      opts.error = er.message;

      request.timing.page = 'password-recovery-error';

      request.metrics.metric({ name: 'password-recovery-error' });
      return reply.view('user/password-recovery-form', opts).code(404);
    }

    if (usernames.length > 1) {
      opts.users = usernames;

      request.timing.page = 'password-recovery-multiuser';

      request.metrics.metric({ name: 'password-recovery-multiuser' });
      return reply.view('user/password-recovery-form', opts);
    }

    if (!usernames || !usernames.length) {
      opts.error = "No user found with email address " + email;
      return reply.view('user/password-recovery-form', opts).code(400);
    }

    request.timing.page = 'emailLookup';

    request.metrics.metric({ name: 'emailLookup' });
    return lookupUserByUsername(usernames[0].trim(), request, reply);
  });
}

function lookupUserByUsername (name, request, reply) {
  var opts = { };

  request.server.methods.user.getUser(name, function (er, user) {
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
    return sendEmail(name, email, request, reply);
  });
}

function sendEmail(name, email, request, reply) {

  var opts = {};

  // the token needs to be url-safe
  var token = crypto.randomBytes(30).toString('base64')
              .split('/').join('_')
              .split('+').join('-'),
      hash = sha(token),
      data = {
        name: name + '',
        email: email + '',
        token: token + ''
      },
      key = 'pwrecover_' + hash;

  request.server.app.cache.set(key, data, ONE_HOUR, function (err) {

    if (err) {
      request.logger.error('Unable to set ' + key + ' to the cache');
      request.logger.error(err);
      reply.view('errors/internal', opts).code(500);
      return;
    }

    var u = host + '/forgot/' + encodeURIComponent(token);

    var mail = {
      to: '"' + name + '" <' + email + '>',
      from: from,
      subject : "npm Password Reset",
      headers: { "X-SMTPAPI": { category: "password-reset" } },
      text: require('./emailTemplates/forgotPassword')(name, u, from)
    };

    var sendEmail = request.server.methods.email.send;

    sendEmail(mail, function (er) {

      if (er) {
        request.logger.error('Unable to sent revert email to ' + mail.to);
        request.logger.error(er);
        return reply.view('errors/internal', opts).code(500);
      }

      if (process.env.NODE_ENV === 'dev') { opts.mail = JSON.stringify(mail); }

      opts.sent = true;

      request.timing.page = 'sendForgotEmail';
      request.metrics.metric({ name: 'sendForgotEmail' });

      return reply.view('user/password-recovery-form', opts);
    });
  });
}

function sha (token) {
  return crypto.createHash('sha1').update(token).digest('hex');
}
