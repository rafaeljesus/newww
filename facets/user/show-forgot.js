var NAMESPACE = 'user-forgot';

var Hapi = require('hapi'),
    userValidate = require('npm-user-validate'),
    nodemailer = require('nodemailer'),
    crypto = require('crypto');

var transport, mailer;

var from, host, devMode, timer = {};

var ONE_HOUR = 60 * 60 * 1000; // in milliseconds

module.exports = function (options) {
  return function (request, reply) {
    timer.start = Date.now();

    var showError = request.server.methods.errors.showError(reply);

    var opts = {
      user: request.auth.credentials,
      namespace: NAMESPACE
    };

    from = options.emailFrom;
    host = options.canonicalHost;

    // if there's no email configuration set up, then we can't do this.
    // however, in dev mode, just show the would-be email right on the screen
    if (process.env.NODE_ENV === 'dev') {
      devMode = true;
    } else {
      if (!options.mailTransportModule ||
          !options.mailTransportSettings) {
        return showError(null, 500, 'Mail settings are missing!', opts);
      }
      transport = require(options.mailTransportModule);
      mailer = nodemailer.createTransport( transport(options.mailTransportSettings) );
    }

    if (request.method === 'post') {
      return handle(request, reply);
    }

    if (request.method === 'get' || request.method === 'head') {

      if (request.params && request.params.token) {
        return processToken(request, reply);
      }

      timer.end = Date.now();
      request.timing.page = 'password-recovery-form';

      request.metrics.metric({name: 'password-recovery-form'});
      return reply.view('user/password-recovery-form', opts);
    }
  };
};

// ======= functions =======

function processToken(request, reply) {
  var opts = {
        user: request.auth.credentials,
        namespace: NAMESPACE
      },
      cache = request.server.app.cache,
      showError = request.server.methods.errors.showError(reply);

  var token = request.params.token,
      hash = sha(token),
      pwKey = 'pwrecover_' + hash;

  cache.get(pwKey, function (err, cached) {
    if (err) {
      return showError(pwKey, 500, 'Error getting token from Redis', opts);
    }

    if (!cached) {
      return showError(pwKey, 500, 'Token not found, or invalid', opts);
    }

    var name = cached.item.name,
        email = cached.item.email,
        verify = cached.item.token;

    if (verify !== token) {
      return showError(pwKey, 500, 'Token not found, or invalid', opts);
    }

    var newPass = crypto.randomBytes(18).toString('base64'),
        newAuth = {
          name: name,
          password: newPass,
          mustChangePass: true
        };

    request.logger.warn('About to change password', { name: name });

    request.server.methods.user.changePass(newAuth, function (err, data) {
      if (err) {
        return showError(err, 500, 'Failed to set password for ' + newAuth.name, opts);
      }

      cache.drop(pwKey, function (err) {
        if (err) {
          return showError(err, 500, 'Unable to drop key ' + pwKey, opts);
        }
        opts.password = newPass;
        opts.user = null;

        timer.end = Date.now();
        request.timing.page = 'password-changed';

        request.metrics.metric({ name: 'password-changed' });
        return reply.view('user/password-changed', opts);
      });
    });

  });
}

function handle(request, reply) {
  var opts = {
    user: request.auth.credentials,
    namespace: NAMESPACE
   };

  var data = request.payload;

  if (data.selected_name) {
    return lookupUserByUsername(data.selected_name, request, reply);
  }

  if (!data.name_email) {
    opts.error = "All fields are required";

    timer.end = Date.now();
    request.timing.page = 'password-recovery-error';

    request.metrics.metric({ name: 'password-recovery-error' });
    return reply.view('user/password-recovery-form', opts).code(400);
  }

  var nameEmail = data.name_email.trim();

  if (userValidate.username(nameEmail) && userValidate.email(nameEmail)) {
    opts.error = "Need a valid username or email address";

    timer.end = Date.now();
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
    user: request.auth.credentials,
    namespace: NAMESPACE
   };

  request.server.methods.user.lookupUserByEmail(email, function (er, usernames) {
    if (er) {
      opts.error = er.message;

      timer.end = Date.now();
      request.timing.page = 'password-recovery-error';

      request.metrics.metric({ name: 'password-recovery-error' });
      return reply.view('user/password-recovery-form', opts).code(404);
    }

    if (usernames.length > 1) {
      opts.users = usernames;

      timer.end = Date.now();
      request.timing.page = 'password-recovery-multiuser';

      request.metrics.metric({ name: 'password-recovery-multiuser' });
      return reply.view('user/password-recovery-form', opts);
    }

    if (!usernames || !usernames.length) {
      opts.error = "No user found with email address " + email
      return reply.view('user/password-recovery-form', opts).code(400);
    }

    timer.end = Date.now();
    request.timing.page = 'emailLookup';

    request.metrics.metric({ name: 'emailLookup' });
    return lookupUserByUsername(usernames[0].trim(), request, reply);
  })
}

function lookupUserByUsername (name, request, reply) {
  var opts = {
    user: request.auth.credentials,
    namespace: NAMESPACE
   };

  request.server.methods.user.getUser(name, function (er, user) {
    if (er) {
      opts.error = er.message;

      timer.end = Date.now();
      request.timing.page = 'password-recovery-error';

      request.metrics.metric({ name: 'password-recovery-error' });
      return reply.view('user/password-recovery-form', opts).code(404);
    }

    var email = user.email;
    if (!email) {
      opts.error = "Username does not have an email address; please contact support"

      timer.end = Date.now();
      request.timing.page = 'password-recovery-error';

      request.metrics.metric({ name: 'password-recovery-error' });
      return reply.view('user/password-recovery-form', opts).code(400);
    }

    var error = userValidate.email(email);
    if (error) {
      opts.error = "Username's email address is invalid; please contact support";

      timer.end = Date.now();
      request.timing.page = 'password-recovery-error';

      request.metrics.metric({ name: 'password-recovery-error' });
      return reply.view('user/password-recovery-form', opts).code(400);
    }

    timer.end = Date.now();
    request.timing.page = 'getUser';

    request.metrics.metric({ name: 'getUser' });
    return sendEmail(name, email, request, reply);
  });
}

function sendEmail(name, email, request, reply) {
  var showError = request.server.methods.errors.showError(reply);

  var opts = {
    user: request.auth.credentials,
    namespace: NAMESPACE
  };

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
      return showError(err, 'Unable to set ' + key + 'to the cache', opts);
    }

    var u = host + '/forgot/' + encodeURIComponent(token);

    var mail = {
      to: '"' + name + '" <' + email + '>',
      from: from,
      subject : "npm Password Reset",
      headers: { "X-SMTPAPI": { category: "password-reset" } },
      text: require('./emailTemplates/forgotPassword')(name, u, from)
    };

    if (devMode) {
      timer.end = Date.now();
      request.timing.page = 'sendForgotEmail';

      request.metrics.metric({ name: 'sendForgotEmail' });
      return reply(mail);
    } else {
      mailer.sendMail(mail, function (er, result) {
        if (er) {
          return showError(er, 500, 'Unable to send revert email', opts);
        }

        opts.sent = true;

        timer.end = Date.now();
        request.timing.page = 'sendForgotEmail';

        request.metrics.metric({ name: 'sendForgotEmail' });
        return reply.view('user/password-recovery-form', opts);
      });
    }

  });
}

function sha (token) {
  return crypto.createHash('sha1').update(token).digest('hex');
}
