var package = module.exports = {};
var validate = require('validate-npm-package-name');
var npa = require('npm-package-arg');
var PackageModel = require("../models/package");

package.show = function(request, reply) {
  var package;
  var name = request.packageName;
  var context = {title: name};
  var loggedInUser = request.loggedInUser;
  var Download = require("../models/download").new({
    request: request, cache: require("../lib/cache")
  });
  var Package = PackageModel.new(request);

  request.logger.info('get package: ' + name);

  var promise = Package.get(name)
    .catch(function(err){

      // unpaid collaborator
      if (err.statusCode === 402) {
        reply.redirect('/settings/billing?package='+name);
        return promise.cancel();
      }

      if (err.statusCode === 404) {
        var package = npa(name);
        package.available = false;

        if (!validate(name).validForNewPackages) {
          context.package = package;
          reply.view('errors/package-not-found', context).code(400);
          return promise.cancel();
        }

        if (package.scope) {
          package.owner = package.scope.slice(1);
          if (loggedInUser) {
            if (package.owner === loggedInUser.name) {
              package.available = true;
            } else {
              package.unavailableToLoggedInUser = true;
            }
          } else {
            package.unavailableToAnonymousUser = true;
          }
        } else {
          package.available = true;
        }

        context.package = package;
        reply.view('errors/package-not-found', context).code(404);
        return promise.cancel();
      }

      request.logger.error(err);
      reply.view('errors/internal', context).code(500);
      return promise.cancel();
    })
    .then(function(p) {
      package = p;

      if (package.time && package.time.unpublished) {
        request.logger.info('package is unpublished: ' + name);
        reply.view('package/unpublished', context).code(404);
        return promise.cancel();
      }

      var DEPENDENCY_TTL = 5 * 60; // 5 minutes
      return Package.list({dependency: name, limit: 50}, DEPENDENCY_TTL);
    })
    .then(function(dependents) {
      package.dependents = dependents;

      if (dependents.results.length) {
        package.numMoreDependents = package.dependentCount - dependents.results.length;
      }

      return Download.getAll(package.name);
    })
    .then(function(downloads) {

      package.downloads = downloads;

      package.isStarred = Boolean(loggedInUser)
        && Array.isArray(package.stars)
        && package.stars.indexOf(loggedInUser.name) > -1;

      package.isCollaboratedOnByUser = Boolean(loggedInUser)
        && (typeof package.collaborators === "object")
        && (loggedInUser.name in package.collaborators);

      context.package = package;
      return reply.view('package/show', context);
    });
};

package.update = function(request, reply) {
  PackageModel.new(request).update(request.packageName, request.payload.package)
    .then(function(package) {
      return reply({package: package});
    })
    .catch(function(err){
      request.logger.error(err);
      return reply(err);
    });
};
