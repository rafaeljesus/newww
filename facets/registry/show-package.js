var moment = require('moment'),
    validatePackageName = require('validate-npm-package-name');

function showPackage(request, reply) {
  var getDownloadData = request.server.methods.downloads.getAllDownloadsForPackage;

  var loggedInUser = request.auth.credentials;
  var Package = new request.server.models.Package({
    bearer: loggedInUser && loggedInUser.name,
    request: request
  });

  var opts = { };

  request.timing.page = 'showPackage';
  request.metrics.metric({ name: 'showPackage', package: request.params.package, value: 1 });

  opts.name = request.params.package;

  Package.get(opts.name, function (er, pkg) {

    opts.package = { name: opts.name };
    if (er) {
      request.logger.error(er, 'fetching package ' + opts.name);
      return reply.view('errors/internal', opts).code(500);
    }

    if (!pkg) {
      if (!validatePackageName(opts.name).valid) {
        delete opts.package; // to suppress the encouraging message
        request.logger.info('request for invalid package name: ' + opts.name);
        reply.view('errors/not-found', opts).code(404);
        return;
      }

      return reply.view('errors/not-found', opts).code(404);
    }

    if (pkg.time && pkg.time.unpublished) {

      var t = pkg.time.unpublished.time;
      pkg.unpubFromNow = moment(t).format('ddd MMM DD YYYY HH:mm:ss Z');
      opts.package = pkg;
      request.timing.page = 'showUnpublishedPackage';

      return reply.view('registry/unpublished-package-page', opts).code(410);
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

      pkg.isStarred = loggedInUser && pkg.stars && pkg.stars.indexOf(loggedInUser.name) !== -1 || false;
      opts.package = pkg;
      opts.title = pkg.name;
      reply.view('registry/package-page', opts);
    });
  });
}

module.exports = showPackage;
