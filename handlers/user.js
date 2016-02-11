var UserAgent = require('../agents/user'),
  Joi = require('joi'),
  presenter = require('../presenters/user'),
  userValidate = require('npm-user-validate'),
  merge = require('lodash').merge,
  P = require('bluebird'),
  Scope = require('../agents/scope'),
  sendEmail = require('../adapters/send-email');

var feature = require('../lib/feature-flags');

exports.showSignup = function signup(request, reply) {

  var opts = {
    errors: []
  };

  request.timing.page = 'signup-form';
  request.metrics.metric({
    name: 'signup-form'
  });
  return reply.view('user/signup-form', opts);
};

exports.handleSignup = function signup(request, reply) {
  var setSession = request.server.methods.user.setSession(request),
    delSession = request.server.methods.user.delSession(request);

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
  var User = new UserAgent(request.loggedInUser);

  Joi.validate(data, schema, joiOptions, function(err, validatedUser) {
    var opts = {
      errors: []
    };

    if (err) {
      opts.errors = err.details;
    }

    if (validatedUser.password !== validatedUser.verify) {
      opts.errors.push({
        message: new Error("passwords don't match").message
      });
    }

    userValidate.username(validatedUser.name) && opts.errors.push({
      message: userValidate.username(validatedUser.name).message
    });

    Scope().get(validatedUser.name, function(err, userExists) {
      if (err && err.statusCode != 404) {
        request.logger.warn('Unable to get user to validate');
        return reply.view('errors/internal', opts).code(403);
      }
      if (userExists) {
        opts.errors.push({
          message: new Error("username already exists").message
        });
      }

      if (opts.errors.length) {
        request.timing.page = 'signup-form-error';
        request.metrics.metric({
          name: 'signup-form-error'
        });

        // give back the user input so the form can be
        // partially re-populated
        opts.userInput = validatedUser;

        return reply.view('user/signup-form', opts).code(400);
      }

      delSession(validatedUser, function(er) {

        if (er) {
          request.logger.warn(er);
        }

        User.signup(validatedUser, function(er, user) {
          if (er) {
            request.logger.warn('Failed to create account.');
            return reply.view('errors/internal', opts).code(403);
          }

          request.logger.info('created new user ' + user.name);

          var almostARequest = {
            auth: {
              credentials: {
                name: user.name
              }
            }
          };
          if (feature('bypass_email_verify', almostARequest)) {
            User.confirmEmail(user).then(function() {
              request.logger.info('Bypassed email verification');
            }).catch(function(err) {
              // This is for test purposes, don't let it block the main use cases.
              request.logger.error(err);
            });
          }

          setSession(user, function(err) {

            if (err) {
              request.logger.warn('Unable to set the session for new user ' + user.name);
              // TODO why show an error here?
              return reply.view('errors/internal', opts).code(500);
            }

            request.logger.info('created new user ' + user.name);

            sendEmail('confirm-user-email', user, request.redis)
              .then(function() {
                request.logger.info('emailed new user at ' + user.email);
                request.timing.page = 'signup';
                request.metrics.metric({
                  name: 'signup'
                });

                return reply.redirect('/profile-edit?new-user=true');
              })
              .catch(function(er) {
                var message = 'Unable to send email to ' + user.email;

                request.logger.error(message);
                request.logger.error(er);

                // if we can't send the email, that shouldn't stop the user from
                // completing the signup process - maybe we should just let
                // them know?
                opts.errors.push({
                  message: message + '. Please try again later.'
                });

                request.timing.page = 'signup';
                request.metrics.metric({
                  name: 'signup'
                });

                return reply.redirect('/profile-edit?new-user=true');
              });
          });
        });
      });
    });
  });
};


exports.handleProfileEdit = function(request, reply) {
  var loggedInUser = request.loggedInUser;
  var User = new UserAgent(loggedInUser);

  var opts = { };

  var editableUserProperties = Joi.object().keys({
    fullname: Joi.string().allow(''),
    homepage: Joi.string().allow(''),
    github: Joi.string().allow(''),
    twitter: Joi.string().allow(''),
    freenode: Joi.string().allow('')
  });

  Joi.validate(request.payload, editableUserProperties, function(err, userChanges) {
    if (err) {
      opts.error = err;
      return reply.view('user/profile-edit', opts).code(400);
    }

    User.get(loggedInUser.name, function(err, user) {

      if (err) {
        request.logger.error('unable to get user ' + loggedInUser.name);
        request.logger.error(err);
        return reply.view('errors/user-not-found', opts).code(404);
      }

      merge(user.resource, userChanges);
      user = presenter(user);

      User.save(user, function(err, data) {
        if (err) {
          request.logger.warn('unable to save profile; user=' + user.name);
          request.logger.warn(err);
          return reply.view('errors/internal', opts).code(500);
        }

        User.dropCache(user.name, function() {

          request.timing.page = 'saveProfile';
          request.metrics.metric({
            name: 'saveProfile'
          });
          return reply.redirect('/profile');
        });
      });
    });
  });
};


exports.showProfileEdit = function(request, reply) {
  request.timing.page = 'profile-edit';

  var opts = {
    title: 'Edit Profile',
    showEmailSentNotice: request.query['verification-email-sent'] === 'true',
    showWelcomeMessage: request.query['new-user'] === 'true'
  };

  return reply.view('user/profile-edit', opts);
};

exports.getCliTokens = function(request, reply) {
  var User = new UserAgent(request.loggedInUser);

  var opts = {};

  User.getCliTokens(request.loggedInUser.name)
    .then(function(tokens) {
      opts.tokens = tokens;
    })
    .catch(function(err) {
      request.logger.warn('unable to get cli tokens; user=' + request.loggedInUser.name);
      request.logger.warn(err);
      opts.tokens = [];
    })
    .finally(function() {
      return reply.view('user/tokens', opts);
    });
};

exports.handleCliToken = function(request, reply) {
  var User = new UserAgent(request.loggedInUser);

  if (request.params && request.params.token) {
    User.logoutCliToken(request.params.token)
      .then(function() {
        return reply.redirect('/settings/tokens');
      })
      .catch(function(err) {
        err = new Error("Unable to delete token " + request.params.token);
        return request.saveNotifications([
          P.reject(err),
        ]).then(function(errToken) {
          var url = '/settings/tokens';
          var param = errToken ? "?notice=" + errToken : "";

          url = url + param;
          return reply.redirect(url);
        }).catch(function(err) {
          request.logger.error(err);
          return reply.redirect('/settings/tokens');
        });
      });
  } else {
    return reply.redirect('/settings/tokens');
  }
};
