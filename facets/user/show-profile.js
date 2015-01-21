module.exports = function(request, reply) {
  var User = request.server.models.User;
  var loggedInUsername = request.auth.credentials;

  // Could be arriving from /~ or /~username
  var name = request.params.name || loggedInUsername;

  var opts = {
    user: request.auth.credentials,
    title: name,
  };

  User.get(name, {stars: true, packages: true}, function(err, user) {

    if (err) {
      request.logger.error(err);
      if (err.statusCode === 404) {
        return reply.view('errors/user-not-found', opts).code(404);
      } else {
        return reply.view('errors/internal', opts).code(500);
      }
    }

    opts.profile = user;
    opts.profile.isSelf = name === loggedInUsername;

    return reply.view('user/profile', opts);
  });

};
