var Hapi = require('hapi'),
    anonCouch = require('../../../adapters/couchDB').anonCouch,
    log = require('bole')('registry-get-package'),
    metrics = require('../../adapters/metrics')();

module.exports = function getPackage (package, next) {

  var timer = {start: Date.now()};
  anonCouch.get('/registry/' + package, function (er, cr, data) {
    log.info('fetched ' + package + ' from the registry');
    timer.end = Date.now();

    metrics.addCouchLatencyMetric(timer, 'package ' + package);

    if (er || data.error) {
      return next(Hapi.error.notFound('Package not found: ' + package));
    }

    return next(null, data);
  });
}
