var Joi = require('joi'),
    userValidate = require('npm-user-validate'),
    murmurhash = require('murmurhash'),
    Hapi = require('hapi'),
    log = require('bole')('user-signup'),
    uuid = require('node-uuid');

module.exports = function signup (request, reply) {
  var signupUser = request.server.methods.signupUser,
      setSession = request.server.methods.setSession(request),
      delSession = request.server.methods.delSession(request);

  var opts = {
    user: request.auth.credentials,
    errors: []
  };

  if (request.method === 'post') {
    var schema = Joi.object().keys({
      name: Joi.string().required(),
      password: Joi.string().required(),
      verify: Joi.string().required(),
      email: Joi.string().email().required()
    });

    var joiOptions = {
      convert: false,
      abortEarly: false
    };

    var data = request.payload;

    Joi.validate(data, schema, joiOptions, function (err, value) {

      if (err) {
        opts.errors.push(err.details);
      }

      if (data.password !== data.verify) {
        opts.errors.push(new Error("Passwords don't match"));
      }

      userValidate.username(data.name) && opts.errors.push(userValidate.username(data.name));

      if (opts.errors.length) {
        return reply.view('signup-form', opts);
      }

      delSession(value, function (er) {
        if (er) {
          return showError(request, reply, 'Unable to set the session for user ' + opts.user.name, 500, er);
        }

        signupUser(value, function (er, user) {
          if (er) {
            return showError(request, reply, 'Failed to create account', 403, er);
          }

          setSession(user, function (err) {
            if (err) {
              return showError(request, reply, 'Unable to set the session for user ' + opts.user.name, 500, err);
            }

            return reply.redirect('/profile-edit');
          });
        });

      });
    });

  }


  if (request.method === 'get' || request.method === 'head') {
    // opts.hiring

    return reply.view('signup-form', opts);
  }
};

function showError (request, reply, message, code, logExtras) {
  var errId = uuid.v1();

  var opts = {
    user: request.auth.credentials,
    errId: errId,
    code: code || 500
  };

  var error;
  if (code === 403) {
    error = Hapi.error.forbidden(message);
  } else {
    error = Hapi.error.internal(message);
  }

  log.error(errId + ' ' + error, logExtras);

  return reply.view('error', opts).code(code || 500);
}