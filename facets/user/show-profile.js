var User = require('../../models/user');

module.exports = function(request, reply) {
  var loggedInUser = request.auth.credentials;

  // Could be arriving from /~ or /~username
  var name = request.params.name || loggedInUser.name;

  var opts = {
    title: "@" + name
  };

  User.new(request)
    .get(name, {stars: true, packages: true}, function(err, user) {

      if (err) {
        request.logger.error(err);
        if (err.statusCode === 404) {
          return reply.view('errors/user-not-found', opts).code(404);
        } else {
          return reply.view('errors/internal', opts).code(500);
        }
      }

      opts.profile = user;
      opts.profile.isSelf = loggedInUser && name === loggedInUser.name;

      return reply.view('user/profile', opts);
    });

};
