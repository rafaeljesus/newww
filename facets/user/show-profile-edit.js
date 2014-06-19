var transform = require('./presenters/profile').transform,
    murmurhash = require('murmurhash')

module.exports = function (options) {
  return function (request, reply) {
    var saveProfile = request.server.methods.saveProfile,
        setSession = request.server.methods.setSession(request);

    var opts = {
    // whoshiring: somethingsomething,
      user: transform(request.auth.credentials, options)
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
              return reply.view('error', err);
            }
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