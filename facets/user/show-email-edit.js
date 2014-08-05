var Hapi = require('hapi'),
    userValidate = require('npm-user-validate'),
    crypto = require('crypto'),
    log = require('bole')('user-email-edit'),
    uuid = require('node-uuid'),
    metrics = require('../../adapters/metrics')();

var from, devMode, timer = {};

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
    devMode = false;
    if (!options.mailTransportType ||
        !options.mailTransportSettings) {
      if (process.env.NODE_ENV === 'dev') {
        devMode = true;
      } else {
        return showError(request, reply, 'Mail settings are missing!', 500);
      }
    }

    if (!devMode) {
      var nodemailer = require('nodemailer'),
          mailer = nodemailer.createTransport(options.mailTransportType,
                                              options.mailTransportSettings);
    }

    if (request.method === 'get' || request.method === 'head') {
      if (request.params && request.params.token) {
        var action_token = request.params.token.split('/');
        switch (request.params.token.split('/')[0]) {
          case 'revert': return revert(request, reply);
          case 'confirm': return confirm(request, reply);
          default: return showError(request, reply, 'Page not found', 404, request.url.path);
        }
      } else {
        timer.end = Date.now();
        metrics.addPageLatencyMetric(timer, 'email-edit');

        metrics.addMetric({ name: 'email-edit' });
        return reply.view('email-edit', opts);
      }
    }

    if (request.method === 'post' || request.method === 'put') {
      var data = request.payload,
          email2 = data.email;

      if (!email2 || userValidate.email(email2)) {
        opts.error = 'Must provide a valid email address';

        timer.end = Date.now();
        metrics.addPageLatencyMetric(timer, 'email-edit-error');

        metrics.addMetric({ name: 'email-edit-error' });
        return reply.view('email-edit', opts).code(400);
      }

      var salt = opts.user.salt,
          pwHash = opts.user.password_sha ? sha(data.password + salt) :
                   pbkdf2(data.password, salt, parseInt(opts.user.iterations, 10)),
          profHash = opts.user.password_sha || opts.user.derived_key;

      if (pwHash !== profHash) {
        opts.error = 'Invalid password';

        timer.end = Date.now();
        metrics.addPageLatencyMetric(timer, 'email-edit-error');

        metrics.addMetric({ name: 'email-edit-error' });
        return reply.view('email-edit', opts).code(403);
      }
      return handle(request, reply, email2);
    }
  };
};

// ======== functions ======

function handle (request, reply, email2) {
  var opts = {
    user: request.auth.credentials,
    hiring: request.server.methods.hiring.getRandomWhosHiring()
  };

  var confTok = crypto.randomBytes(18).toString('hex'),
      confHash = sha(confTok),
      confKey = 'email_change_conf_' + confHash,
      confLink = '/email-edit/confirm/' + confHash,
      revTok = crypto.randomBytes(18).toString('hex'),
      revHash = sha(revTok),
      revLink = '/email-edit/revert/' + revHash,
      revKey = 'email_change_rev_' + revHash;

  var email1 = opts.user.email,
      name = opts.user.name;

  var conf = {
    name: name,
    email1: email1,
    email2: email2,
    token: confTok,
    hash: confHash
  };

  var rev = {
    name: name,
    email1: email1,
    email2: email2,
    token: revTok,
    hash: revHash,
    confHash: confHash
  };

  var n = 2;

  request.server.app.cache.set(revKey, rev, 0, cb);
  request.server.app.cache.set(confKey, conf, 0, cb);

  function cb (er) {
    if (er) {
      showError(request, reply, 'Could not set value to the cache', 500, er);
    } else if (--n == 0) {
      sendEmails(conf, rev, request, reply);
    }
  }
}

function sendEmails (conf, rev, request, reply) {
  var opts = {
    user: request.auth.credentials,
    hiring: request.server.methods.hiring.getRandomWhosHiring()
  };

  var name = conf.name,
      urlStart = request.server.info.uri + '/email-edit/',
      confUrl = urlStart + 'confirm/' + encodeURIComponent(conf.token),
      revUrl = urlStart + 'revert/' + encodeURIComponent(rev.token);

  // we need to move the construction of these emails to somewhere else... but where?
  var confMail = {
    to: '"' + name + '" <' + conf.email2 + '>',
    from: from,
    subject: 'npm Email Confirmation',
    headers: { 'X-SMTPAPI': { category: 'email-change-confirm' } },
    text: 'You are receiving this because you have (or someone else has) '
        + 'requested that the email address of the \''
        + name
        + '\' npm user account be changed from\r\n'
        + '    <' + conf.email1 + '>\r\n'
        + 'to:\r\n'
        + '    <' + conf.email2 + '>\r\n\r\n'
        + 'Please click the following link, or paste into your browser '
        + 'to complete the process.\r\n\r\n'
        + '    ' + confUrl + '\r\n\r\n'
        + 'If you received this in error, you can safely ignore it.\r\n\r\n'
        + 'The request will expire shortly.\r\n\r\n'
        + 'You can reply to this message, or email\r\n'
        + '    ' + from + '\r\n'
        + 'if you have any questions.\r\n\r\n'
        + 'npm loves you.\r\n'
  };

  var revMail = {
    to: '"' + name + '" <' + rev.email1 + '>',
    from: from,
    subject: 'npm Email Change Alert',
    headers: { 'X-SMTPAPI': { category: 'email-change-revert' } },
    text: 'You are receiving this because you have (or someone else has) '
        + 'requested that the email address of the \''
        + name
        + '\' npm user account be changed from\r\n'
        + '    <' + rev.email1 + '>\r\n'
        + 'to:\r\n'
        + '    <' + rev.email2 + '>\r\n\r\n'
        + '\r\n'
        + 'If this was intentional, you can safely ignore this message.  '
        + 'However, a confirmation email was sent to <' + rev.email2 + '> '
        + 'with a link that must be clicked '
        + 'to complete the process.\r\n\r\n'
        + 'IMPORTANT: If this was NOT intentional, then your account '
        + 'MAY have been compromised.  Please click the following link '
        + 'to revert the change immediately:\r\n'
        + '    ' + revUrl + '\r\n\r\n'
        + 'And then visit ' + request.server.info.uri + '/ and change your '
        + 'password right away.\r\n\r\n'
        + 'You can reply to this message, or email\r\n'
        + '    ' + from + '\r\n'
        + 'if you have any questions.\r\n\r\n'
        + 'npm loves you.\r\n'
  };

  if (devMode) {
    timer.end = Date.now();
    metrics.addPageLatencyMetric(timer, 'email-edit-send-emails');

    metrics.addMetric({ name: 'email-edit-send-emails' });
    return reply({confirm: confMail, revert: revMail});
  }

  // don't send the confmail until we know the revert mail was sent!
  mailer.sendMail(revMail, function (er, result) {
    if (er) {
      return showError(request, reply, 'Unable to send revert email', 500, er);
    }

    mailer.sendMail(confMail, function (er, result) {
      if (er) {
        return showError(request, reply, 'Unable to send confirmation email', 500, er);
      }

      opts.submitted = true;
      timer.end = Date.now();
      metrics.addPageLatencyMetric(timer, 'email-edit-send-emails');

      metrics.addMetric({ name: 'email-edit-send-emails' });
      return reply.view('email-edit', opts);
    });
  });
}

