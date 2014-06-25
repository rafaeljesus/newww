var Hapi = require('hapi'),
    presentPackage = require('./presenters/package'),
    log = require('bole')('registry-package'),
    uuid = require('node-uuid');


module.exports = function (request, reply) {
  var getPackageFromCouch = request.server.methods.getPackageFromCouch;
  var getBrowseData = request.server.methods.getBrowseData;

  var nameInfo = parseName(request.params.package)
  var version = nameInfo.version || 'latest'

  var opts = {
    user: request.auth.credentials
  }

  if (nameInfo.name !== encodeURIComponent(nameInfo.name)) {
    opts.errorType = 'invalid';
    opts.errId = uuid.v1();
    opts.name = nameInfo.name;

    log.error(opts.errId + ' ' + Hapi.error.badRequest('Invalid Package Name'), opts.name);

    return reply.view('error', opts).code(400)
  }

  getPackageFromCouch(couchLookupName(nameInfo), function (er, pkg) {
    if (er || pkg.error) {
      opts.errorType = 'notFound';
      opts.errId = uuid.v1();
      opts.name = nameInfo.name;

      log.error(opts.errId + ' ' + Hapi.error.notFound('Package Not Found ' + opts.name), er || pkg.error);

      return reply.view('error', opts).code(404)
    }

    if (pkg.time && pkg.time.unpublished) {
      // reply with unpublished package page
      var t = pkg.time.unpublished.time
      pkg.unpubFromNow = require('moment')(t).format('ddd MMM DD YYYY HH:mm:ss Z');

      opts.package = pkg;
      return reply.view('unpublished-package-page', opts);
    }

    getBrowseData('depended', nameInfo.name, 0, 1000, function (er, dependents) {
      if (er) {
        opts.errId = uuid.v1();
        opts.errorType = 'internal';
        log.error(opts.errId + ' ' + Hapi.error.internal('Unable to get depended data from couch for ' + nameInfo.name), er);

        return reply.view('error', opts).code(500);
      }

      pkg.dependents = dependents;

      presentPackage(pkg, function (er, pkg) {
        if (er) {
          opts.errId = uuid.v1();
          opts.errorType = 'internal';
          log.error(opts.errId + ' ' + Hapi.error.internal('An error occurred with presenting package ' + pkg.name), er);
          return reply.view('error', opts).code(500);
        }

        opts.package = pkg;
        opts.title = pkg.name;

        reply.view('package-page', opts);
      })
    })
  })
}

function parseName (params) {
  var name, version;

  if (typeof params === 'object') {
    name = params.name;
    version = params.version;
  } else {
    var p = params.split('@');
    name = p.shift();
    version = p.join('@');
  }

  version = version || '';

  return {name: name, version: version};
}

function couchLookupName (nameInfo) {
  var name = nameInfo.name;

  if (nameInfo.version) {
    name += '/' + version;
  }

  return name;
}

