var collaborator = module.exports = {};
var Collaborator = require("../models/collaborator")
var decorate = require("../presenters/collaborator")

collaborator.list = function(request, reply) {
  Collaborator.new(request)
  .list(request.packageName, function(err, collaborators) {
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
  .add(request.packageName, request.payload.collaborator, function(err, collaborator) {
    if (err) {
      request.logger.error(err);
      return reply(err)
    }
    return reply({
      collaborator: decorate(collaborator, request.packageName)
    });
  });
};

collaborator.update = function(request, reply) {
  Collaborator.new(request)
  .update(request.packageName, request.payload.collaborator, function(err, collaborator) {
    if (err) {
      request.logger.error(err);
      return reply(err)
    }
    return reply({
      collaborator: decorate(collaborator, request.packageName)
    });
  });
};

collaborator.del = function(request, reply) {
  Collaborator.new(request)
  .del(request.packageName, request.params.username, function(err, result) {
    if (err) {
      request.logger.error(err);
      return reply(err)
    }
    return reply(result)
  });
};
