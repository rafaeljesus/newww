var omit = require("lodash").omit;

module.exports = function(request, reply) {

  if (!request.features.access_page) {
    return reply.view('errors/not-found').code(404);
  }

  var package;
  var loggedInUser = request.loggedInUser;
  var Collaborator = require("../models/collaborator").new(request);
  var Package = require("../models/package").new(request);
  var context = {
    title: request.packageName + ": access",
    userHasReadAccessToPackage: false,
    userHasWriteAccessToPackage: false,
  };

  var promise = Package.get(request.packageName)
  .catch(function(err){
    request.logger.error("unable to get package " + request.packageName);
    request.logger.error(err);

    switch(err.statusCode) {
      case 402:
        reply.redirect('/settings/billing?package='+request.packageName);
        break;
      case 404:
        reply.view('errors/not-found').code(404);
        break;
      default:
        reply.view('errors/internal', context).code(500);
    }
    return promise.cancel();
  })
  .then(function(pkg){
    package = omit(pkg, ['readme', 'versions']);
    return Collaborator.list(package.name);
  })
  .then(function(collaborators) {
    package.collaborators = collaborators;

    if (loggedInUser && loggedInUser.name in package.collaborators) {
      context.userHasReadAccessToPackage = true;
      context.userHasWriteAccessToPackage = package.collaborators[loggedInUser.name].write;
    }

    if (package.private && !context.userHasReadAccessToPackage) {
      return reply.view('errors/not-found').code(404);
    }

    context.enablePermissionTogglers = Boolean(package.private) && context.userHasWriteAccessToPackage;

    context.package = package;

    // Disallow unpaid users from toggling their public scoped packages to private
    if (Boolean(package.scoped) && !Boolean(package.private) && context.userHasWriteAccessToPackage) {
      context.paymentRequiredToTogglePrivacy = true;
      request.customer.get(function(err, customer) {
        if (err && err.statusCode !== 404) {
          request.logger.error("error fetching customer data for user " + loggedInUser.name);
          request.logger.error(err);
          return reply.view('errors/internal', context).code(500);
        } else {
          if (customer) {
            context.paymentRequiredToTogglePrivacy = false;
            context.customer = customer;
          }
          return reply.view('package/access', context);
        }
      });
    } else {
      return reply.view('package/access', context);
    }

  });

};
