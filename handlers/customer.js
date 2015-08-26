var customer = module.exports = {};
var Org = require('../agents/org');
var utils = require('../lib/utils');

customer.getBillingInfo = function(request, reply) {

  var opts = {
    title: 'Billing',
    updated: ('updated' in request.query),
    canceled: ('canceled' in request.query),
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
    features: {
      orgs: request.features.org_billing
    }
  };

  // Display a message to unpaid collaborators about the
  // package they could be accessing if they paid for it
  if (request.query.package) {
    opts.package = request.query.package;
  }

  request.customer.getStripeData(function(err, customer) {

    if (customer) {
      opts.customer = customer;
    }

    request.customer.getSubscriptions(function(err, subscriptions) {
      if (err) {
        request.logger.error('unable to get subscriptions for ' + request.loggedInUser.name);
        request.logger.error(err);
        subscriptions = [];
      }

      request.customer.getLicensesFromSubscriptions(subscriptions, function(err, licenses) {

        var subs = subscriptions.map(function(sub) {
          sub.license = licenses.filter(function(license) {
            return license.id === sub.license_id;
          })[0];
          return sub;
        });

        var privateModules = [],
          orgs = [];

        subs.forEach(function(sub) {
          sub.cost = (sub.amount / 100) * sub.quantity;
          if (sub.privateModules) {
            privateModules.push(sub);
          } else {
            orgs.push(sub);
          }
        });


        opts.totalCost = subs.map(function(sub) {
          return sub.cost;
        }).reduce(function(prev, curr) {
          return prev + curr;
        });

        opts.privateModules = privateModules;
        opts.orgs = orgs;

        return reply.view('user/billing', opts);
      });
    });
  });
};

customer.updateBillingInfo = function(request, reply, callback) {
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

    sendToHubspot(process.env.HUBSPOT_FORM_PRIVATE_NPM_SIGNUP, data, function(er) {
      if (er) {
        request.logger.error('unable to send billing email to HubSpot');
        request.logger.error(er);
      }

      if (callback) {
        return callback(er);
      }

      return reply.redirect('/settings/billing?updated=1');
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

var plans = {
  private_modules: 'npm-paid-individual-user-7',
  orgs: 'npm-paid-org-7'
};

customer.subscribe = function(request, reply) {
  var planType = request.payload.planType;

  var planInfo = {
    plan: plans[planType]
  };

  if (planType === 'orgs' && !request.features.org_billing) {
    return reply.redirect('/settings/billing');
  }

  if (request.features.org_billing && planType === 'orgs') {
    planInfo.npm_org = request.payload.orgName;
    var opts = {};

    Org(request.loggedInUser.name)
      .get(planInfo.npm_org, function(err, users) {
        if (users) {
          opts.errors = [];
          opts.errors.push(new Error("Error: Org already exists."));
          return reply.view('user/billing', opts);
        }

        if (err.statusCode === 404) {
          // org doesn't yet exist
          request.customer.createSubscription(planInfo, function(err, subscriptions) {
            if (err) {
              request.logger.error("unable to update subscription to " + planInfo.plan);
              request.logger.error(err);
            }

            if (typeof subscriptions === 'string') {
              request.logger.info("created subscription: ", planInfo);
            }

            Org(request.loggedInUser.name)
              .create(planInfo.npm_org, function(err, opts) {
                if (err) {
                  return reply.view('errors/internal', err);
                }

                return reply.redirect('/settings/billing', opts);
              });

          });
        } else {
          // do actual error handling here
          opts.errors = [];
          opts.errors.push(new Error(err));
          request.logger.error(err);
          return reply.view('user/billing', opts);
        }
      });
  } else {
    customer.updateBillingInfo(request, reply, function(err) {
      request.customer.createSubscription(planInfo, function(err, subscriptions) {
        if (err) {
          request.logger.error("unable to update subscription to " + planInfo.plan);
          request.logger.error(err);
        }

        if (typeof subscriptions === 'string') {
          request.logger.info("created subscription: ", planInfo);
        }

        return reply.redirect('/settings/billing?updated=1');
      });
    });

  }

};

