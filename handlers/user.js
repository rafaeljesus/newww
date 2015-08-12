var User = require('../models/user'),
  Joi = require('joi'),
  presenter = require('../presenters/user'),
  userValidate = require('npm-user-validate'),
  merge = require('lodash').merge;


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

var signupSchema = Joi.object().keys({
  name: Joi.string().required(),
  password: Joi.string().required(),
  verify: Joi.string().required(),
  email: Joi.string().email().required(),
  resource: Joi.object().keys({
    npmweekly: Joi.string(),
    dripcampaigns: Joi.string().default('on')
  })
});

exports.handleSignup = function signup(request, reply) {
  var setSession = request.server.methods.user.setSession(request),
    delSession = request.server.methods.user.delSession(request),
    sendEmail = request.server.methods.email.send;

  var joiOptions = {
    convert: false,
    abortEarly: false
  };

  var data = request.payload;
  var UserModel = User.new(request);

  Joi.validate(data, signupSchema, joiOptions, function(err, validatedUser) {
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

    UserModel.get(validatedUser.name, function(err, userExists) {
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

        UserModel.signup(validatedUser, function(er, user) {
          if (er) {
            request.logger.warn('Failed to create account.');
            return reply.view('errors/internal', opts).code(403);
          }

          request.logger.info('created new user ' + user.name);

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
  var UserModel = User.new(request);

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

    UserModel.get(loggedInUser.name, function(err, user) {

      if (err) {
        request.logger.error('unable to get user ' + loggedInUser.name);
        request.logger.error(err);
        return reply.view('errors/user-not-found', opts).code(404);
      }

      merge(user.resource, userChanges);
      user = presenter(user);

      UserModel.save(user, function(err, data) {
        if (err) {
          request.logger.warn('unable to save profile; user=' + user.name);
          request.logger.warn(err);
          return reply.view('errors/internal', opts).code(500);
        }

        UserModel.dropCache(user.name, function() {

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
