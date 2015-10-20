var Collaborator = require("../agents/collaborator");
var decorate = require("../presenters/collaborator");

var collaborator = module.exports = {};

collaborator.list = function(request, reply) {
  Collaborator(request.loggedInUser && request.loggedInUser.name)
    .list(request.packageName, function(err, collaborators) {
      if (err) {
        request.logger.error(err);
        return reply(err);
      }
      return reply({
        collaborators: collaborators
      });
    });
};

collaborator.add = function(request, reply) {
  Collaborator(request.loggedInUser && request.loggedInUser.name)
    .add(request.packageName, request.payload.collaborator, function(err, collab) {

      if (err) {
        request.logger.error(err);
        if (err.statusCode === 404) {
          return reply({
            statusCode: 404,
            message: "user not found: " + request.payload.collaborator.name
          }).code(404);
        } else {
          return reply(err);
        }
      }

      return reply({
        collaborator: decorate(collab, request.packageName)
      });
    });
};

collaborator.update = function(request, reply) {
  Collaborator(request.loggedInUser && request.loggedInUser.name)
    .update(request.packageName, request.payload.collaborator, function(err, collaborator) {
      if (err) {
        request.logger.error(err);
        return reply(err);
      }
      return reply({
        collaborator: decorate(collaborator, request.packageName)
      });
    });
};

collaborator.del = function(request, reply) {
  Collaborator(request.loggedInUser && request.loggedInUser.name)
    .del(request.packageName, request.params.username, function(err, result) {
      if (err) {
        request.logger.error(err);
        return reply(err);
      }
      return reply(result);
    });
};
