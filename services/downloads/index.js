var Hapi = require('hapi'),
    request = require('request'),
    log = require('bole')('downloads'),
    uuid = require('node-uuid'),
    SECOND = 1000;

exports.register = function Downloads (service, options, next) {

  service.method('getDownloadsForPackage', getDownloads(options.url), {
    cache: {
      staleTimeout: 1 * SECOND, // don't wait more than a second for fresh data
      staleIn: 60 * 60 * SECOND, // refresh after an hour
      segment: '##packagedownloads'
    }
  });

  service.method('getAllDownloadsForPackage', getAllDownloads(options.url), {
    cache: {
      staleTimeout: 1 * SECOND, // don't wait more than a second for fresh data
      staleIn: 60 * 60 * SECOND, // refresh after an hour
      segment: '##packagedownloadsall'
    }
  });

  service.method('getAllDownloads', getAllDownloads(options.url), {
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
    var endpoint = url + detail + '/' + period + '/' + (package || '');

    request.get({
      url: endpoint,
      json: true
    }, function (err, resp, body) {
      if (body.error) {
        log.warn(uuid.v1() + ' ' + Hapi.error.internal('error downloading from ' + endpoint), err);
        err = body;
      }

      return next(err, body.downloads || 0);
    });
  };
}

function getAllDownloads (url) {
  return function (package, next) {
    if (typeof package === 'function') {
      next = package;
      package = null;
    }

    var n = 3,
        dls = {};

    getDownloads(url)('last-day', 'point', package, cb('day'));
    getDownloads(url)('last-week', 'point', package, cb('week'));
    getDownloads(url)('last-month', 'point', package, cb('month'));

    function cb (which) {
      return function (err, data) {
        if (err) {
          log.warn(uuid.v1() + ' ' + Hapi.error.internal('download error for ' + which), err);
        }

        dls[which] = data || 0;

        if (--n === 0) {
          timer.end = Date.now();
          addMetric({
            name: 'latency',
            value: timer.end - timer.start,
            type: 'downloads',
            action: 'all downloads' + (package ? ' for ' + package : '')
          });

          next(null, dls);
        }

      }
    }
  }
}
