var pluck = require("lodash").pluck
var package = module.exports = {}
var validate = require('validate-npm-package-name');
var npa = require('npm-package-arg');

package.show = function(request, reply) {
  var package;
  var context = {title: name};
  var loggedInUser = request.auth.credentials;
  var Package = require("../models/package").new(request)
  var Download = require("../models/download").new(request)
  var name = request.params.package ||
    request.params.scope + "/" + request.params.project;

  request.logger.info('get package: ' + name);

  var promise = Package.get(name)
    .catch(function(err){

      if (err.statusCode === 404) {
        var package = npa(name)
        package.available = false

        if (!validate(name).validForNewPackages) {
          context.package = package
          reply.view('errors/package-not-found', context).code(400);
          return promise.cancel();
        }

        // Unscoped packages are fair game for all users,
        // whether they're logged in or not
        if (!package.scope) {
          package.available = true
        }

        // This package may be visible to this person
        // if they log in
        if (package.scope && !loggedInUser) {
          package.unavailableToAnonymousUser = true
        }

        // This package is definitely not available to this user,
        // because they're logged in
        if (package.scope && loggedInUser
          && package.scope.replace("@", "") !== loggedInUser.name) {
          package.unavailableToLoggedInUser = true
        }

        // Package scope is same as username. It will be theirs!
        if (package.scope && loggedInUser
          && package.scope.replace("@", "") === loggedInUser.name) {
          package.available = true
        }

        context.package = package
        reply.view('errors/package-not-found', context).code(404);
        return promise.cancel();
      }

      request.logger.error(err);
      reply.view('errors/internal', context).code(500);
      return promise.cancel();
    })
    .then(function(p) {
      package = p

      if (package.time && package.time.unpublished) {
        request.logger.info('package is unpublished: ' + name);
        reply.view('package/unpublished', context).code(404);
        return promise.cancel();
      }

      return Download.getAll(package.name)
    })
    .catch(function(err){
      // tolerate timed-out downloads API calls
      if (err.code === 'ETIMEDOUT') return null;
    })
    .then(function(downloads) {
      package.downloads = downloads

      package.isStarred = !!(loggedInUser
        && Array.isArray(package.stars)
        && package.stars.indexOf(loggedInUser.name) > -1)

      package.isCollaboratedOnByUser = !!(loggedInUser
        && package.maintainers
        && pluck(package.maintainers, 'name').indexOf(loggedInUser.name) > -1)

      context.package = package
      return reply.view('package/show', context);
    })
}
