var
    async = require('async'),
    makeDownloadFetchFunc = require('./getDownloads'),
    metrics = require('../../../adapters/metrics')();

module.exports = function getAllDownloads (url) {
  return function (package, next) {
    var start = Date.now();

    if (typeof package === 'function') {
      next = package;
      package = null;
    }

    var getDownloads = makeDownloadFetchFunc(url);
    var dls = {};

    var tasks = {
      day:   function(cb) { getDownloads('last-day', 'point', package, cb); },
      week:  function(cb) { getDownloads('last-week', 'point', package, cb); },
      month: function(cb) { getDownloads('last-month', 'point', package, cb); },
    };

    async.parallel(tasks, function(err, results) {

      if (err) {
        return next();
      }

      metrics.metric({
        name: 'latency.downloads',
        value: Date.now() - start,
        package: package
      });

      dls.day = results.day || 0;
      dls.week = results.week || 0;
      dls.month = results.month || 0;

      next(null, dls);
    });
  };
};
