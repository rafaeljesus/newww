var Org = require('../agents/org');
var exp = {};


exp.getOrg = function (request, reply) {
  var opts = {};
  Org(request.loggedInUser.name)
    .get(request.params.org, function (err, org) {
    if (err) { request.logger.error(err); }
    opts.org = org;
    reply.view('org/info', opts);
  });
};

exp.updateOrg = function (request, reply) {
  var opts = {};
  var loggedInUser = request.loggedInUser.name;
  var orgName = request.params.org;
  var user = {
    user: request.payload.username,
    role: request.payload.role
  };

  Org(loggedInUser)
    .addUser(orgName, user, function (err, addedUser){
      if (err) {
        request.logger.error(err);
        return reply.view('errors/internal', err);
      }
      Org(loggedInUser)
        .get(orgName, function (err, org) {
          if (err) { request.logger.error(err); }
          opts.org = org;
          return reply.view('org/info', opts);
        });
    });
};

module.exports = exp;