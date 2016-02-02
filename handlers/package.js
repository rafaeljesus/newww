var _ = require('lodash');
var P = require('bluebird');
var validate = require('validate-npm-package-name');
var npa = require('npm-package-arg');
var PackageAgent = require("../agents/package");
var DownloadAgent = require('../agents/download');
var feature = require('../lib/feature-flags');

var DEPENDENCY_TTL = 5 * 60; // 5 minutes

exports.show = function(request, reply) {
  var name = request.packageName;
  var context = {
    title: name
  };
  var loggedInUser = request.loggedInUser;
  var Download = new DownloadAgent(request.loggedInUser);
  var Package = PackageAgent(request.loggedInUser);

  request.logger.info('get package: ' + name);

  P.all([
    Package.get(name),
    Package.list({
      dependency: name,
      limit: 50
    }, DEPENDENCY_TTL),
    feature('npmo') ? null : Download.getAll(name),
  ]).spread(function(pkg, dependents, downloads) {
    pkg.dependents = dependents;
    if (pkg.name[0] != '@') {
      pkg.downloads = downloads;
    }

    if (pkg && pkg.time && pkg.time.unpublished) {
      request.logger.info('package is unpublished: ' + name);
      return reply.view('package/unpublished', context).code(404);
    }

    if (_.get(pkg, 'dependents.results.length')) {
      pkg.numMoreDependents = pkg.dependentCount - pkg.dependents.results.length;
    }

    pkg.isStarred = Boolean(loggedInUser)
      && Array.isArray(pkg.stars)
      && pkg.stars.indexOf(loggedInUser.name) > -1;

    pkg.isCollaboratedOnByUser = Boolean(loggedInUser)
      && (typeof pkg.collaborators === "object")
      && (loggedInUser.name in pkg.collaborators);

    pkg.hasStats = pkg.downloads || (pkg.bugs && pkg.bugs.url) || (pkg.pull_requests && pkg.pull_requests.url);

    context.package = pkg;
    return reply.view('package/show', context);

  }).catch(function(err) {
    // unpaid collaborator
    if (err.statusCode === 402) {
      return reply.redirect('/settings/billing?package=' + name);
    }

    if (err.statusCode === 404) {
      var pkg = npa(name);
      pkg.available = false;

      if (!validate(name).validForNewPackages) {
        context.package = pkg;
        return reply.view('errors/package-not-found', context).code(400);
      }

      if (pkg.scope) {
        pkg.owner = pkg.scope.slice(1);
      }

      if (!pkg.scope || (loggedInUser && pkg.owner === loggedInUser.name)) {
        pkg.available = true;
      } else if (loggedInUser) {
        pkg.unavailableToLoggedInUser = true;
      } else {
        pkg.unavailableToAnonymousUser = true;
      }

      context.package = pkg;

      return reply.view('errors/package-not-found', context).code(404);
    }

    return reply(err);
  });
};

exports.update = function(request, reply) {
  PackageAgent(request.loggedInUser)
    .update(request.packageName, request.payload.package)
    .then(function(pkg) {
      return reply({
        package: pkg
      });
    })
    .catch(function(err) {
      request.logger.error(err);
      return reply(err);
    });
};
