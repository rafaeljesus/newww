var Hapi = require('hapi'),
    userValidate = require('npm-user-validate'),
    nodemailer = require('nodemailer'),
    crypto = require('crypto'),
    log = require('bole')('user-forgot'),
    uuid = require('node-uuid'),
    metrics = require('../../adapters/metrics')();

var transport, mailer;

var from, devMode, timer = {};

var ONE_HOUR = 60 * 60 * 1000; // in milliseconds

module.exports = function (options) {
  return function (request, reply) {
    timer.start = Date.now();
    var opts = {
      user: request.auth.credentials,
      hiring: request.server.methods.hiring.getRandomWhosHiring()
    };

    from = options.emailFrom;

    // if there's no email configuration set up, then we can't do this.
    // however, in dev mode, just show the would-be email right on the screen
    if (process.env.NODE_ENV === 'dev') {
      devMode = true;
    } else {
      if (!options.mailTransportModule ||
          !options.mailTransportSettings) {
        return showError(request, reply, 'Mail settings are missing!', 500);
      }
      transport = require(options.mailTransportModule);
      mailer = nodemailer.createTransport( transport(options.mailTransportSettings) );
    }

    if (request.method === 'post') {
      return handle(request, reply);
    }

    if (request.method === 'get' || request.method === 'head') {

      if (request.params && request.params.token) {
        return token(request, reply);
      }

      timer.end = Date.now();
      metrics.addPageLatencyMetric(timer, 'password-recovery-form');

      metrics.addMetric({name: 'password-recovery-form'});
      return reply.view('password-recovery-form', opts);
    }
  };
};

// ======= functions =======

function token (request, reply) {
  var opts = {
        user: request.auth.credentials,
        hiring: request.server.methods.hiring.getRandomWhosHiring()
      },
      cache = request.server.app.cache;

  var token = request.params.token,
      hash = sha(token),
      pwKey = 'pwrecover_' + hash;

  cache.get(pwKey, function (err, cached) {
    if (err) {
      return showError(request, reply, 'Error getting token from Redis', 500, pwKey);
    }

    if (!cached) {
      return showError(request, reply, 'Token not found, or invalid', 404, pwKey);
    }

    var name = cached.item.name,
        email = cached.item.email,
        verify = cached.item.token;

    if (verify !== token) {
      return showError(request, reply, 'Token not found, or invalid', 404, pwKey);
    }

    var newPass = crypto.randomBytes(18).toString('base64'),
        newAuth = {
          name: name,
          password: newPass,
          mustChangePass: true
        };

    log.warn('About to change password', { name: name });

    request.server.methods.user.changePass(newAuth, function (err, data) {
      if (err) {
      return showError(request, reply, 'Failed to set password for ' + newAuth.name, 400, er);
      }

      cache.drop(pwKey, function (err) {
        if (err) {
          return showError(request, reply, 'Unable to drop key ' + pwKey, 500, err);
        }
        opts.password = newPass;
        opts.user = null;

        timer.end = Date.now();
        metrics.addPageLatencyMetric(timer, 'password-changed');

        metrics.addMetric({ name: 'password-changed' });
        return reply.view('password-changed', opts);
      });
    });

  });
}

function handle(request, reply) {
  var opts = {
    user: request.auth.credentials,
    hiring: request.server.methods.hiring.getRandomWhosHiring()
   };

  var data = request.payload;

  if (data.selected_name) {
    return lookupUserByUsername(data.selected_name, request, reply);
  }

  if (!data.name_email) {
    opts.error = "All fields are required";

    timer.end = Date.now();
    metrics.addPageLatencyMetric(timer, 'password-recovery-error');

    metrics.addMetric({ name: 'password-recovery-error' });
    return reply.view('password-recovery-form', opts).code(400);
  }

  var nameEmail = data.name_email.trim();

  if (userValidate.username(nameEmail) && userValidate.email(nameEmail)) {
    opts.error = "Need a valid username or email address";

    timer.end = Date.now();
    metrics.addPageLatencyMetric(timer, 'password-recovery-error');

    metrics.addMetric({ name: 'password-recovery-error' });
    return reply.view('password-recovery-form', opts).code(400);
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
    hiring: request.server.methods.hiring.getRandomWhosHiring()
   };

  request.server.methods.user.lookupUserByEmail(email, function (er, usernames) {
    if (er) {
      opts.error = er.message;

      timer.end = Date.now();
      metrics.addPageLatencyMetric(timer, 'password-recovery-error');

      metrics.addMetric({ name: 'password-recovery-error' });
      return reply.view('password-recovery-form', opts).code(404);
    }

    if (usernames.length > 1) {
      opts.users = usernames;

      timer.end = Date.now();
      metrics.addPageLatencyMetric(timer, 'password-recovery-multiuser');

      metrics.addMetric({ name: 'password-recovery-multiuser' });
      return reply.view('password-recovery-form', opts);
    }

    timer.end = Date.now();
    metrics.addPageLatencyMetric(timer, 'emailLookup');

    metrics.addMetric({ name: 'emailLookup' });
    return lookupUserByUsername(usernames[0].trim(), request, reply);
  })
}

