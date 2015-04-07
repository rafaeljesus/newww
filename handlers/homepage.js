var P = require('bluebird');

module.exports = function (request, reply) {
  var Package = require("../models/package").new(request)
  var Download = require("../models/download").new({
    request: request, cache: require("../lib/cache")
  });
  var context = {
    explicit: require("npm-explicit-installs")
  };

  var actions = {
    modified:      Package.list({sort: "modified"}),
    dependents:    Package.list({sort: "dependents"}),
    downloads:     Download.getAll(),
    totalPackages: Package.count(),
  };

  P.props(actions)
  .then(function(results)
  {
    context.modified = results.modified;
    context.dependents = results.dependents;
    context.downloads = results.downloads;
    context.totalPackages = results.totalPackages;

    reply.view('homepage', context);
  });

};
