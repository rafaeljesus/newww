var pluck = require("lodash").pluck
var package = module.exports = {}
var validatePackageName = require('validate-npm-package-name');

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

        if (validatePackageName(name).validForNewPackages) {
          request.logger.error('package not found: ' + name);

          // 404 pages for scoped packages are different
          if (name.charAt(0) === "@") {
            context.scopedPackage = true
          } else {
            context.package = {name: name}
          }

          reply.view('errors/not-found', context).code(404);
          return promise.cancel();
        }

        request.logger.error('invalid package name: ' + name);
        reply.view('errors/not-found', context).code(400);
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
