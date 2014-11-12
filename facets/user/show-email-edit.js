var NAMESPACE = 'user-email-edit';

var Hapi = require('hapi'),
    userValidate = require('npm-user-validate'),
    nodemailer = require('nodemailer'),
    crypto = require('crypto'),
    log = require('bole')(NAMESPACE),
    uuid = require('node-uuid'),
    metrics = require('newww-metrics')();

var transport, mailer;

var from, host, devMode, timer = {};

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

    if (request.method === 'get' || request.method === 'head') {
      if (request.params && request.params.token) {
        var action_token = request.params.token.split('/');
        switch (request.params.token.split('/')[0]) {
          case 'revert': return revert(request, reply);
          case 'confirm': return confirm(request, reply);
          default: return showError(request.url.path, 404, 'Page not found', opts);
        }
      } else {
        timer.end = Date.now();
        metrics.addPageLatencyMetric(timer, 'email-edit');

        opts.title = 'Edit Profile';

        metrics.addMetric({ name: 'email-edit' });
        return reply.view('user/email-edit', opts);
      }
    }

    if (request.method === 'post' || request.method === 'put') {
      var data = request.payload,
          email2 = data.email;

      if (!email2 || userValidate.email(email2)) {
        opts.error = {email: true};

        timer.end = Date.now();
        metrics.addPageLatencyMetric(timer, 'email-edit-error');

        metrics.addMetric({ name: 'email-edit-error' });
        return reply.view('user/email-edit', opts).code(400);
      }

      var salt = opts.user.salt,
          pwHash = opts.user.password_sha ? sha(data.password + salt) :
                   pbkdf2(data.password, salt, parseInt(opts.user.iterations, 10)),
          profHash = opts.user.password_sha || opts.user.derived_key;

      if (pwHash !== profHash) {
        opts.error = {password: true};

        timer.end = Date.now();
        metrics.addPageLatencyMetric(timer, 'email-edit-error');

        metrics.addMetric({ name: 'email-edit-error' });
        return reply.view('user/email-edit', opts).code(403);
      }

      return handle(request, reply, email2);
    }
  };
};

// ======== functions ======

function handle (request, reply, email2) {
  var opts = {
    user: request.auth.credentials,

    namespace: NAMESPACE
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
      return showError(er, 500, 'Could not set value to the cache', opts);
    } else if (--n == 0) {
      sendEmails(conf, rev, request, reply);
    }
  }
}

function sendEmails (conf, rev, request, reply) {
  var opts = {
    user: request.auth.credentials,

    namespace: NAMESPACE
  };

  var name = conf.name,
      urlStart = host + '/email-edit/',
      confUrl = urlStart + 'confirm/' + encodeURIComponent(conf.token),
      revUrl = urlStart + 'revert/' + encodeURIComponent(rev.token);

  // we need to move the construction of these emails to somewhere else...
  // maybe we can consider https://github.com/andris9/nodemailer-html-to-text ?
  var confMail = {
    to: '"' + name + '" <' + conf.email2 + '>',
    from: from,
    subject: 'npm Email Confirmation',
    headers: { 'X-SMTPAPI': { category: 'email-change-confirm' } },
    text: require('./emailTemplates/confirmEmailChange')(name, conf, confUrl, from)
  };

  var revMail = {
    to: '"' + name + '" <' + rev.email1 + '>',
    from: from,
    subject: 'npm Email Change Alert',
    headers: { 'X-SMTPAPI': { category: 'email-change-revert' } },
    text: require('./emailTemplates/revertEmailChange')(rev, revUrl, from, host)
  };

  if (devMode) {
    timer.end = Date.now();
    metrics.addPageLatencyMetric(timer, 'email-edit-send-emails');
    opts.confirm = JSON.stringify(confMail);
    opts.revert = JSON.stringify(revMail);
    opts.submitted = true;

    metrics.addMetric({ name: 'email-edit-send-emails' });
    return reply.view('user/email-edit', opts);
  }

  // don't send the confmail until we know the revert mail was sent!
  mailer.sendMail(revMail, function (er, result) {
    if (er) {
      return showError(er, 500, 'Unable to send revert email', opts);
    }

    mailer.sendMail(confMail, function (er, result) {
      if (er) {
        return showError(er, 500, 'Unable to send confirmation email', opts);
      }

      opts.submitted = true;
      timer.end = Date.now();
      metrics.addPageLatencyMetric(timer, 'email-edit-send-emails');

      metrics.addMetric({ name: 'email-edit-send-emails' });
      return reply.view('user/email-edit', opts);
    });
  });
}

