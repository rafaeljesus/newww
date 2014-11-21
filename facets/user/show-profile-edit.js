var transform = require('./presenters/profile').transform,
    Hapi = require('hapi'),
    Joi = require('joi'),
    log = require('bole')('user-profile-edit'),
    uuid = require('node-uuid'),
    merge = require('lodash').merge,
    metrics = require('newww-metrics')();

module.exports = function (options) {
  return function (request, reply) {
    var saveProfile = request.server.methods.user.saveProfile,
        setSession = request.server.methods.user.setSession(request),
        showError = request.server.methods.errors.showError(reply),
        addMetric = metrics.addMetric,
        addLatencyMetric = metrics.addPageLatencyMetric,
        timer = { start: Date.now() };

    var opts = {
      user: transform(request.auth.credentials, options),

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

        opts.user = transform(opts.user, options);

        saveProfile(opts.user, function (err, data) {
          if (err) {
            return new Error('ruh roh, something went wrong')
          }

          setSession(opts.user, function (err) {
            if (err) {
              return showError(err, 500, 'Unable to set the session for user ' + opts.user.name, opts);
            }

            timer.end = Date.now();
            addLatencyMetric(timer, 'saveProfile');

            addMetric({ name: 'saveProfile' });
            return reply.redirect('/profile');
          });

        });
      });
    }

    if (request.method === 'head' || request.method === 'get' || opts.error) {
      timer.end = Date.now();
      addLatencyMetric(timer, 'profile-edit');

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
