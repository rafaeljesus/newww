var omit = require("lodash").omit;

module.exports = function(request, reply) {

  if (!process.env.FEATURE_ACCESS) {
    return reply.view('errors/not-found').code(404);
  }

  var package
  var user = request.auth.credentials;
  var Collaborator = require("../models/collaborator").new(request)
  var Package = require("../models/package").new(request)
  var context = {
    userHasReadAccessToPackage: false,
    userHasWriteAccessToPackage: false,
  }

  Package.get(request.packageName)
  .then(function(pkg){
    package = omit(pkg, ['readme', 'versions']);
    return Collaborator.list(package.name)
  })
  .then(function(collaborators) {
    package.collaborators = collaborators;

    if (user && user.name in package.collaborators) {
      context.userHasReadAccessToPackage = true
      context.userHasWriteAccessToPackage = package.collaborators[user.name].write
    }

    if (package.private && !context.userHasReadAccessToPackage) {
      return reply.view('errors/not-found').code(404);
    }

    context.enablePermissionTogglers = package.scoped
      && context.userHasWriteAccessToPackage

    context.package = package
    return reply.view('package/access', context)
  })

};
