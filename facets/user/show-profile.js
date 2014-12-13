var present = require(__dirname + '/../../presenters/user'),
  merge = require("lodash").merge,
  Hapi = require('hapi');

module.exports = function(options) {
  return function(request, reply) {
    var getUser = request.server.methods.user.getUser,
      getUserStars = request.server.methods.registry.getUserStars,
      getAuthors = request.server.methods.registry.getAuthors,
      showError = request.server.methods.errors.showError(reply);

    var opts = {
      user: request.auth.credentials,
      namespace: 'user-profile'
    };

    var profileName = request.params.name || opts.user.name;

    if (request.info.referrer.indexOf('profile-edit') !== -1) {
      return getUser.cache.drop(profileName, function(er, resp) {
        if (er) {
          return showError(er, 500, 'Unable to drop key ' + profileName, opts);
        }
        return getUser(profileName, showProfile);
      });
    }

    return getUser(profileName, showProfile);

    function showProfile(err, showprofile) {
      if (err) {
        request.logger.error(Hapi.error.notFound('Profile for ' + profileName + ' not found'), err);
        opts.name = profileName;
        request.timing.page = 'profile-not-found';
        request.metrics.metric({
          name: 'profile-not-found',
          value: opts.name
        });
        return reply.view('user/profile-not-found', opts).code(404);
      }

      getUserStars(profileName, 0, 1000, function(err, starred) {
        if (err) {
          return showError(err, 500, 'Unable to get stars for user ' + profileName, opts);
        }

        getAuthors(profileName, 0, 1000, function(err, packages) {
          if (err) {
            return showError(err, 500, 'Unable to get modules by user ' + profileName, opts);
          }

          opts.profile = {
            title: showprofile.name,
            packages: packages,
            starred: starred,
            isSelf: opts.user && opts.user.name && profileName === opts.user.name
          }
          opts.title = "@" + showprofile.name
          opts.profile = merge(opts.profile, showprofile)
          opts.profile = present(opts.profile)

          ;[
            '_id',
            '_rev',
            'fields',
            'fields',
            'roles',
            'type',
            'github',
            'twitter',
            'appdotnet',
            'homepage',
            'freenode'
          ].forEach(function(field) {
            delete opts.profile[field]
          })

          request.timing.page = 'showProfile';
          request.metrics.metric({
            name: 'showProfile'
          });

          return reply.view('user/profile', opts)
        });
      });
    }
  }
}
