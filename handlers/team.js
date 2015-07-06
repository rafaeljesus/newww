var team = module.exports = {};

var _ = require('lodash');
var OrgApi = require('../agents/org');

var DEPENDENCY_TTL = 5 * 60; // 5 minutes

team.show = function(request, reply) {
  var name = request.teamName;
  var orgName = request.orgName;
  var loggedInUser = request.loggedInUser;
  var opts = {};
  opts.teamName = name;
  opts.orgName = orgName;

  var Org = OrgApi.new(request);

  request.logger.info('get team: ' + name);

  Org.getTeam(orgName, name, loggedInUser, function(err, teams){
    if (err) {
      request.logger.error(err);
      if (err.message === 'unexpected status code 404') {
        return reply.view('errors/team-not-found', opts).code(404);
      } else {
        return reply.view('errors/internal', opts).code(500);
      }
    } else {
      return reply.view('org/team/add-user', opts);
    }
  });
};
