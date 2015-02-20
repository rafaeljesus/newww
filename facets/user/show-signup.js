var Joi = require('joi'),
    userValidate = require('npm-user-validate');

module.exports = function signup (request, reply) {
  var User = new request.server.models.User({logger: request.logger});
  var redis = request.server.app.cache._cache.connection.client;

  var setSession = request.server.methods.user.setSession(request),
      delSession = request.server.methods.user.delSession(request),
      sendEmail = request.server.methods.email.send;

  var opts = {
    errors: []
  };

  if (request.method === 'post') {
    var schema = Joi.object().keys({
      name: Joi.string().required(),
      password: Joi.string().required(),
      verify: Joi.string().required(),
      email: Joi.string().email().required(),
      npmweekly: Joi.string()
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

      User.get(validatedUser.name, function (err, userExists) {
        if (userExists) {
          opts.errors.push({message: new Error("username already exists").message});
        }

        if (opts.errors.length) {
          request.timing.page = 'signup-form-error';
          request.metrics.metric({name: 'signup-form-error'});

          // give back the user input so the form can be
          // partially re-populated
          opts.userInput = validatedUser;

          return reply.view('user/signup-form', opts).code(400);
        }

        delSession(validatedUser, function (er) {

          if (er) {
            request.logger.warn(er);
          }

          User.signup(validatedUser, function (er, user) {
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

              request.logger.info('created new user ' + user.name);

              sendEmail('confirm-user-email', user, redis)
                .then(function() {
                  request.logger.info('emailed new user at ' + user.email);
                  request.timing.page = 'signup';
                  request.metrics.metric({name: 'signup'});

                  return reply.redirect('/profile-edit');
                })
                .catch(function(er) {
                  var message = 'Unable to send email to ' + user.email;

                  request.logger.error(message);
                  request.logger.error(er);

                  // if we can't send the email, that shouldn't stop the user from
                  // completing the signup process - maybe we should just let
                  // them know?
                  opts.errors.push({ message: message + '. Please try again later.' });

                  request.timing.page = 'signup';
                  request.metrics.metric({name: 'signup'});

                  return reply.redirect('/profile-edit');
                });
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