function confirm (request, reply) {
  var methods = request.server.methods,
      setSession = request.server.methods.user.setSession(request),
      showError = request.server.methods.errors.showError(reply);

  var opts = {
        user: request.auth.credentials,
        namespace: NAMESPACE
      },
      cache = request.server.app.cache;

  var token = request.params.token.split('/')[1],
      confHash = sha(token),
      confKey = 'email_change_conf_' + confHash,
      timer = {};

  cache.get(confKey, function (er, cached) {
    if (er) {
      return showError(confKey, 500, 'Error getting token from Redis', opts);
    }

    if (!cached) {
      return showError(confKey, 500, 'Token not found, or invalid', opts);
    }

    var name = cached.item.name;
    if (name !== opts.user.name) {
      return showError({changeEmailFor: name, loggedInAs: opts.user.name}, 500, 'This request was for someone else', opts);
    }

    var email1 = cached.item.email1,
        email2 = cached.item.email2,
        confTok = cached.item.token,
        hash = cached.item.hash;

    if (hash !== confHash) {
      return showError({hash: hash, confHash: confHash}, 500, 'Math is broken, sorry', opts);
    }

    cache.drop(confKey, function (err) {
      if (err) {
        return showError(err, 500, 'Unable to drop key ' + confKey, opts);
      }

      methods.user.changeEmail(opts.user.name, email2, function (er) {
        if (er) {
          return showError(er, 500, 'Unable to change email for ' + opts.user.name + ' to ' + email2, opts);
        }

        opts.user.email = email2;
        opts.confirmed = true;

        setSession(opts.user, function (err) {
          if (err) {
            return showError(err, 500, 'Unable to set the session for user ' + opts.user.name, opts);
          }

          methods.user.getUser.cache.drop(opts.user.name, function (er, resp) {
            if (er) {
              return showError(er, 500, 'Unable to drop profile for ' + opts.user.name, opts);
            }

            timer.end = Date.now();
            metrics.addPageLatencyMetric(timer, 'confirmEmailChange');

            metrics.addMetric({ name: 'confirmEmailChange' });

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
      setSession = request.server.methods.user.setSession(request),
      showError = request.server.methods.errors.showError(reply);

  var opts = {
        user: request.auth.credentials,
        namespace: NAMESPACE
      },
      cache = request.server.app.cache;

  var token = request.params.token.split('/')[1],
      revHash = sha(token),
      revKey = 'email_change_rev_' + revHash,
      timer = {};

  cache.get(revKey, function (er, cached) {
    if (er) {
      return showError(revKey, 500, 'Error getting token from Redis', opts);
    }

    if (!cached) {
      return showError(revKey, 500, 'Token not found, or invalid', opts);
    }

    var name = cached.item.name;
    if (name !== opts.user.name) {
      return showError({changeEmailFor: name, loggedInAs: opts.user.name}, 500, 'This request was for someone else', opts);
    }

    var email1 = cached.item.email1,
        email2 = cached.item.email2,
        confHash = cached.item.confHash,
        confKey = 'email_change_conf_' + confHash,
        hash = cached.item.hash;

    if (hash !== revHash) {
      return showError({hash: hash, confHash: confHash}, 500, 'Math is broken, sorry', opts);
    }

    cache.drop(confKey, function (err) {
      if (err) {
        return showError(err, 500, 'Unable to drop key ' + confKey, opts);
      }

      cache.drop(revKey, function (err) {
        if (err) {
          return showError(err, 500, 'Unable to drop key ' + revKey, opts);
        }

        methods.user.changeEmail(opts.user.name, email1, function (er) {
          if (er) {
            return showError(er, 500, 'Unable to change email for ' + opts.user.name + ' to ' + email1, opts);
          }

          opts.user.email = email1;

          setSession(opts.user, function (err) {
            if (err) {
              return showError(err, 500, 'Unable to set the session for user ' + opts.user.name, opts);
            }

            methods.user.getUser.cache.drop(opts.user.name, function (er, resp) {
              if (er) {
                return showError(er, 500, 'Unable to drop profile for ' + opts.user.name, opts);
              }

              timer.end = Date.now();
              metrics.addPageLatencyMetric(timer, 'revertEmailChange');

              metrics.addMetric({ name: 'revertEmailChange' });

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
  return crypto.createHash("sha1").update(s).digest("hex")
}

function pbkdf2 (pass, salt, iterations) {
  return crypto.pbkdf2Sync(pass, salt, iterations, 20).toString('hex')
}
