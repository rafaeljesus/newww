var Hapi = require('hapi'),
    uuid = require('node-uuid'),
    log = require('bole'),
    metrics = require('newww-metrics')(),
    fmt = require('util').format;

module.exports = function generateWarning (namespace, message, logExtras) {

  metrics.addMetric({name: 'warning', message: message, value: 1, code: 500});

  var warning = fmt('%s %s', uuid.v1(), Hapi.error.internal(message));

  log(opts.namespace).warn(warning, logExtras);
}