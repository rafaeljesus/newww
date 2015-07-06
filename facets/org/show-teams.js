var Org = require('../../agents/org');

module.exports = function(request, reply) {
  var offset = request.query.offset;

  Org.new(request)
    .getTeams(name, offset)
    .then(function (teams) {
      return reply(teams).code(200);
    })
    .catch(function (err) {
      request.logger.error(err);
      return reply('error getting teams').code(500);
    });

};
