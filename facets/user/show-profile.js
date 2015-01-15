var User = new (require(__dirname + '/../../models/user'))();
// var present = require(__dirname + '/../../presenters/user');

module.exports = function(request, reply) {
  var name = request.params.name || opts.user.name;
  var opts = {
    user: request.auth.credentials,
    namespace: 'user-show',
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

    opts.profile = user
    opts.profile.isSelf = opts.user && opts.user.name && name === opts.user.name
    return reply.view('user/profile', opts)
  })

}
