var customer = module.exports = {};
var User = require('../models/user');
var utils = require('../lib/utils');

customer.getBillingInfo = function (request, reply) {

  if (!request.features.billing_page) {
    return reply.view('errors/not-found').code(404);
  }

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

    request.customer.getSubscriptions(function (err, subscriptions) {
      if (err) {
        request.logger.error('unable to get subscriptions for ' + request.loggedInUser.name);
        request.logger.error(err);
        subscriptions = [];
      }

      opts.subscriptions = subscriptions;

      return reply.view('user/billing', opts);
    });
  });
};

customer.updateBillingInfo = function(request, reply) {
  if (!request.features.billing_page) {
    return reply.view('errors/not-found').code(404);
  }

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

    sendToHubspot(process.env.HUBSPOT_FORM_PRIVATE_NPM_SIGNUP, data, function (er) {
      if (er) {
        request.logger.error('unable to send billing email to HubSpot');
        request.logger.error(er);
      }

      return reply.redirect('/settings/billing?updated=1');
    });
  });

};

customer.deleteBillingInfo = function(request, reply) {

  if (!request.features.billing_page) {
    return reply.view('errors/not-found').code(404);
  }

  request.customer.del(function(err, customer) {
    if (err) {
      request.logger.error("unable to delete billing info for " + customer);
      request.logger.error(err);
      return reply.view('errors/internal').code(500);
    }
    return reply.redirect('/settings/billing?canceled=1');
  });
};

var plans = {
  private_modules: 'npm-paid-individual-user-7',
  orgs: 'npm-paid-org-6'
};

customer.subscribe = function (request, reply) {
  var planType = request.payload.planType;

  var planInfo = {
    plan: plans[planType]
  };

  if (planType === 'orgs') {
    planInfo.npm_org = request.payload.orgName;
  }

  // don't do this for only private modules
  new User().getOrg(planInfo.npm_org)
    .then(function (users) {
      // first check to see if the user is the super-admin
      // notify the user that this org already exists
    })
    .catch(function (err) {
      if (err.statusCode === 404) {
        // org doesn't yet exist
        request.customer.createSubscription(planInfo, function (err, subscriptions) {
          if (err) {
            request.logger.error("unable to update subscription to " + planInfo.plan);
            request.logger.error(err);
          }

          if (typeof subscriptions === 'string') {
            request.logger.info("created subscription: ", planInfo);
          }

          return reply.redirect('/settings/billing');
        });
      } else {
        // do actual error handling here
        request.logger.error(err);
        return reply.redirect('/settings/billing');
      }
    });

};
