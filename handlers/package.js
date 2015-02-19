var pluck = require("lodash").pluck
var package = module.exports = {}
var validatePackageName = require('validate-npm-package-name');

var packageClientFromRequest = function(request) {
  var bearer = request.auth.credentials && request.auth.credentials.name
  return new request.server.models.Package({
    bearer: bearer,
    request: request
  });
}

package.show = function(request, reply) {
  var getDownloadData = request.server.methods.downloads.getAllDownloadsForPackage;
  var loggedInUser = request.auth.credentials;
  var Package = packageClientFromRequest(request);
  var opts = {
    name: request.params.package,
  };

  request.timing.page = 'showPackage';
  request.metrics.metric({
    name: 'showPackage',
    package: request.params.package,
    value: 1
  });

  Package.get(opts.name, function(er, pkg) {

    opts.package = {
      name: opts.name
    };

    if (er) {
      request.logger.error(er, 'fetching package ' + opts.name);
      return reply.view('errors/internal', opts).code(500);
    }

    if (!pkg) {
      // suppress the encouraging 404 message if name is not valid
      if (!validatePackageName(opts.name).valid) {
        delete opts.package;
        request.logger.info('request for invalid package name: ' + opts.name);
      }
      return reply.view('errors/not-found', opts).code(404);
    }

    if (pkg.time && pkg.time.unpublished) {
      opts.package = pkg;
      request.timing.page = 'showUnpublishedPackage';
      return reply.view('package/unpublished', opts).code(410);
    }

    getDownloadData(opts.name, function(err, downloads) {

      if (err) {
        // this really shouldn't happen! but we defend against it if it does.
        pkg.downloads = false;
      } else {
        if (Array.isArray(downloads)) {
          pkg.downloads = downloads[0];
        } else {
          pkg.downloads = downloads;
        }
      }

      if (loggedInUser) {
        pkg.isStarred = pkg.stars
          && pkg.stars.indexOf(loggedInUser.name) > -1

        pkg.isCollaboratedOnByUser = pkg.maintainers
          && pluck(pkg.maintainers, 'name').indexOf(loggedInUser.name) > -1
      }

      opts.package = pkg;
      opts.title = pkg.name;
      reply.view('package/show', opts);
    });
  });
}
