var billing = module.exports = {};
var Customer = require("../models/customer").new();

billing.getBillingInfo = function (request, reply) {
  var opts = {
    namespace: 'billing',
    title: 'Billing',
    updated: ('updated' in request.query),
    canceled: ('canceled' in request.query),
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY
  };

  Customer.get(request.auth.credentials.name, function(err, customer) {

    if (customer) {
      opts.customer = customer;
    }
    return reply.view('user/billing', opts);
  });
};

billing.updateBillingInfo = function(request, reply) {
  var sendToHubspot = request.server.methods.npme.sendData;

  var billingInfo = {
    name: request.auth.credentials.name,
    email: request.auth.credentials.email,
    card: request.payload.stripeToken
  };

  Customer.update(billingInfo, function(err, customer) {
    if (err) {
      request.logger.error(err);
      return reply.view('errors/internal').code(500);
    }

    sendToHubspot(process.env.HUBSPOT_FORM_PRIVATE_NPM_SIGNUP, {email: billingInfo.email}, function (er) {
      if (er) {
        request.logger.error('unable to send billing email to HubSpot');
        request.logger.error(er);
      }

      return reply.redirect('/settings/billing?updated=1');
    });
  });

};

billing.deleteBillingInfo = function(request, reply) {
  Customer.del(request.auth.credentials.name, function(err, customer) {
    if (err) {
      request.logger.error(err);
      return reply.view('errors/internal').code(500);
    }
    return reply.redirect('/settings/billing?canceled=1');
  });
};
