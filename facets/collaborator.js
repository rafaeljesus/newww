var collaborator = module.exports = {};
var newCollaboratorClient = function(request) {
  var bearer = request.auth.credentials && request.auth.credentials.name
  return new request.server.models.Collaborator({bearer: bearer});
}

collaborator.list = function (request, reply) {
  var Collaborator = newCollaboratorClient(request)

  Collaborator.list(request.params.package, function(err, collaborators) {
    if (err) {
      request.logger.error(err);
      return reply(err)
    }
    return reply({collaborators: collaborators});
  });
};

collaborator.add = function (request, reply) {
  var Collaborator = newCollaboratorClient(request)

  Collaborator.add(request.params.package, request.payload.collaborator, function(err, collaborator) {
    if (err) {
      request.logger.error(err);
      return reply(err)
    }
    return reply({collaborator: collaborator});
  });
};

collaborator.update = function (request, reply) {
  var Collaborator = newCollaboratorClient(request)

  Collaborator.update(request.params.package, request.payload.collaborator, function(err, collaborator) {
    if (err) {
      request.logger.error(err);
      return reply(err)
    }
    return reply({collaborator: collaborator});
  });
};

collaborator.del = function (request, reply) {
  var Collaborator = newCollaboratorClient(request)

  Collaborator.del(request.params.package, request.params.username, function(err, collaborator) {
    if (err) {
      request.logger.error(err);
      return reply(err)
    }
    return reply({collaborator: collaborator});
  });
};
