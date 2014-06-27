var transform = require('./presenters/profile').transform;


module.exports = function (options) {
  return function (request, reply) {
    var getUserFromCouch = request.server.methods.getUserFromCouch;
    var getBrowseData = request.server.methods.getBrowseData;

    var opts = {
      user: request.auth.credentials
    };

    var profileName = request.params.name || opts.user.name;

    if (request.info.referrer.indexOf('profile-edit') !== -1) {
      getUserFromCouch.cache.drop(profileName, function (er, resp) {
        return getUserFromCouch(profileName, showProfile);
      });
    }

    return getUserFromCouch(profileName, showProfile);

    function showProfile (err, showprofile) {
      if (err) {
        opts.name = err.output.payload.message;
        return reply.view('profile-not-found', opts);
      }

      getBrowseData('userstar', profileName, 0, 1000, function (err, starred) {
        getBrowseData('author', profileName, 0, 1000, function (err, packages) {

          opts.profile = {
            title: showprofile.name,
            // hiring: req.model.whoshiring,
            packages: getRandomAssortment(packages, 'packages', profileName),
            starred: getRandomAssortment(starred, 'starred', profileName),
            isSelf: opts.user && opts.user.name && profileName === opts.user.name
          }

          opts.profile.showprofile = transform(showprofile, options);
          opts.profile.fields = opts.profile.showprofile.fields;

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