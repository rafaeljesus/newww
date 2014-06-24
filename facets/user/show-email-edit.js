var Hapi = require('hapi'),
    userValidate = require('npm-user-validate'),
    crypto = require('crypto');

var from, devMode;

module.exports = function (options) {
  return function (request, reply) {

    var opts = {
      user: request.auth.credentials
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
        opts.error = Hapi.error.notFound('Not implemented');
        return reply.view('error', opts).code(404);
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
          default: return reply.view('error', '404 - Not Found').code(404);
        }
      } else {
        return reply.view('email-edit', opts);
      }
    }

    if (request.method === 'post' || request.method === 'put') {
      var data = request.payload,
          email2 = data.email;

      if (!email2 || userValidate.email(email2)) {
        opts.error = 'Must provide a valid email address';
        return reply.view('email-edit', opts).code(400);
      }

      var salt = opts.user.salt,
          pwHash = opts.user.password_sha ? sha(data.password + salt) :
                   pbkdf2(data.password, salt, parseInt(opts.user.iterations, 10)),
          profHash = opts.user.password_sha || opts.user.derived_key;

      if (pwHash !== profHash) {
        opts.error = 'Invalid password';
        return reply.view('email-edit', opts).code(403);
      }
      return handle(request, reply, email2);
    }
  };
};

// ======== functions ======

function handle (request, reply, email2) {
  var opts = {
    user: request.auth.credentials
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
      opts.error = [er];
      request.reply('error', opts).code(500);
    } else if (--n == 0) {
      sendEmails(conf, rev, request, reply);
    }
  }
}

function sendEmails (conf, rev, request, reply) {
  var opts = {
    user: request.auth.credentials
  };

  var name = conf.name,
      urlStart = request.server.info.uri + '/email-edit/',
      confUrl = urlStart + 'confirm/' + encodeURIComponent(conf.token),
      revUrl = urlStart + 'revert/' + encodeURIComponent(rev.token);

  var confMail = {
    to: '"' + name + '" <' + conf.email2 + '>',
    from: 'user-account-bot@npmjs.org',
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
    from: 'user-account-bot@npmjs.org',
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
    return reply({confirm: confMail, revert: revMail});
  }

  // don't send the confmail until we know the revert mail was sent!
  mailer.sendMail(revMail, function (er, result) {
    if (er) {
      opts.error = [er];
      return reply.view('error', opts).code(500);
    }

    mailer.sendMail(confMail, function (er, result) {
      if (er) {
        opts.error = [er];
        return reply.view('error', opts).code(500);
      }

      opts.submitted = true;
      return reply.view('email-edit', opts);
    });
  });
}

function confirm (request, reply) {
  var opts = { user: request.auth.credentials },
      cache = request.server.app.cache;

  var token = request.params.token.split('/')[1],
      confHash = sha(token),
      confKey = 'email_change_conf_' + confHash;

  cache.get(confKey, function (er, cached) {
    if (er) {
      opts.error = [Hapi.error.internal('Error getting token from Redis')];
      return reply.view('error', opts).code(500);
    }

    if (!cached) {
      opts.error = [Hapi.error.notFound('Token not found, or invalid')];
      return reply.view('error', opts).code(404);
    }

    var name = cached.item.name;
    if (name !== opts.user.name) {
      opts.error = [Hapi.error.forbidden('This request was for someone else')];
      return reply.view('error', opts).code(403);
    }

    var email1 = cached.item.email1,
        email2 = cached.item.email2,
        confTok = cached.item.token,
        hash = cached.item.hash;

    if (hash !== confHash) {
      opts.error = [Hapi.error.internal('Math is broken, sorry')];
      return reply.view('error', opts).code(500);
    }

    cache.drop(confKey, function (err) {
      if (err) {
        opts.error = err;
        return reply.view('error', opts).code(500);
      }

      request.server.methods.changeEmail(opts.user.name, email2, function (er) {
        if (er) {
          opts.error = er;
          reply.view('error', opts).code(404);
        }

        opts.confirmed = true;
        return reply.view('email-edit-confirmation', opts);
      });
    });
  });
}

function revert (request, reply) {
  var opts = { user: request.auth.credentials },
      cache = request.server.app.cache;

  var token = request.params.token.split('/')[1],
      revHash = sha(token),
      revKey = 'email_change_rev_' + revHash;

  cache.get(revKey, function (er, cached) {
    if (er) {
      opts.error = [Hapi.error.internal('Error getting token from Redis')];
      return reply.view('error', opts).code(500);
    }

    if (!cached) {
      opts.error = [Hapi.error.notFound('Token not found, or invalid')];
      return reply.view('error', opts).code(404);
    }

    var name = cached.item.name;
    if (name !== opts.user.name) {
      opts.error = [Hapi.error.forbidden('This request was for someone else')];
      return reply.view('error', opts).code(403);
    }

    var email1 = cached.item.email1,
        email2 = cached.item.email2,
        confHash = cached.item.confHash,
        confKey = 'email_change_conf_' + confHash,
        hash = cached.item.hash;

    if (hash !== revHash) {
      opts.error = [Hapi.error.internal('Math is broken, sorry')];
      return reply.view('error', opts).code(500);
    }

    cache.drop(confKey, function (err) {
      if (err) {
        opts.error = err;
        return reply.view('error', opts).code(500);
      }

      cache.drop(revKey, function (err) {
        if (err) {
          opts.error = err;
          return reply.view('error', opts).code(500);
        }

        request.server.methods.changeEmail(opts.user.name, email1, function (er) {
          if (er) {
            opts.error = er;
            reply.view('error', opts).code(404);
          }

          return reply.view('email-edit-confirmation', opts);
        });
      });
    });
  });
}

function setEmail (request, reply) {
  var opts = { user: request.auth.credentials };

  var name = opts.user.name;
}

function sha (s) {
  return crypto.createHash("sha1").update(s).digest("hex")
}

function pbkdf2 (pass, salt, iterations) {
  return crypto.pbkdf2Sync(pass, salt, iterations, 20).toString('hex')
}
