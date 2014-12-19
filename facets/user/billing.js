var transform = require('./presenters/profile').transform,
    Hapi = require('hapi'),
    Joi = require('joi'),
    log = require('bole')('billing'),
    metrics = require('newww-metrics')();

var Customer = new (require('../../lib/customer-api'))();
var billing = module.exports = {};

billing.getBillingInfo = function (request, reply) {
  var opts = {
    namespace: 'billing',
    title: 'Billing',
    updated: ('updated' in request.query),
    canceled: ('canceled' in request.query),
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY
  };

  Customer.get(request.auth.credentials.name, function(err, resp, body) {
    if (resp && resp.statusCode == 200) {
      opts.customer = body;
    }
    return reply.view('user/billing', opts);
  });
}

billing.updateBillingInfo = function(request, reply) {
  var showError = request.server.methods.errors.showError(reply);

  var billingInfo = {
    name: request.auth.credentials.name,
    email: request.auth.credentials.email,
    card: request.payload.stripeToken
  }

  Customer.update(billingInfo, function(err, resp, body) {
    if (err) return showError(err);
    if (resp && resp.statusCode == 200) {
      return reply.redirect('/settings/billing?updated=1')
    }
  })

}

billing.deleteBillingInfo = function(request, reply) {
  var showError = request.server.methods.errors.showError(reply);

  Customer.del(request.auth.credentials.name, function(err, resp, body) {
    if (err) return showError(err);
    if (resp && resp.statusCode == 200) {
      return reply.redirect('/settings/billing?canceled=1')
    }
  })
}
