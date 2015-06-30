var Org = require('../agents/org');

module.exports = function (request, reply) {
  var opts = {};
  Org.get(request.params.org, request.loggedInUser, function (err, org) {
    if (err) { request.logger.error(err); }
    opts.org = org;
    reply.view('org/info', opts);
  });
};