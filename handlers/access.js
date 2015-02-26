var http = require("request");
var _ = require("lodash");
var utils = require("../lib/utils");

module.exports = function(request, reply) {

  var bearer = request.auth.credentials && request.auth.credentials.name;
  var Collaborator = new request.server.models.Collaborator({bearer: bearer});
  var ctx = {};

  http("http://registry.npmjs.org/" + request.params.package, function(err, res, body) {

    var parsedBody = utils.safeJsonParse(body);

    var package = _.pick(parsedBody, ["name", "description", "dist-tags"]);
    Collaborator.list(package.name)
      .then(function(collaborators) {
        package.collaborators = collaborators;
        ctx.package = package;
        return reply.view('package/access', ctx);
      });
  });

};
