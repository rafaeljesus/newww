var Hapi = require('hapi'),
    request = require('request'),
    log = require('bole')('downloads'),
    SECOND = 1000;

exports.register = function Downloads (service, options, next) {

  service.method('getDownloadsForPackage', getDownloads(options.url), {
    cache: {
      staleTimeout: 1 * SECOND, // don't wait more than a second for fresh data
      staleIn: 60 * 60 * SECOND, // refresh after an hour
      segment: '##downloads'
    }
  });

  service.method('getAllDownloads', getDownloads(options.url), {
    cache: {
      staleTimeout: 1 * SECOND, // don't wait more than a second for fresh data
      staleIn: 60 * 60 * SECOND, // refresh after an hour
      segment: '##alldownloads'
    }
  });

  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};

function getDownloads (url) {
  return function (period, detail, package, next) {
    if (typeof package === 'function') {
      next = package;
      package = null;
    }

    var endpoint = url + detail + '/' + period + '/' + (package || '');

    request.get({
      url: endpoint,
      json: true
    }, function (err, resp, body) {
      if (body.error) {
        err = body;
      }

      return next(err, body.downloads || 0);
    });
  };
}
