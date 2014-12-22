var Joi = require('joi'),
    userValidate = require('npm-user-validate'),
    Hapi = require('hapi');

module.exports = function signup (request, reply) {
  var getUser = request.server.methods.user.getUser,
      signupUser = request.server.methods.user.signupUser,
      setSession = request.server.methods.user.setSession(request),
      delSession = request.server.methods.user.delSession(request);

  var opts = {
    user: request.auth.credentials,
    errors: [],

    namespace: 'user-signup'
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

    Joi.validate(data, schema, joiOptions, function (err, validatedUser) {

      if (err) {
        opts.errors = err.details;
      }

      if (validatedUser.password !== validatedUser.verify) {
        opts.errors.push({message: new Error("passwords don't match").message});
      }

      userValidate.username(validatedUser.name) && opts.errors.push({ message: userValidate.username(validatedUser.name).message});

      getUser(validatedUser.name, function (err, userExists) {
        if (userExists) {
          opts.errors.push({message: new Error("username already exists").message})
        }

        if (opts.errors.length) {

          request.timing.page = 'signup-form-error';
          request.metrics.metric({name: 'signup-form-error'});

          return reply.view('user/signup-form', opts).code(400);
        }

        delSession(validatedUser, function (er) {

          if (er) {
            request.logger.error(er);
          }

          signupUser(validatedUser, function (er, user) {

            if (er) {
              request.logger.warn('Failed to create account.');
              return reply.view('errors/internal', opts).code(403);
            }

            request.logger.info('created new user ' + user.name);

            setSession(user, function (err) {

              if (err) {
                request.logger.warn('Unable to set the session for new user ' + user.name);
                // TODO why show an error here?
                return reply.view('errors/internal', opts).code(500);
              }

              request.timing.page = 'signup';
              request.metrics.metric({name: 'signup'});

              return reply.redirect('/profile-edit');
            });
          });

        });
      });
    });

  }


  if (request.method === 'get' || request.method === 'head') {

    request.timing.page = 'signup-form';
    request.metrics.metric({ name: 'signup-form' });
    return reply.view('user/signup-form', opts);
  }
};
