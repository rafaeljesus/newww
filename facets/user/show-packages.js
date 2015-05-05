var User = require('../../models/user');

module.exports = function(request, reply) {
  var name = request.params.name;
  var offset = request.query.offset;

  User.new(request)
    .getPackages(name, offset)
    .then(function (packages) {
      return reply(packages).code(200);
    })
    .catch(function (err) {
      request.logger.error(err);
      return reply('error getting packages').code(500);
    });

};
