var transform = require('./presenters/profile').transform,
    Hapi = require('hapi'),
    log = require('bole')('user-profile'),
    uuid = require('node-uuid');


module.exports = function (options) {
  return function (request, reply) {
    var getUserFromCouch = request.server.methods.getUserFromCouch,
        getBrowseData = request.server.methods.getBrowseData,
        addMetric = request.server.methods.addMetric;

    var opts = {
      user: request.auth.credentials,
      hiring: request.server.methods.getRandomWhosHiring()
    }, timer;

    var profileName = request.params.name || opts.user.name;

    if (request.info.referrer.indexOf('profile-edit') !== -1) {
      getUserFromCouch.cache.drop(profileName, function (er, resp) {
        if (er) {
          return showError(request, reply, 'Unable to drop key ' + profileName, er);
        }
        timer.start = Date.now();
        return getUserFromCouch(profileName, showProfile);
      });
    }

    timer.start = Date.now();
    return getUserFromCouch(profileName, showProfile);

    function showProfile (err, showprofile) {
      timer.end = Date.now();
      addMetric({
        name: 'latency',
        value: timer.end - timer.start,
        type: 'couchdb',
        action: 'showProfile'
      });

      if (err) {
        opts.errId = uuid.v1();
        log.error(opts.errId + Hapi.error.notFound('Profile for ' + profileName + ' not found'), err);

        opts.name = profileName;
        return reply.view('profile-not-found', opts).code(404);
      }

      timer.start = Date.now();
      getBrowseData('userstar', profileName, 0, 1000, function (err, starred) {
        timer.end = Date.now();
        addMetric({
          name: 'latency',
          value: timer.end - timer.start,
          type: 'couchdb',
          browse: ['userstar', profileName, 0, 1000].join(', ')
        });

        if (err) {
          return showError(request, reply, 'Unable to get stars for user ' + profileName, err);
        }

        timer.start = Date.now();
        getBrowseData('author', profileName, 0, 1000, function (err, packages) {
          timer.end = Date.now();
          addMetric({
            name: 'latency',
            value: timer.end - timer.start,
            type: 'couchdb',
            browse: ['author', profileName, 0, 1000].join(', ')
          });

          if (err) {
            return showError(request, reply, 'Unable to get modules by user ' + profileName, err);
          }

          opts.profile = {
            title: showprofile.name,
            packages: getRandomAssortment(packages, 'packages', profileName),
            starred: getRandomAssortment(starred, 'starred', profileName),
            isSelf: opts.user && opts.user.name && profileName === opts.user.name
          }

          opts.profile.showprofile = transform(showprofile, options);
          opts.profile.fields = opts.profile.showprofile.fields;

          addMetric({ name: 'showProfile' });

          return reply.view('profile', opts)
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

function showError (request, reply, message, logExtras) {
  var errId = uuid.v1();

  var opts = {
    user: request.auth.credentials,
    errId: errId,
    code: 500,
    hiring: request.server.methods.getRandomWhosHiring()
  };

  log.error(errId + ' ' + Hapi.error.internal(message), logExtras);

  return reply.view('error', opts).code(500);
}