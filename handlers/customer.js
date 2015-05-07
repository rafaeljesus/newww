var billing = module.exports = {};
var Customer = require("../models/customer").new();

billing.getBillingInfo = function (request, reply) {

  if (!request.features.billing_page) {
    return reply.view('errors/not-found').code(404);
  }

  var opts = {
    namespace: 'billing',
    title: 'Billing',
    updated: ('updated' in request.query),
    canceled: ('canceled' in request.query),
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY
  };

  // Display a message to unpaid collaborators about the
  // package they could be accessing if they paid for it
  if (request.query.package) {
    opts.package = request.query.package;
  }

  Customer.get(request.loggedInUser.name, function(err, customer) {

    if (customer) {
      opts.customer = customer;
    }
    return reply.view('user/billing', opts);
  });
};

billing.updateBillingInfo = function(request, reply) {

  if (!request.features.billing_page) {
    return reply.view('errors/not-found').code(404);
  }

  var sendToHubspot = request.server.methods.npme.sendData;

  var billingInfo = {
    name: request.loggedInUser.name,
    email: request.loggedInUser.email,
    card: request.payload.stripeToken
  };

  Customer.update(billingInfo, function(err, customer) {
    var opts = {};

    if (err) {
      opts.errors = [];
      opts.errors.push(new Error(err));
      return reply.view('user/billing', opts);
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

  if (!request.features.billing_page) {
    return reply.view('errors/not-found').code(404);
  }

  Customer.del(request.loggedInUser.name, function(err, customer) {
    if (err) {
      request.logger.error("unable to delete billing info for " + customer);
      request.logger.error(err);
      return reply.view('errors/internal').code(500);
    }
    return reply.redirect('/settings/billing?canceled=1');
  });
};
