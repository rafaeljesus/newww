var User = require('../../models/user');

module.exports = function(request, reply) {
  var name = request.loggedInUser.name;
  var opts = {};

  User.new(request)
    .getOrgs(name)
    .then(function(orgs) {
      opts.orgs = orgs;
      return reply.view('org/index', opts);
    })
    .catch(function(err) {
      return reply.view('errors/interal', opts);
    });

};
