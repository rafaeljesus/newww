var transform = require('./presenters/profile').transform,
    Hapi = require('hapi'),
    Joi = require('joi'),
    log = require('bole')('billing'),
    metrics = require('newww-metrics')();

module.exports = function (options) {
  return function (request, reply) {
    var billing = request.server.methods.user.billing;
    var showError = request.server.methods.errors.showError(reply);
    var opts = {
      user: transform(request.auth.credentials, options),
      namespace: 'billing',
      title: 'Billing',
    }

    console.log("WAT")

    if (request.method === 'get' || request.method === 'head') {
      console.log("WHOOPP")
      return reply.view('user/billing', opts);
    }
  }
}
