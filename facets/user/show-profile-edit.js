var presenter = require('../../presenters/user'),
    Hapi = require('hapi'),
    Joi = require('joi'),
    merge = require('lodash').merge;

module.exports = function (options) {
  return function (request, reply) {
    var saveProfile = request.server.methods.user.saveProfile,
        setSession = request.server.methods.user.setSession(request);

    var opts = {
      user: presenter(request.auth.credentials),

      namespace: 'user-profile-edit'
    }

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

        merge(opts.user, userChanges);

        opts.user = presenter(opts.user);

        saveProfile(opts.user, function (err, data) {
          if (err) {
            request.logger.warn(err);
            request.logger.warn('unable to save profile; user=' + opts.user.name);
            return reply.view('errors/internal', opts).code(500);
          }

          setSession(opts.user, function (err) {
            if (err) {
              // TODO this is an error with our cache. Does the user really need to see it?
              request.logger.warn('unable to set session; user=' + opts.user.name);
              return reply.view('errors/internal', opts).code(500);
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
  }
}

function applyChanges (user, profileChanges) {
  for (var i in profileChanges) {
    user[i] = profileChanges[i];
  }
  return user;
}
