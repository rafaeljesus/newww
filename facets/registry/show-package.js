var async = require('async'),
    Hapi = require('hapi'),
    presentPackage = require('./presenters/package'),
    validatePackageName = require('validate-npm-package-name');

module.exports = function (request, reply) {
  var getPackage = request.server.methods.registry.getPackage,
      getDownloadData = request.server.methods.downloads.getAllDownloadsForPackage;

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

// Add package to view context if path is a valid package name
      if (validatePackageName(opts.name).valid)
        opts.package = {name: opts.name};

      opts.package = { name: opts.name };
      return reply.view('errors/internal', opts).code(500);
    }

    if (!pkg) {
      opts.package = { name: opts.name }
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

    var tasks = {
      dependents: function(cb) { fetchDependents(request, opts.name, cb); },
      downloads: function(cb) { getDownloadData(opts.name, cb); },
    };

    async.parallel(tasks, function(err, results) {

      if (err) {
        // this really shouldn't happen! but we defend against it if it does.
        pkg.dependents = [];
        pkg.downloads = false;
      } else {
        pkg.downloads = results.downloads[0];
        pkg.dependents = results.dependents;
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
        reply.view('registry/package-page', opts);
      });
    });
  });
}

function fetchDependents(request, name, callback) {

  var getBrowseData = request.server.methods.registry.getBrowseData;
  var results = [];
  request.timing.browse_start = Date.now();

  getBrowseData({type: 'depended', noPackageData: true}, name, 0, 1000, function (er, dependents) {

    request.metrics.metric({
      name:   'latency',
      value:  Date.now() - request.timing.browse_start,
      type:   'couchdb',
      browse: 'depended'
    });

    if (er) {
      var msg = 'getting depended browse data; package=' + name;
      request.logger.error(er, msg);
      request.metrics.metric({
        name:    'error',
        message: msg,
        value:   1,
        type:    'couchdb'
      });
    } else {
      results = dependents;
    }

    callback(null, results);
  });
}
