var Hapi = require('hapi'),
    uuid = require('node-uuid'),
    log = require('bole'),
    metrics = require('newww-metrics')();

module.exports = function generateError (opts, message, code, logExtras, cb) {

  if (typeof logExtras === 'function') {
    cb = logExtras;
    logExtras = '';
  }

  opts.errId = uuid.v1();
  opts.code = code || 500;

  var error;
  switch (code) {
    case 400: error = Hapi.error.badRequest(message); break;
    case 403: error = Hapi.error.forbidden(message); break;
    case 404: error = Hapi.error.notFound(message); break;
    default: error = Hapi.error.internal(message); break;
  }


  metrics.addMetric({name: 'error', type: opts.errorType, message: message, value: 1, code: opts.code});

  log(opts.namespace).error(opts.errId + ' ' + error, logExtras);

  return cb(opts);
}