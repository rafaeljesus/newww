var Hapi = require('hapi'),
    presentPackage = require('./presenters/package');

module.exports = function (request, reply) {
  var getPackage = request.server.methods.registry.getPackage,
      getBrowseData = request.server.methods.registry.getBrowseData,
      getDownloadsForPackage = request.server.methods.downloads.getDownloadsForPackage,
      getAllDownloadsForPackage = request.server.methods.downloads.getAllDownloadsForPackage,
      showError = request.server.methods.errors.showError(reply);

  if (request.params.version) {
    return reply.redirect('/package/' + request.params.package)
  }

  var opts = {
    user: request.auth.credentials,
    namespace: 'registry-package'
  }

  request.timing.type = 'pageload';
  request.metrics.metric({ name: 'showPackage', package: request.params.package, value: 1 });

  opts.name = request.params.package

  if (opts.name !== encodeURIComponent(opts.name)) {
    return showError([opts.name, encodeURIComponent(opts.name)], 400, 'Invalid Package Name', opts);
  }

  getPackage(opts.name, function (er, pkg) {

    if (er || pkg.error) {

      request.logger.error(er, 'fetching package ' + opts.name);

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

      request.timing.page = 'showUnpublishedPackage';

      return reply.view('registry/unpublished-package-page', opts);
    }

    // on the package page, we should not load dependent package-data,
    // this is too slow!

    request.timing.browse_start = Date.now();

    getBrowseData({type: 'depended', noPackageData: true}, opts.name, 0, 1000, function (er, dependents) {

      request.metrics.metric({
        name:   'latency',
        value:  Date.now() - request.timing.browse_start,
        type:   'couchdb',
        browse: 'depended'
      });

      if (er) {
        request.logger.error(er, 'getting depended browse data; package=' + opts.name);
        // TODO think about this error
        return showError(er, 500, 'Unable to get depended data from couch for ' + opts.name, opts);
      }

      pkg.dependents = dependents;

      presentPackage(pkg, function (er, cleanedPackage) {
        if (er) {
          // TODO think about this error
          request.logger.error(er, 'presentPackage() responded with error; package=' + opts.name);
          return showError(er, 500, 'An error occurred with presenting package ' + opts.name, opts);
        }

        cleanedPackage.isStarred = opts.user && cleanedPackage.users && cleanedPackage.users[opts.user.name] || false;

        opts.package = cleanedPackage;
        opts.title = cleanedPackage.name;

        // Show download count for the last day, week, and month
        return getAllDownloadsForPackage(cleanedPackage.name, handleDownloads);

        // TODO consider refactoring
        function handleDownloads(er, downloadData) {
          if (er) {
            // TODO think about this error
            request.logger.error(er, 'getAllDownloadsForPackage(); package=' + opts.name);
            return showError(er, 500, 'An error occurred with getting download counts for ' + opts.name, opts);
          }

          opts.package.downloads = downloadData

          request.timing.page = 'showPackage';

          return reply.view('registry/package-page', opts);
        }
      })
    })
  })
}
