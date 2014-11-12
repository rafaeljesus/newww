var Hapi = require('hapi'),
    uuid = require('node-uuid'),
    log = require('bole'),
    metrics = require('newww-metrics')();

module.exports = function showError (reply) {

  return function (err, code, message, opts) {
    opts.errId = uuid.v1();

    var error;
    var template;

    switch (code) {
      case 400:
        error = Hapi.error.badRequest(message);
        template = 'errors/invalid';
        break;
      case 403:
        error = Hapi.error.forbidden(message);
        template = 'errors/internal';
        break;
      case 404:
        error = Hapi.error.notFound(message);
        template = 'errors/not-found';
        break;
      case 500:
      default:
        error = Hapi.error.internal(message);
        template = 'errors/internal';
        break;
    }

    if (code === 404 && opts.name) {
      template = 'errors/registry-not-found';
    }

    metrics.addMetric({
      name: 'error',
      message: message,
      value: 1,
      code: code
    });

    log(opts.namespace).error(opts.errId + ' ' + error, err);

    if (opts.isXhr) {
      return reply(message + ' - ' + opts.errId).code(code);
    }

    return reply.view(template, opts).code(code);
  }
}