var transform = require('./presenters/profile').transform,
    Hapi = require('hapi'),
    log = require('bole')('user-profile'),
    uuid = require('node-uuid'),
    metrics = require('newww-metrics')();

module.exports = function (options) {
  return function (request, reply) {
    var getUser = request.server.methods.user.getUser,
        getBrowseData = request.server.methods.registry.getBrowseData,
        showError = request.server.methods.errors.showError(reply),
        addMetric = metrics.addMetric,
        addLatencyMetric = metrics.addPageLatencyMetric,
        timer = { start: Date.now() };

    var opts = {
      user: request.auth.credentials,
      hiring: request.server.methods.hiring.getRandomWhosHiring(),
      namespace: 'user-profile'
    };

    var profileName = request.params.name || opts.user.name;

    if (request.info.referrer.indexOf('profile-edit') !== -1) {
      getUser.cache.drop(profileName, function (er, resp) {
        if (er) {
          return showError(er, 500, 'Unable to drop key ' + profileName, opts);
        }
        return getUser(profileName, showProfile);
      });
    }

    return getUser(profileName, showProfile);

    function showProfile (err, showprofile) {
      if (err) {
        opts.errId = uuid.v1();
        log.error(opts.errId + Hapi.error.notFound('Profile for ' + profileName + ' not found'), err);

        opts.name = profileName;

        timer.end = Date.now();
        addLatencyMetric(timer, 'profile-not-found');

        addMetric({ name: 'profile-not-found', value: opts.name });
        return reply.view('user/profile-not-found', opts).code(404);
      }

      getBrowseData('userstar', profileName, 0, 1000, function (err, starred) {
        if (err) {
          return showError(err, 500, 'Unable to get stars for user ' + profileName, opts);
        }

        getBrowseData('author', profileName, 0, 1000, function (err, packages) {
          if (err) {
            return showError(err, 500, 'Unable to get modules by user ' + profileName, opts);
          }

          opts.profile = {
            title: showprofile.name,
            packages: getRandomAssortment(packages, 'packages', profileName),
            starred: getRandomAssortment(starred, 'starred', profileName),
            isSelf: opts.user && opts.user.name && profileName === opts.user.name
          }

          opts.title = showprofile.fullname ? showprofile.fullname : showprofile.name

          opts.profile.showprofile = transform(showprofile, options);
          opts.profile.fields = opts.profile.showprofile.fields;

          timer.end = Date.now();
          addLatencyMetric(timer, 'showProfile');

          addMetric({ name: 'showProfile' });

          // Return raw context object if `json` query param is present
          if (process.env.NODE_ENV === "dev" && 'json' in request.query) {
            return reply(opts);
          }

          return reply.view('user/profile', opts)
        });
      });
    }
  }
}

function getRandomAssortment (items, browseKeyword, name) {
  var l = items.length;
  var MAX_SHOW = 20;

  if (l > MAX_SHOW) {
    items = items.sort(function (a, b) {
      return Math.random() * 2 - 1
    }).slice(0, MAX_SHOW);
    items.push({
      url: '/browse/' + browseKeyword + '/' + name,
      name: 'and ' + (l - MAX_SHOW) + ' more',
      description: ''
    })
  }

  return items;
}
