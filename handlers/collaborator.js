var collaborator = module.exports = {};
var Collaborator = require("../models/collaborator")

collaborator.list = function(request, reply) {
  Collaborator.new(request)
  .list(request.params.package, function(err, collaborators) {
    if (err) {
      request.logger.error(err);
      return reply(err)
    }
    return reply({
      collaborators: collaborators
    });
  });
};

collaborator.add = function(request, reply) {
  Collaborator.new(request)
  .add(request.params.package, request.payload.collaborator, function(err, collaborator) {
    if (err) {
      request.logger.error(err);
      return reply(err)
    }
    return reply({
      collaborator: collaborator
    });
  });
};

collaborator.update = function(request, reply) {
  Collaborator.new(request)
  .update(request.params.package, request.payload.collaborator, function(err, collaborator) {
    if (err) {
      request.logger.error(err);
      return reply(err)
    }
    return reply({
      collaborator: collaborator
    });
  });
};

collaborator.del = function(request, reply) {
  Collaborator.new(request)
  .del(request.params.package, request.params.username, function(err, collaborator) {
    if (err) {
      request.logger.error(err);
      return reply(err)
    }
    return reply({
      collaborator: collaborator
    });
  });
};
