var present = require(__dirname + '/../../presenters/user'),
  merge = require("lodash").merge,
  Hapi = require('hapi'),
  log = require('bole')('user-profile'),
  uuid = require('node-uuid'),
  metrics = require('newww-metrics')();

module.exports = function(options) {
  return function(request, reply) {
    var getUser = request.server.methods.user.getUser,
      getBrowseData = request.server.methods.registry.getBrowseData,
      showError = request.server.methods.errors.showError(reply),
      addMetric = metrics.addMetric,
      addLatencyMetric = metrics.addPageLatencyMetric,
      timer = {
        start: Date.now()
      };

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
        opts.errId = uuid.v1();
        log.error(opts.errId + Hapi.error.notFound('Profile for ' + profileName + ' not found'), err);
        opts.name = profileName;
        timer.end = Date.now();
        addLatencyMetric(timer, 'profile-not-found');
        addMetric({
          name: 'profile-not-found',
          value: opts.name
        });
        return reply.view('user/profile-not-found', opts).code(404);
      }

      getBrowseData('userstar', profileName, 0, 1000, function(err, starred) {
        if (err) {
          return showError(err, 500, 'Unable to get stars for user ' + profileName, opts);
        }

        getBrowseData('author', profileName, 0, 1000, function(err, packages) {
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

          timer.end = Date.now();
          addLatencyMetric(timer, 'showProfile');
          addMetric({
            name: 'showProfile'
          });

          // Return raw context object if `json` query param is present
          if ('json' in request.query) {
            return reply(opts);
          }

          return reply.view('user/profile', opts)
        });
      });
    }
  }
}
