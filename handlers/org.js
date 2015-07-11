var Org = require('../agents/org');

module.exports = function (request, reply) {
  var opts = {};
  Org(request.loggedInUser.name).get(request.params.org, function (err, org) {
    if (err) { request.logger.error(err); }
    opts.org = org;
    reply.view('org/info', opts);
  });
};