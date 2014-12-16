var Hapi = require('hapi'),
    anonCouch = require('../../../adapters/couchDB').anonCouch,
    log = require('bole')('registry-get-package'),
    metrics = require('../../../adapters/metrics')();

module.exports = function getPackage(package, callback) {

  var start = Date.now();
  anonCouch.get('/registry/' + package, function (er, response, data) {

    metrics.metric({
      name:   'latency',
      value:  Date.now() - start,
      type:   'couchdb',
      browse: 'package ' + package,
      code:   response ? response.statusCode : 0
    });

    if (er) {
      log.error(er, 'fetching package from couchdb; package=' + package);
      return callback(er);
    }

    if (response.statusCode === 404) {
      return callback();
    }

    if (response.statusCode === 200) {
      log.info('fetched ' + package + ' from the registry');
      return callback(null, data);
    }

    log.info('unexpected status code from registry; status=' + response.statusCode + '; package=' + package);
    callback(new Error('status code ' + response.statusCode));
  });
}
