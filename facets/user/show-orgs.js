var User = require('../../models/user');

module.exports = function(request, reply) {
  var name = request.params.name;
  var opts = {};

  User.new(request)
    .getOrgs(name)
    .then(function (orgs) {
      opts.orgs = orgs;
      return reply.view('org/info', opts);
    })
    .catch(function (err) {
      return reply.view('errors/interal', opts);
    });

};
