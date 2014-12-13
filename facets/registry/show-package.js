var Hapi = require('hapi'),
    presentPackage = require('./presenters/package'),
    log = require('bole')('registry-package'),
    metrics = require('newww-metrics')();

module.exports = function (request, reply) {
  var getPackage = request.server.methods.registry.getPackage,
      getBrowseData = request.server.methods.registry.getBrowseData,
      getDownloadsForPackage = request.server.methods.downloads.getDownloadsForPackage,
      getAllDownloadsForPackage = request.server.methods.downloads.getAllDownloadsForPackage,
      showError = request.server.methods.errors.showError(reply),
      addMetric = metrics.addMetric,
      addLatencyMetric = metrics.addPageLatencyMetric;

  var timer = { start: Date.now() };

  if (request.params.version) {
    return reply.redirect('/package/' + request.params.package)
  }

  var opts = {
    user: request.auth.credentials,

    namespace: 'registry-package'
  }

  opts.name = request.params.package

  if (opts.name !== encodeURIComponent(opts.name)) {
    return showError([opts.name, encodeURIComponent(opts.name)], 400, 'Invalid Package Name', opts);
  }

  getPackage(opts.name, function (er, pkg) {

    if (er || pkg.error) {

      opts.package = {
        name: opts.name
      }
      return reply.view('errors/not-found', opts).code(404);
    }

    if (pkg.time && pkg.time.unpublished) {
      // reply with unpublished package page
      var t = pkg.time.unpublished.time
      pkg.unpubFromNow = require('moment')(t).format('ddd MMM DD YYYY HH:mm:ss Z');

      opts.package = pkg;

      timer.end = Date.now();
      addLatencyMetric(timer, 'showUnpublishedPackage');

      addMetric({ name: 'showPackage', package: request.params.package });
      return reply.view('registry/unpublished-package-page', opts);
    }

    timer.start = Date.now();

    // on the package page, we should not load dependent package-data,
    // this is too slow!
    getBrowseData({type: 'depended', noPackageData: true}, opts.name, 0, 1000, function (er, dependents) {
      timer.end = Date.now();
      addMetric({
        name: 'latency',
        value: timer.end - timer.start,
        type: 'couchdb',
        browse: ['depended', opts.name, 0, 1000].join(', ')
      });

      if (er) {
        return showError(er, 500, 'Unable to get depended data from couch for ' + opts.name, opts);
      }

      pkg.dependents = dependents;

      presentPackage(pkg, function (er, sanitizedPackage) {
        if (er) {
          return showError(er, 500, 'An error occurred with presenting package ' + opts.name, opts);
        }

        sanitizedPackage.isStarred = opts.user && sanitizedPackage.users && sanitizedPackage.users[opts.user.name] || false;

        opts.package = sanitizedPackage;
        opts.title = sanitizedPackage.name;

        // Show download count for the last day, week, and month
        return getAllDownloadsForPackage(sanitizedPackage.name, handleDownloads);

        function handleDownloads(er, downloadData) {
          if (er) {
            return showError(er, 500, 'An error occurred with getting download counts for ' + opts.name, opts);
          }

          opts.package.downloads = downloadData

          timer.end = Date.now();
          addLatencyMetric(timer, 'showPackage');

          addMetric({ name: 'showPackage', package: request.params.package });


          return reply.view('registry/package-page', opts);
        }
      })
    })
  })
}
