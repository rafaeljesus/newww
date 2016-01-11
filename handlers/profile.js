var filterBlacklistedPackages = require('../lib/filter-blacklisted-packages');
var UserAPI = require('../agents/user'),
  async = require('async');

module.exports = function(request, reply) {
  var loggedInUser = request.loggedInUser;

  // Could be arriving from /~ or /~username
  var name = request.params.name || loggedInUser.name;

  var opts = {
    title: "@" + name
  };

  var User = UserAPI(request.loggedInUser);
  var actions = {
    user: function(cb) {
      User.get(name, cb);
    },
    stars: function(cb) {
      User.getStars(name, cb);
    },
    packages: function(cb) {
      User.getPackages(name, cb);
    },
    orgs: function(cb) {
      if (!loggedInUser || name !== loggedInUser.name) {
        return cb();
      }

      User.getOrgs(loggedInUser.name)
        .catch(function(err) {
          if (err.statusCode === 401) {
            var orgs = {
              count: 0,
              items: []
            };
            return orgs;
          }

          throw err;
        })
        .then(function(orgs) {
          return cb(null, orgs);
        }, function(err) {
          return cb(err);
        });
    }
  };

  async.parallel(actions, function(err, results) {

    if (err) {
      if (err.message === 'unexpected status code 404') {
        request.logger.error(err);
        return reply.view('errors/user-not-found', opts).code(404);
      } else {
        return reply(err);
      }
    }

    opts.profile = results.user;
    opts.profile.stars = results.stars;
    opts.profile.packages = (name === 'isaacs') ? filterBlacklistedPackages(results.packages) : results.packages;
    opts.profile.isSelf = loggedInUser && name === loggedInUser.name;
    opts.profile.orgs = results.orgs;

    return reply.view('user/profile', opts);
  });
};
