var _ = require('lodash');
var P = require('bluebird');
var validate = require('validate-npm-package-name');
var npa = require('npm-package-arg');
var PackageAgent = require("../agents/package");
var feature = require('../lib/feature-flags');

var DEPENDENCY_TTL = 5 * 60; // 5 minutes

exports.show = function(request, reply) {
  var name = request.packageName;
  var context = {
    title: name
  };
  var loggedInUser = request.loggedInUser;
  var Download = require("../models/download").new({
    request: request,
    cache: require("../lib/cache")
  });
  var Package = PackageAgent(request.loggedInUser);

  request.logger.info('get package: ' + name);

  var actions = {};
  actions.package = Package.get(name);
  actions.dependents = Package.list({
    dependency: name,
    limit: 50
  }, DEPENDENCY_TTL);
  if (!feature('npmo')) {
    actions.downloads = Download.getAll(name);
  }

  P.props(actions)
    .then(function(results) {
      var pkg = results.package;
      pkg.dependents = results.dependents;
      if (pkg.name[0] != '@') {
        pkg.downloads = results.downloads;
      }

      if (pkg && pkg.time && pkg.time.unpublished) {
        request.logger.info('package is unpublished: ' + name);
        reply.view('package/unpublished', context).code(404);
        return;
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

    })
    .catch(function(err) {
      // unpaid collaborator
      if (err.statusCode === 402) {
        reply.redirect('/settings/billing?package=' + name);
        return;
      }

      if (err.statusCode === 404) {
        var pkg = npa(name);
        pkg.available = false;

        if (!validate(name).validForNewPackages) {
          context.package = pkg;
          reply.view('errors/package-not-found', context).code(400);
          return;
        }

        if (pkg.scope) {
          pkg.owner = pkg.scope.slice(1);
          if (loggedInUser) {
            if (pkg.owner === loggedInUser.name) {
              pkg.available = true;
            } else {
              pkg.unavailableToLoggedInUser = true;
            }
          } else {
            pkg.unavailableToAnonymousUser = true;
          }
        } else {
          pkg.available = true;
        }

        context.package = pkg;
        reply.view('errors/package-not-found', context).code(404);
        return;
      }

      request.logger.error(err);
      err.internalStatusCode = 500;
      reply(err);
      return;
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
