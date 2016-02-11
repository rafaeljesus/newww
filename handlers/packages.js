var filterBlacklistedPackages = require('../lib/filter-blacklisted-packages');
var User = require('../agents/user');

module.exports = function(request, reply) {
  var name = request.params.name;
  var offset = request.query.offset;

  new User(request.loggedInUser)
    .getPackages(name, offset)
    .then(function(packages) {
      reply((name === 'isaacs') ? filterBlacklistedPackages(packages) : packages).code(200);
    })
    .catch(function(err) {
      request.logger.error(err);
      reply('error getting packages').code(500);
    });
};
