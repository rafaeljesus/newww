var Org = require('../../agents/org'),
  async = require('async');

module.exports = function(request, reply) {
  var loggedInUser = request.loggedInUser;
  var name = request.orgName;
  var opts = {};
  opts.orgName = name;

  Org.get(name, loggedInUser, function (err, results) {
    if (err) {
      request.logger.error(err);
      if (err.message === 'unexpected status code 404') {
        return reply.view('errors/org-not-found', opts).code(404);
      } else {
        return reply.view('errors/internal', opts).code(500);
      }
    } else {
      opts.info = results.info;
      opts.users = results.users;
      opts.teams = results.teams;

      return reply.view('org/info', opts);
    }
  });
};
