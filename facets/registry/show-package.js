var Hapi = require('hapi'),
    presentPackage = require('./presenters/package'),
    log = require('bole')('registry-package'),
    commaIt = require('number-grouper'),
    uuid = require('node-uuid'),
    metrics = require('../../adapters/metrics')();


module.exports = function (request, reply) {
  var getPackage = request.server.methods.registry.getPackage,
      getBrowseData = request.server.methods.registry.getBrowseData,
      addMetric = metrics.addMetric,
      addLatencyMetric = metrics.addPageLatencyMetric,
      getDownloadsForPackage = request.server.methods.downloads.getDownloadsForPackage,
      getAllDownloadsForPackage = request.server.methods.downloads.getAllDownloadsForPackage;

  var timer = { start: Date.now() };

  if (request.params.version) {
    reply.redirect('/package/' + request.params.package)
  }

  var opts = {
    user: request.auth.credentials,
    hiring: request.server.methods.hiring.getRandomWhosHiring()
  }

  opts.name = request.params.package

  if (opts.name !== encodeURIComponent(opts.name)) {
    opts.errorType = 'invalid';
    opts.errId = uuid.v1();

    log.error(opts.errId + ' ' + Hapi.error.badRequest('Invalid Package Name'), opts.name);

    return reply.view('error', opts).code(400)
  }

  getPackage(opts.name, function (er, pkg) {

    if (er || pkg.error) {
      opts.errorType = 'notFound';
      opts.errId = uuid.v1();

      log.error(opts.errId + ' ' + Hapi.error.notFound('Package Not Found ' + opts.name), er || pkg.error);

      return reply.view('error', opts).code(404)
    }

    if (pkg.time && pkg.time.unpublished) {
      // reply with unpublished package page
      var t = pkg.time.unpublished.time
      pkg.unpubFromNow = require('moment')(t).format('ddd MMM DD YYYY HH:mm:ss Z');

      opts.package = pkg;

      timer.end = Date.now();
      addLatencyMetric(timer, 'showUnpublishedPackage');

      addMetric({ name: 'showPackage', package: request.params.package });
      return reply.view('unpublished-package-page', opts);
    }

    timer.start = Date.now();
    getBrowseData('depended', opts.name, 0, 1000, function (er, dependents) {
      timer.end = Date.now();
      addMetric({
        name: 'latency',
        value: timer.end - timer.start,
        type: 'couchdb',
        browse: ['depended', opts.name, 0, 1000].join(', ')
      });

      if (er) {
        opts.errId = uuid.v1();
        opts.errorType = 'internal';
        log.error(opts.errId + ' ' + Hapi.error.internal('Unable to get depended data from couch for ' + opts.name), er);

        return reply.view('error', opts).code(500);
      }

      pkg.dependents = dependents;

      presentPackage(pkg, function (er, pkg) {
        if (er) {
          opts.errId = uuid.v1();
          opts.errorType = 'internal';
          log.error(opts.errId + ' ' + Hapi.error.internal('An error occurred with presenting package ' + opts.name), er);
          return reply.view('error', opts).code(500);
        }

        pkg.isStarred = opts.user && pkg.users[opts.user.name] || false;

        opts.package = pkg;
        opts.title = pkg.name;

        // Show download count for the last day, week, and month
        if (opts.user) {
          return getDownloadsForPackage('last-month', 'range', pkg.name, handleDownloads);
        } else {
          return getAllDownloadsForPackage(pkg.name, handleDownloads);
        }

        function handleDownloads(er, downloadData) {
          if (er) {
            opts.errId = uuid.v1();
            opts.errorType = 'internal';
            log.error(opts.errId + ' ' + Hapi.error.internal('An error occurred with getting download counts for ' + opts.name), er);
            return reply.view('error', opts).code(500);
          }

          if (Array.isArray(downloadData)) {
            opts.downloads = {
              data: JSON.stringify(downloadData),
              count: commaIt(downloadData[downloadData.length - 1].downloads, {sep: ' '})
            };
          } else {
            opts.downloads = {
              day: commaIt(downloadData.day, {sep: ' '}),
              week: commaIt(downloadData.week, {sep: ' '}),
              month: commaIt(downloadData.month, {sep: ' '}),
            };
          }

          timer.end = Date.now();
          addLatencyMetric(timer, 'showPackage');

          addMetric({ name: 'showPackage', package: request.params.package });
          return reply.view('package-page', opts);
        }
      })
    })
  })
}