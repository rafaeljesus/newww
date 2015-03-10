var _ = require("lodash");

module.exports = function(request, reply) {
  var Collaborator = require("../models/collaborator").new(request)
  var Package = require("../models/package").new(request)
  var context = {}
  var package

  Package.get(request.packageName)
  .then(function(pkg){
    package = _.pick(pkg, ["name", "description", "dist-tags"]);
    Collaborator.list(package.name)
      .then(function(collaborators) {
        package.collaborators = collaborators;
        context.package = package;
        return reply.view('package/access', context);
      })
  })

};
