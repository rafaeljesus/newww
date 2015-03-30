var Collaborator = require("../models/collaborator")
var decorate = require("../presenters/collaborator")

var collaborator = module.exports = {};

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
  .add(request.packageName, request.payload.collaborator, function(err, c) {

    if (err) {
      request.logger.error(err);
      if (err.statusCode === 404) {
        return reply({
          statusCode: 404,
          message: "user not found: "+request.payload.collaborator.name
        }).code(404)
      } else {
        return reply(err)
      }
    }

    return reply({
      collaborator: decorate(c, request.packageName)
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
