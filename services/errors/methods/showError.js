var Hapi = require('hapi');

module.exports = function showError (request, reply) {

  return function (err, code, message, opts) {

    var error;
    var template;

    switch (code) {
      case 400:
        template = 'errors/invalid';
        break;
      case 403:
        template = 'errors/internal';
        break;
      case 404:
        template = 'errors/not-found';
        break;
      case 500:
      default:
        template = 'errors/internal';
        break;
    }

    if (code === 404 && opts.name) {
      template = 'errors/registry-not-found';
    }

    if (opts.isXhr) {
      return reply(message + ' - ' + opts.errId).code(code);
    }

    return reply.view(template, opts).code(code);
  }
}