function confirm (request, reply) {
  var methods = request.server.methods;

  var opts = {
        user: request.auth.credentials,
        hiring: methods.hiring.getRandomWhosHiring()
      },
      cache = request.server.app.cache;

  var token = request.params.token.split('/')[1],
      confHash = sha(token),
      confKey = 'email_change_conf_' + confHash,
      timer = {};

  cache.get(confKey, function (er, cached) {
    if (er) {
      return showError(request, reply, 'Error getting token from Redis', 500, confKey);
    }

    if (!cached) {
      return showError(request, reply, 'Token not found, or invalid', 404, confKey);
    }

    var name = cached.item.name;
    if (name !== opts.user.name) {
      return showError(request, reply, 'This request was for someone else', 403, {changeEmailFor: name, loggedInAs: opts.user.name});
    }

    var email1 = cached.item.email1,
        email2 = cached.item.email2,
        confTok = cached.item.token,
        hash = cached.item.hash;

    if (hash !== confHash) {
      return showError(request, reply, 'Math is broken, sorry', 500, {hash: hash, confHash: confHash});
    }

    cache.drop(confKey, function (err) {
      if (err) {
        return showError(request, reply, 'Unable to drop key ' + confKey, 500, err);
      }

      methods.user.changeEmail(opts.user.name, email2, function (er) {
        if (er) {
          return showError(request, reply, 'Unable to change email for ' + opts.user.name + ' to ' + email2, 500, er);
        }

        timer.end = Date.now();
        metrics.addPageLatencyMetric(timer, 'confirmEmailChange');

        metrics.addMetric({ name: 'confirmEmailChange' });
        opts.confirmed = true;
        return reply.view('email-edit-confirmation', opts);
      });
    });
  });
}

function revert (request, reply) {
  var methods = request.server.methods;

  var opts = {
        user: request.auth.credentials,
        hiring: methods.hiring.getRandomWhosHiring()
      },
      cache = request.server.app.cache;

  var token = request.params.token.split('/')[1],
      revHash = sha(token),
      revKey = 'email_change_rev_' + revHash,
      timer = {};

  cache.get(revKey, function (er, cached) {
    if (er) {
      return showError(request, reply, 'Error getting token from Redis', 500, revKey);
    }

    if (!cached) {
      return showError(request, reply, 'Token not found, or invalid', 404, revKey);
    }

    var name = cached.item.name;
    if (name !== opts.user.name) {
      return showError(request, reply, 'This request was for someone else', 403, {changeEmailFor: name, loggedInAs: opts.user.name});
    }

    var email1 = cached.item.email1,
        email2 = cached.item.email2,
        confHash = cached.item.confHash,
        confKey = 'email_change_conf_' + confHash,
        hash = cached.item.hash;

    if (hash !== revHash) {
      return showError(request, reply, 'Math is broken, sorry', 500, {hash: hash, confHash: confHash});
    }

    cache.drop(confKey, function (err) {
      if (err) {
        return showError(request, reply, 'Unable to drop key ' + confKey, 500, err);
      }

      cache.drop(revKey, function (err) {
        if (err) {
          return showError(request, reply, 'Unable to drop key ' + revKey, 500, err);
        }

        methods.user.changeEmail(opts.user.name, email1, function (er) {
          if (er) {
            return showError(request, reply, 'Unable to change email for ' + opts.user.name + ' to ' + email1, 500, er);
          }

          timer.end = Date.now();
          metrics.addPageLatencyMetric(timer, 'revertEmailChange');

          metrics.addMetric({ name: 'revertEmailChange' });

          return reply.view('email-edit-confirmation', opts);
        });
      });
    });
  });
}

function sha (s) {
  return crypto.createHash("sha1").update(s).digest("hex")
}

function pbkdf2 (pass, salt, iterations) {
  return crypto.pbkdf2Sync(pass, salt, iterations, 20).toString('hex')
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
    case 403: error = Hapi.error.forbidden(message); break;
    case 404: error = Hapi.error.notFound(message); break;
    default: error = Hapi.error.internal(message); break;
  }

  log.error(errId + ' ' + error, logExtras);

  return reply.view('error', opts).code(code || 500);
}