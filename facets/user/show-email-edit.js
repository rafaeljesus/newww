
var userValidate = require('npm-user-validate'),
    nodemailer = require('nodemailer'),
    crypto = require('crypto');

var transport, mailer;

var from, host, devMode;

module.exports = function (options) {
  return function (request, reply) {

    var opts = { };

    from = options.emailFrom;
    host = options.canonicalHost;

    // if there's no email configuration set up, then we can't do this.
    // however, in dev mode, just show the would-be email right on the screen
    if (process.env.NODE_ENV === 'dev') {
      devMode = true;
    } else {
      transport = require(options.mailTransportModule);
      mailer = nodemailer.createTransport( transport(options.mailTransportSettings) );
    }

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

  var confTok = crypto.randomBytes(18).toString('hex'),
      confHash = sha(confTok),
      confKey = 'email_change_conf_' + confHash,
      revTok = crypto.randomBytes(18).toString('hex'),
      revHash = sha(revTok),
      revKey = 'email_change_rev_' + revHash;

  var email1 = request.auth.credentials.email,
      name = request.auth.credentials.name;

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

  request.server.app.cache.set(revKey, rev, 0, function (err) {

    if (err) {
      request.logger.error('Could not set the revKey to the cache: ', revKey);
      request.logger.error(err);
      reply.view('errors/internal', opts).code(500);
      return;
    }

    request.server.app.cache.set(confKey, conf, 0, function (er) {
      if (er) {
        request.logger.error('Could not set the confKey to the cache: ', confKey);
        request.logger.error(err);
        reply.view('errors/internal', opts).code(500);
        return;
      }

      return sendEmails(conf, rev, request, reply);
    });
  });
}

function sendEmails (conf, rev, request, reply) {
  var opts = { };

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
    request.timing.page = 'email-edit-send-emails';
    opts.confirm = JSON.stringify(confMail);
    opts.revert = JSON.stringify(revMail);
    opts.submitted = true;

    request.metrics.metric({ name: 'email-edit-send-emails' });
    return reply.view('user/email-edit', opts);
  }

  // don't send the confmail until we know the revert mail was sent!
  mailer.sendMail(revMail, function (er) {

    if (er) {
      request.logger.error('Unable to send revert email to ' + revMail.to);
      request.logger.error(er);
      reply.view('errors/internal', opts).code(500);
      return;
    }

    mailer.sendMail(confMail, function (er) {

      if (er) {
        request.logger.error('Unable to send confirmation email to ' + confMail.to);
        request.logger.error(er);
        reply.view('errors/internal', opts).code(500);
        return;
      }

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

  cache.get(confKey, function (er, cached) {

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

    var name = cached.item.name;
    if (name !== user.name) {
      request.logger.error(user.name + ' attempted to change email for ' + name);
      // TODO we should really bubble this one up to the user!
      reply.view('errors/internal', opts).code(500);
      return;
    }

    var email2 = cached.item.email2,
        hash = cached.item.hash;

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

  cache.get(revKey, function (er, cached) {

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

    var name = cached.item.name;
    if (name !== user.name) {
      request.logger.error(user.name + ' attempted to revert email for ' + name);
      // TODO we should really bubble this one up to the user!
      reply.view('errors/internal', opts).code(500);
      return;
    }

    var email1 = cached.item.email1,
        confHash = cached.item.confHash,
        confKey = 'email_change_conf_' + confHash,
        hash = cached.item.hash;

    if (hash !== revHash) {
      request.logger.error('these should be equal: hash=' + hash + '; revHash: ' + revHash);
      reply.view('errors/internal', opts).code(500);
      return;
    }

    cache.drop(confKey, function (err) {

      if (err) {
        request.logger.warn('Unable to drop key ' + confKey);
      }

      cache.drop(revKey, function (err) {

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
