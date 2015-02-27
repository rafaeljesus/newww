var collaborator = module.exports = {};

collaborator.list = function (request, reply) {
  var Collaborator = require("../models/collaborator").new(request)

  Collaborator.list(request.params.package, function(err, collaborators) {
    if (err) {
      request.logger.error(err);
      return reply(err)
    }
    return reply({collaborators: collaborators});
  });
};

collaborator.add = function (request, reply) {
  var Collaborator = require("../models/collaborator").new(request)

  Collaborator.add(request.params.package, request.payload.collaborator, function(err, collaborator) {
    if (err) {
      request.logger.error(err);
      return reply(err)
    }
    return reply({collaborator: collaborator});
  });
};

collaborator.update = function (request, reply) {
  var Collaborator = require("../models/collaborator").new(request)

  Collaborator.update(request.params.package, request.payload.collaborator, function(err, collaborator) {
    if (err) {
      request.logger.error(err);
      return reply(err)
    }
    return reply({collaborator: collaborator});
  });
};

collaborator.del = function (request, reply) {
  var Collaborator = require("../models/collaborator").new(request)

  Collaborator.del(request.params.package, request.params.username, function(err, collaborator) {
    if (err) {
      request.logger.error(err);
      return reply(err)
    }
    return reply({collaborator: collaborator});
  });
};
