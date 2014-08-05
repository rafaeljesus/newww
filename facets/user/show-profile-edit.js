var transform = require('./presenters/profile').transform,
    murmurhash = require('murmurhash'),
    Hapi = require('hapi'),
    log = require('bole')('user-profile-edit'),
    uuid = require('node-uuid'),
    metrics = require('../../adapters/metrics')();

module.exports = function (options) {
  return function (request, reply) {
    var saveProfile = request.server.methods.user.saveProfile,
        setSession = request.server.methods.user.setSession(request),
        addMetric = metrics.addMetric,
        addLatencyMetric = metrics.addPageLatencyMetric,
        timer = { start: Date.now() };

    var opts = {
      user: transform(request.auth.credentials, options),
      hiring: request.server.methods.hiring.getRandomWhosHiring()
    }

    if (request.method === 'post' || request.method === 'put') {

      if (!request.payload.name) {
        opts.error = 'Name is required';
      } else {

        opts.user = applyChanges(opts.user, request.payload);
        opts.user = transform(opts.user, options);

        saveProfile(opts.user, function (err, data) {
          if (err) {
            return new Error('ruh roh, something went wrong')
          }

          setSession(opts.user, function (err) {
            if (err) {
              opts.errId = uuid.v1();
              log.error(opts.errId + ' ' + Hapi.error.internal('Unable to set the session for user ' + opts.user.name), err);

              return reply.view('error', opts);
            }

            timer.end = Date.now();
            addLatencyMetric(timer, 'saveProfile');

            addMetric({ name: 'saveProfile' });
            return reply.redirect('/profile');
          });

        });
      }
    }

    if (request.method === 'head' || request.method === 'get' || opts.error) {
      timer.end = Date.now();
      addLatencyMetric(timer, 'profile-edit');

      opts.title = 'Edit Profile';
      return reply.view('profile-edit', opts);
    }
  }
}

function applyChanges (user, profileChanges) {
  for (var i in profileChanges) {
    user[i] = profileChanges[i];
  }
  return user;
}