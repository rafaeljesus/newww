var Hapi = require('hapi'),
    crypto = require('crypto'),
    userValidate = require('npm-user-validate'),
    log = require('bole')('user-password'),
    uuid = require('node-uuid');

module.exports = function (request, reply) {
  var opts = {
    user: request.auth.credentials,
    hiring: request.server.methods.getRandomWhosHiring()
  };

  var changePass = request.server.methods.changePass,
      loginUser = request.server.methods.loginUser,
      setSession = request.server.methods.setSession(request);

  if (request.method === 'get' || request.method === 'head') {
    return reply.view('password', opts);
  }

  if (request.method === 'post') {
    var data = request.payload;

    var prof = opts.user,
        salt = prof.salt,
        hashCurrent = prof.password_sha ? sha(data.current + salt) :
                        pbkdf2(data.current, salt, parseInt(prof.iterations, 10)),
        hashProf = prof.password_sha || prof.derived_key;

    if (hashCurrent !== hashProf) {
      opts.error = 'Invalid current password';
      return reply.view('password', opts).code(403);
    }

    if (data.new !== data.verify) {
      opts.error = 'Failed to verify password';
      return reply.view('password', opts).code(403);
    }

    var error = userValidate.pw(data.new);
    if (error) {
      opts.error = error.message;
      return reply.view('password', opts).code(400);
    }

    log.warn('Changing password', { name: prof.name });

    var newAuth = { name: prof.name, password: data.new };
    newAuth.mustChangePass = false;

    changePass(newAuth, function (er, data) {
      if (er) {
        return showError(request, reply, 'Failed to set the password for ' + newAuth.name, er);
      }

      loginUser(newAuth, function (er, user) {
        if (er) {
          return showError(request, reply, 'Unable to login user', er);
        }

        setSession(user, function (err) {
          if (err) {
            return showError(request, reply, 'Unable to set session for ' + user.name, err);
          }

          return reply.redirect('/profile');
        });
      });

    });

  }
}


// ======== functions =======

function pbkdf2 (pass, salt, iterations) {
  return crypto.pbkdf2Sync(pass, salt, iterations, 20).toString('hex')
}

function sha (s) {
  return crypto.createHash("sha1").update(s).digest("hex")
}

function showError (request, reply, message, logExtras) {
  var errId = uuid.v1();

  var opts = {
    user: request.auth.credentials,
    errId: errId,
    code: 500,
    hiring: request.server.methods.getRandomWhosHiring()
  };

  log.error(errId + ' ' + Hapi.error.internal(message), logExtras);

  return reply.view('error', opts).code(500);
}