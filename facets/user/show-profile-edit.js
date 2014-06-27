var transform = require('./presenters/profile').transform,
    murmurhash = require('murmurhash')

module.exports = function (options) {
  return function (request, reply) {
    var saveProfile = request.server.methods.saveProfile;

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

          var sid = murmurhash.v3(opts.user.name, 55).toString(16);

          opts.user.sid = sid;


          request.server.app.cache.set(sid, opts.user, 0, function (err) {
            if (err) {
              console.log('error!', err)
              reply(err);
            }

            request.auth.session.set({sid: sid});

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