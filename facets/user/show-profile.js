var UserAPI = require('../../models/user'),
    P    = require('bluebird');

module.exports = function(request, reply) {
  var loggedInUser = request.loggedInUser;

  // Could be arriving from /~ or /~username
  var name = request.params.name || loggedInUser.name;

  var opts = {
    title: "@" + name
  };

  var User = UserAPI.new(request);
  var actions = {
    user:     User.get(name),
    stars:    User.getStars(name),
    packages: User.getPackages(name),
  };

  return P.props(actions)
  .then(function(results)
  {
    opts.profile = results.user;
    opts.profile.stars = results.stars;
    opts.profile.packages = results.packages;
    opts.profile.isSelf = loggedInUser && name === loggedInUser.name;

    return reply.view('user/profile', opts);
  }).catch(function(err) {
    if (err) {
      request.logger.error(err);
      if (err.message === 'unexpected status code 404') {
        return reply.view('errors/user-not-found', opts).code(404);
      } else {
        return reply.view('errors/internal', opts).code(500);
      }
    }
  });
};