function lookupUserByUsername (name, request, reply) {
  var opts = {
    user: request.auth.credentials,
    hiring: request.server.methods.hiring.getRandomWhosHiring()
   };

  request.server.methods.user.getUser(name, function (er, user) {
    if (er) {
      opts.error = er.message;

      timer.end = Date.now();
      metrics.addPageLatencyMetric(timer, 'password-recovery-error');

      metrics.addMetric({ name: 'password-recovery-error' });
      return reply.view('password-recovery-form', opts).code(404);
    }

    var email = user.email;
    if (!email) {
      opts.error = "Username does not have an email address; please contact support"

      timer.end = Date.now();
      metrics.addPageLatencyMetric(timer, 'password-recovery-error');

      metrics.addMetric({ name: 'password-recovery-error' });
      return reply.view('password-recovery-form', opts).code(400);
    }

    var error = userValidate.email(email);
    if (error) {
      opts.error = "Username's email address is invalid; please contact support";

      timer.end = Date.now();
      metrics.addPageLatencyMetric(timer, 'password-recovery-error');

      metrics.addMetric({ name: 'password-recovery-error' });
      return reply.view('password-recovery-form', opts).code(400);
    }

    timer.end = Date.now();
    metrics.addPageLatencyMetric(timer, 'getUser');

    metrics.addMetric({ name: 'getUser' });
    return sendEmail(name, email, request, reply);
  });
}

function sendEmail(name, email, request, reply) {
  var opts = {
    user: request.auth.credentials,
    hiring: request.server.methods.hiring.getRandomWhosHiring()
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
      return showError(request, reply, 'Unable to set ' + key + 'to the cache', 500, err);
    }

    var u = request.server.info.uri + '/forgot/' + encodeURIComponent(token);

    var mail = {
      to: '"' + name + '" <' + email + '>',
      from: from,
      subject : "npm Password Reset",
      headers: { "X-SMTPAPI": { category: "password-reset" } },
      text: "You are receiving this because you (or someone else) have "
      + "requested the reset of the '"
      + name
      + "' npm user account.\r\n\r\n"
      + "Please click on the following link, or paste this into your "
      + "browser to complete the process:\r\n\r\n"
      + "    " + u + "\r\n\r\n"
      + "If you received this in error, you can safely ignore it.\r\n"
      + "The request will expire in an hour.\r\n\r\n"
      + "You can reply to this message, or email\r\n    "
      + from + "\r\nif you have questions."
      + " \r\n\r\nnpm loves you.\r\n"
    };

    if (devMode) {
      timer.end = Date.now();
      metrics.addPageLatencyMetric(timer, 'sendForgotEmail');

      metrics.addMetric({ name: 'sendForgotEmail' });
      return reply(mail);
    } else {
      mailer.sendMail(mail, function (er, result) {
        if (er) {
          return showError(request, reply, 'Unable to send revert email', 500, er);
        }

        opts.sent = true;

        timer.end = Date.now();
        metrics.addPageLatencyMetric(timer, 'sendForgotEmail');

        metrics.addMetric({ name: 'sendForgotEmail' });
        return reply.view('password-recovery-form', opts);
      });
    }

  });
}

function sha (token) {
  return crypto.createHash('sha1').update(token).digest('hex');
}

function showError (request, reply, message, code, logExtras) {
  var errId = uuid.v1();

  var opts = {
    user: request.auth.credentials,
    errId: errId,
    code: code || 500,
    hiring: request.server.methods.hiring.getRandomWhosHiring()
  };

  var error;
  switch (code) {
    case 400: error = Hapi.error.badRequest(message); break;
    case 404: error = Hapi.error.notFound(message); break;
    default: error = Hapi.error.internal(message); break;
  }

  log.error(errId + ' ' + error, logExtras);

  return reply.view('error', opts).code(code || 500);
}