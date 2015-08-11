var customer = module.exports = {};
var utils = require('../lib/utils');

customer.getBillingInfo = function(request, reply) {

  var opts = {
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

  request.customer.get(function(err, customer) {

    if (customer) {
      opts.customer = customer;
    }
    return reply.view('user/billing', opts);
  });
};

customer.updateBillingInfo = function(request, reply) {
  var sendToHubspot = request.server.methods.npme.sendData;

  var coupon = request.payload.coupon;

  var billingInfo = {
    name: request.loggedInUser.name,
    email: request.loggedInUser.email,
    card: request.payload.stripeToken,
  };

  if (coupon) {
    billingInfo.coupon = coupon.toLowerCase();
  }

  request.customer.updateBilling(billingInfo, function(err) {
    var opts = {};

    if (err) {
      opts.errors = [];
      opts.errors.push(new Error(err));
      return reply.view('user/billing', opts);
    }

    var data = {
      hs_context: {
        pageName: "customer-billing-update",
        ipAddress: utils.getUserIP(request)
      },
      email: billingInfo.email
    };

    var planInfo = {
      plan: 'npm-paid-individual-user-7'
    };

    request.customer.createSubscription(planInfo, function(err, unused) {

      if (err) {
        request.logger.error("unable to update subscription to " + planInfo.plan);
        request.logger.error(err);
      }

      sendToHubspot(process.env.HUBSPOT_FORM_PRIVATE_NPM_SIGNUP, data, function(er) {
        if (er) {
          request.logger.error('unable to send billing email to HubSpot');
          request.logger.error(er);
        }

        return reply.redirect('/settings/billing?updated=1');
      });
    });
  });

};

customer.deleteBillingInfo = function(request, reply) {

  request.customer.del(function(err, customer) {
    if (err) {
      request.logger.error("unable to delete billing info for " + customer);
      request.logger.error(err);
      return reply.view('errors/internal').code(500);
    }
    return reply.redirect('/settings/billing?canceled=1');
  });
};