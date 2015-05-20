var UserAPI = require('../../models/user'),
  async = require('async');

module.exports = function(request, reply) {
  var loggedInUser = request.loggedInUser;

  // Could be arriving from /~ or /~username
  var name = request.params.name || loggedInUser.name;

  var opts = {
    title: "@" + name
  };

  var User = UserAPI.new(request);
  var actions = {
    user:     function(cb) { User.get(name, cb); },
    stars:    function(cb) { User.getStars(name, cb); },
    packages: function(cb) { User.getPackages(name, cb); },
  };

  async.parallel(actions, function(err, results) {

    if (err) {
      request.logger.error(err);
      if (err.message === 'unexpected status code 404') {
        return reply.view('errors/user-not-found', opts).code(404);
      } else {
        return reply.view('errors/internal', opts).code(500);
      }
    }

    opts.profile = results.user;
    opts.profile.stars = results.stars;
    opts.profile.packages = results.packages;
    opts.profile.isSelf = loggedInUser && name === loggedInUser.name;

    return reply.view('user/profile', opts);
  });
};
