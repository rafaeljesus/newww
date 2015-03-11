var _ = require("lodash");

module.exports = function(request, reply) {
  var user = request.auth.credentials;
  var Collaborator = require("../models/collaborator").new(request)
  var Package = require("../models/package").new(request)
  var desiredPackageFields = [
    "name",
    "description",
    "scoped",
    "private"
  ];
  var context = {}
  var package

  Package.get(request.packageName)
  .then(function(pkg){

    package = _.pick(pkg, desiredPackageFields);
    Collaborator.list(package.name)
      .then(function(collaborators) {

        Object.keys(collaborators).forEach(function(key){
          collaborators[key].write = collaborators[key].permissions === "write"
        })

        package.collaborators = collaborators;

        if (user && user.name in package.collaborators) {
          user.hasReadAccessToPackage = true
          user.hasWriteAccessToPackage = package.collaborators[user.name].permissions === "write"
        }

        if (package.private && (!user || !user.hasReadAccessToPackage)) {
          return reply.view('errors/not-found').code(404);
        }

        context.enablePermissionTogglers = package.scoped
          && user
          && user.hasWriteAccessToPackage

        context.package = package
        return reply.view('package/access', context)
      })
  })

};
