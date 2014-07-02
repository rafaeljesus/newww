var transform = require('./presenters/profile').transform,
    murmurhash = require('murmurhash'),
    Hapi = require('hapi'),
    log = require('bole')('user-profile-edit'),
    uuid = require('node-uuid');

module.exports = function (options) {
  return function (request, reply) {
    var saveProfile = request.server.methods.saveProfile,
        setSession = request.server.methods.setSession(request),
        addMetric = request.server.methods.addMetric;

    var opts = {
      user: transform(request.auth.credentials, options),
      hiring: request.server.methods.getRandomWhosHiring()
    }

    if (request.method === 'post' || request.method === 'put') {

      if (!request.payload.name) {
        opts.error = 'Name is required';
      } else {

        opts.user = applyChanges(opts.user, request.payload);
        opts.user = transform(opts.user, options);

        var timer = { start: Date.now() };
        saveProfile(opts.user, function (err, data) {
          timer.end = Date.now();
          addMetric({
            name: 'latency',
            value: timer.end - timer.start,
            type: 'couchdb',
            action: 'saveProfile'
          });

          if (err) {
            return new Error('ruh roh, something went wrong')
          }

          timer.start = Date.now();
          setSession(opts.user, function (err) {
            timer.end = Date.now();
            addMetric({
              name: 'latency',
              value: timer.end - timer.start,
              type: 'redis',
              action: 'setSession'
            });

            if (err) {
              opts.errId = uuid.v1();
              log.error(opts.errId + ' ' + Hapi.error.internal('Unable to set the session for user ' + opts.user.name), err);

              return reply.view('error', opts);
            }

            addMetric({ name: 'saveProfile' });
            return reply.redirect('/profile');
          });

        });
      }
    }

    if (request.method === 'head' || request.method === 'get' || opts.error) {
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