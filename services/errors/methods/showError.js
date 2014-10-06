var Hapi = require('hapi'),
    uuid = require('node-uuid'),
    log = require('bole'),
    metrics = require('newww-metrics')();

module.exports = function showError (reply) {

  return function (err, code, message, opts) {

    var errId = uuid.v1();

    var error;
    var template;

    switch (code) {
      case 400:
        error = Hapi.error.badRequest(message);
        template = 'errors/invalid';
        break;
      case 403:
        error = Hapi.error.forbidden(message);
        template = 'errors/invalid';
        break;
      case 404:
        error = Hapi.error.notFound(message);
        template = 'errors/notfound';
        break;
      default:
        error = Hapi.error.internal(message);
        template = 'errors/invalid';
        break;
    }


    metrics.addMetric({
      name: 'error',
      message: message,
      value: 1,
      code: code
    });

    log(opts.namespace).error(opts.errId + ' ' + error, err);

    if (opts.isXhr) {
      return reply(message + ' - ' + errId).code(code);
    }

    return reply.view(template, opts).code(code);
  }
}