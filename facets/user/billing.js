var transform = require('./presenters/profile').transform,
    Hapi = require('hapi'),
    Joi = require('joi'),
    log = require('bole')('billing'),
    metrics = require('newww-metrics')();

var licenseAPI = new (require('../../lib/license-api'))();

var billing = module.exports = {}

billing.getBillingInfo = function (request, reply) {
  var opts = {
    namespace: 'billing',
    title: 'Billing',
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY
  }

  licenseAPI.getUser(request.auth.credentials.name, function(err, resp, body) {
    if (resp && resp.statusCode == 200) {
      opts.customer = body
    }
    return reply.view('user/billing', opts);
  })
}

billing.createBillingInfo = function(request, reply) {

}

billing.updateBillingInfo = function(request, reply) {

}
