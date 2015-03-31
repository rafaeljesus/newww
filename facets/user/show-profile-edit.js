var UserModel = require('../../models/user'),
    presenter = require('../../presenters/user'),
    Joi = require('joi'),
    merge = require('lodash').merge;

module.exports = function (request, reply) {
  var loggedInUser = request.loggedInUser;
  var User = UserModel.new(request);

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

      User.get(loggedInUser.name, function (err, user) {

        if (err) {
          request.logger.error('unable to get user ' + loggedInUser.name);
          request.logger.error(err);
          return reply.view('errors/user-not-found', opts).code(404);
        }

        merge(user.resource, userChanges);
        user = presenter(user);

        User.save(user, function (err, data) {
          if (err) {
            request.logger.warn('unable to save profile; user=' + user.name);
            request.logger.warn(err);
            return reply.view('errors/internal', opts).code(500);
          }

          User.drop(user.name, function (err) {
            if (err) {
              request.logger.warn('unable to drop cache for user ' + user.name);
              request.logger.warn(err);
            }

            request.timing.page = 'saveProfile';
            request.metrics.metric({ name: 'saveProfile' });
            return reply.redirect('/profile');
          });
        });
      });
    });
  }

  if (request.method === 'get') {
    request.timing.page = 'profile-edit';
    opts.title = 'Edit Profile';
    opts.showEmailSentNotice = request.query['verification-email-sent'] === 'true';
    opts.showWelcomeMessage = request.query['new-user'] === 'true';
    return reply.view('user/profile-edit', opts);
  }
};
