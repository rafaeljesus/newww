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


module.exports = exp;