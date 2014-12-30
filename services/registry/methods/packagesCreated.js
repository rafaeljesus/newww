var Hapi = require('hapi'),
    anonCouch = require('../../../adapters/couchDB').anonCouch,
    log = require('bole')('registry-packages-created'),
    metrics = require('../../../adapters/metrics')();

module.exports = function packagesCreated (next) {
  var start = Date.now();

  log.info('looking up number of packages created');

  anonCouch.get('/registry/_design/app/_view/fieldsInUse?group_level=1&startkey="name"&endkey="name"&stale=update_after', function (er, cr, data) {

    metrics.metric({
      name: 'latency',
      value: Date.now() - start,
      type: 'couch',
      action: 'packagesCreated'
    });

    if (er || data.error) {
      return next(Hapi.error.internal(er || data.error));
    }

    if (data.rows && data.rows.length > 0 && data.rows[0].value) {
      return next(null, data.rows[0].value);
    }

    return next(null, 0); // worst case scenario
  });
};
