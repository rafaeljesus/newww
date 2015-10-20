var P = require('bluebird');

var feature = require('../lib/feature-flags.js');
var PackageAgent = require('../agents/package');

var MINUTE = 60; // seconds
var MODIFIED_TTL = 1 * MINUTE;
var DEPENDENTS_TTL = 30 * MINUTE;

module.exports = function(request, reply) {
  var Package = new PackageAgent(request.loggedInUser);
  var Download = require("../models/download").new({
    request: request,
    cache: require("../lib/cache")
  });
  var context = {
    explicit: require("npm-explicit-installs")
  };

  var actions = {};

  actions.modified = Package.list({
    sort: "modified",
    count: 12
  }, MODIFIED_TTL);
  actions.dependents = Package.list({
    sort: "dependents",
    count: 12
  }, DEPENDENTS_TTL);

  if (!feature('npmo')) {
    actions.downloads = Download.getAll();
    actions.totalPackages = Package.count().catch(function(err) {
      request.logger.error(err);
      return null;
    });
  }

  P.props(actions).then(function(results) {
    context.modified = results.modified;
    context.dependents = results.dependents;
    context.downloads = results.downloads;
    context.totalPackages = results.totalPackages;

    reply.view('homepage', context);
  }).catch(function(err) {
    request.logger.error(err);
    reply.view('errors/internal', err);
  });
};
