var Hapi = require('hapi'),
    presentPackage = require('./presenters/package');

module.exports = function (request, reply) {
  var getPackage = request.server.methods.registry.getPackage,
      getBrowseData = request.server.methods.registry.getBrowseData,
      getDownloadsForPackage = request.server.methods.downloads.getDownloadsForPackage,
      getAllDownloadsForPackage = request.server.methods.downloads.getAllDownloadsForPackage;

  if (request.params.version) {
    return reply.redirect('/package/' + request.params.package)
  }

  var opts = {
    user: request.auth.credentials,
    namespace: 'registry-package'
  }

  request.timing.page = 'showPackage';
  request.timing.type = 'pageload';
  request.metrics.metric({ name: 'showPackage', package: request.params.package, value: 1 });

  opts.name = request.params.package

  if (opts.name !== encodeURIComponent(opts.name)) {
    request.logger.info('request for invalid package name: ' + opts.name);
    reply.view('errors/invalid', opts).code(400);
    return;
  }

  getPackage(opts.name, function (er, pkg) {

    if (er) {
      request.logger.error(er, 'fetching package ' + opts.name);
      opts.package = {
        name: opts.name
      }
      return reply.view('errors/internal', opts).code(500);
    }

    if (!pkg) {
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
        var msg = 'getting depended browse data; package=' + opts.name;
        request.logger.error(er, msg);
        request.metrics.metric({
          name:    'error',
          message: msg,
          value:   1,
          type:    'couchdb'
        });
        pkg.dependents = [];
      } else {
        pkg.dependents = dependents;
      }

      presentPackage(pkg, function (er, cleanedPackage) {
        if (er) {
          request.logger.info(er, 'presentPackage() responded with error; package=' + opts.name);
          reply.view('errors/internal', opts).code(500);
          return;
        }

        cleanedPackage.isStarred = opts.user && cleanedPackage.users && cleanedPackage.users[opts.user.name] || false;
        opts.package = cleanedPackage;
        opts.title = cleanedPackage.name;

        return getAllDownloadsForPackage(cleanedPackage.name, function(er, downloadData) {
          if (er) {
            request.logger.info(er, 'getAllDownloadsForPackage(); package=' + opts.name);
            opts.package.downloads = false; // don't render them
          }
          else {
            opts.package.downloads = downloadData;
          }

          return reply.view('registry/package-page', opts);
        });
      });
    });
  });
};
