var omit = require("lodash").omit;
var Collaborator = require("../agents/collaborator");
var Package = require("../agents/package");

module.exports = function(request, reply) {

  var cpackage;
  var loggedInUser = request.loggedInUser;
  var context = {
    title: request.packageName + ": access",
    userHasReadAccessToPackage: false,
    userHasWriteAccessToPackage: false,
    norobots: true,
  };

  var promise = Package(request.loggedInUser)
    .get(request.packageName)
    .catch(function(err) {
      request.logger.error("unable to get package " + request.packageName);
      request.logger.error(err);

      switch (err.statusCode) {
        case 402:
          reply.redirect('/settings/billing?package=' + request.packageName);
          break;
        case 404:
          reply.view('errors/not-found').code(404);
          break;
        default:
          err.statusCode = 500;
          reply(err);
      }
      return promise.cancel();
    })
    .then(function(pkg) {
      cpackage = omit(pkg, ['readme', 'versions']);
      return Collaborator(loggedInUser && loggedInUser.name).list(cpackage.name);
    })
    .catch(function(err) {
      request.logger.error('unable to get collaborators for package', request.packageName);
      request.logger.error(err);
      reply(err);
      return promise.cancel();
    })
    .then(function(collaborators) {
      cpackage.collaborators = collaborators;

      if (loggedInUser && loggedInUser.name in cpackage.collaborators) {
        context.userHasReadAccessToPackage = true;
        context.userHasWriteAccessToPackage = cpackage.collaborators[loggedInUser.name].write;
      }

      if (cpackage.private && !context.userHasReadAccessToPackage) {
        return reply.view('errors/not-found').code(404);
      }

      context.enablePermissionTogglers = Boolean(cpackage.private) && context.userHasWriteAccessToPackage;

      context.package = cpackage;

      // Disallow unpaid users from toggling their public scoped packages to private
      if (Boolean(cpackage.scoped) && !Boolean(cpackage.private) && context.userHasWriteAccessToPackage) {
        context.paymentRequiredToTogglePrivacy = true;
        request.customer.getStripeData(function(err, customer) {
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

    })
    .catch(function(err) {
      request.logger.error('unable to verify access for package', request.packageName);
      request.logger.error(err);
      reply(err);
      return promise.cancel();
    });

};
