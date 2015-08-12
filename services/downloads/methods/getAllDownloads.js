var async = require('async'),
  makeDownloadFetchFunc = require('./getDownloads'),
  metrics = require('../../../adapters/metrics')();

module.exports = function getAllDownloads(url) {
  return function(pkg, next) {
    var start = Date.now();

    if (typeof pkg === 'function') {
      next = pkg;
      pkg = null;
    }

    var getDownloads = makeDownloadFetchFunc(url);
    var dls = {};

    var tasks = {
      day: function(cb) {
        getDownloads('last-day', 'point', pkg, cb);
      },
      week: function(cb) {
        getDownloads('last-week', 'point', pkg, cb);
      },
      month: function(cb) {
        getDownloads('last-month', 'point', pkg, cb);
      },
    };

    async.parallel(tasks, function(err, results) {

      if (err) {
        return next();
      }

      metrics.metric({
        name: 'latency.downloads',
        value: Date.now() - start,
        package: pkg
      });

      dls.day = results.day || 0;
      dls.week = results.week || 0;
      dls.month = results.month || 0;

      next(null, dls);
    });
  };
};
