var Hapi = require('hapi'),
    request = require('request'),
    log = require('bole')('downloads'),
    uuid = require('node-uuid'),
    SECOND = 1000;

var timer = {};

exports.register = function Downloads (service, options, next) {

  service.dependency('newww-service-metrics', after);

  function after (service, next) {
    var addMetric = service.methods.addMetric;

    service.method('downloads.getDownloadsForPackage', getDownloads(options.url, addMetric), {
      cache: {
        staleTimeout: 1 * SECOND, // don't wait more than a second for fresh data
        staleIn: 60 * 60 * SECOND, // refresh after an hour
        segment: '##packagedownloads'
      }
    });

    service.method('downloads.getAllDownloadsForPackage', getAllDownloads(options.url, addMetric), {
      cache: {
        staleTimeout: 1 * SECOND, // don't wait more than a second for fresh data
        staleIn: 60 * 60 * SECOND, // refresh after an hour
        segment: '##packagedownloadsall'
      }
    });

    service.method('downloads.getAllDownloads', getAllDownloads(options.url, addMetric), {
      cache: {
        staleTimeout: 1 * SECOND, // don't wait more than a second for fresh data
        staleIn: 60 * 60 * SECOND, // refresh after an hour
        segment: '##alldownloads'
      }
    });

    next();
  }
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};

function getDownloads (url, addMetric) {
  return function (period, detail, package, next) {
    timer.start = Date.now();
    var endpoint = url + detail + '/' + period + '/' + (package || '');

    request.get({
      url: endpoint,
      json: true
    }, function (err, resp, body) {
      if (body.error) {
        log.warn(uuid.v1() + ' ' + Hapi.error.internal('error downloading from ' + endpoint), err);
        err = body;
      }

      timer.end = Date.now();
      addMetric({
        name: 'latency',
        value: timer.end - timer.start,
        type: 'downloads',
        action: endpoint
      });

      return next(err, body.downloads || 0);
    });
  };
}

function getAllDownloads (url, addMetric) {
  return function (package, next) {
    timer.start = Date.now();
    if (typeof package === 'function') {
      next = package;
      package = null;
    }

    var n = 3,
        dls = {};

    getDownloads(url, addMetric)('last-day', 'point', package, cb('day'));
    getDownloads(url, addMetric)('last-week', 'point', package, cb('week'));
    getDownloads(url, addMetric)('last-month', 'point', package, cb('month'));

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
