var presenter = require('../../presenters/user'),
    Joi = require('joi'),
    merge = require('lodash').merge;

module.exports = function (options) {
  return function (request, reply) {
    var setSession = request.server.methods.user.setSession(request);
    var loggedInUser = request.auth.credentials;
    var User = new request.server.models.User({bearer: loggedInUser && loggedInUser.name});

    var opts = { };

    if (request.method === 'post' || request.method === 'put') {

      var editableUserProperties = Joi.object().keys({
        fullname: Joi.string().allow(''),
        homepage: Joi.string().allow(''),
        github: Joi.string().allow(''),
        twitter: Joi.string().allow(''),
        freenode: Joi.string().allow('')
      });

      Joi.validate(request.payload, editableUserProperties, function (err, userChanges) {
        if (err) {
          opts.error = err;
          return reply.view('user/profile-edit', opts).code(400);
        }

        merge(loggedInUser, userChanges);

        loggedInUser = presenter(loggedInUser);

        User.save(loggedInUser, function (err, data) {
          if (err) {
            request.logger.warn('unable to save profile; user=' + loggedInUser.name);
            request.logger.warn(err);
            return reply.view('errors/internal', opts).code(500);
          }

          setSession(loggedInUser, function (err) {
            if (err) {
              request.logger.warn('unable to set session; user=' + opts.user.name);
              request.logger.warn(err);
            }

            request.timing.page = 'saveProfile';
            request.metrics.metric({ name: 'saveProfile' });
            return reply.redirect('/profile');
          });

        });
      });
    }

    if (request.method === 'head' || request.method === 'get' || opts.error) {
      request.timing.page = 'profile-edit';
      opts.title = 'Edit Profile';
      return reply.view('user/profile-edit', opts);
    }
  };
};