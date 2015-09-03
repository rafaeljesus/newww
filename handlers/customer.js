var customer = module.exports = {};
var Joi = require('joi');
var Org = require('../agents/org');
var utils = require('../lib/utils');
var validate = require('validate-npm-package-name');

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

  request.customer.getById(request.loggedInUser.email, function(err, cust) {

    request.customer.getStripeData(function(err, customer) {

      if (customer) {
        opts.customer = customer;
        opts.customer.customer_id = cust && cust.stripe_customer_id;
      }

      request.customer.getSubscriptions(function(err, subscriptions) {
        if (err) {
          request.logger.error('unable to get subscriptions for ' + request.loggedInUser.name);
          request.logger.error(err);
          subscriptions = [];
        }
        var subs = subscriptions.filter(function(sub) {
          return sub.status === "active";
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
        }, 0);

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

var subscriptionSchema = {
  planType: Joi.string().valid(Object.keys(plans)).required(),
  stripeToken: Joi.string(),
  coupon: Joi.string().optional().allow(''),
  fullname: Joi.string().optional().allow(''),
  orgScope: Joi.string().when('planType', {
    is: 'orgs',
    then: Joi.required()
  }),
  "paid-org-type": Joi.string().optional(),
  "card-number": Joi.string().optional(),
  "card-cvc": Joi.string().optional(),
  "card-exp-month": Joi.string().optional(),
  "card-exp-year": Joi.string().optional()
};

customer.subscribe = function(request, reply) {
  Joi.validate(request.payload, subscriptionSchema, function(err, planData) {
    if (err) {
      var notices = err.details.map(function(e) {
        return e.message;
      });
      return reply.view('org/create', {
        stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
        notices: notices
      });
    }

    var planType = planData.planType;
    var planInfo = {
      plan: plans[planType]
    };

    if (planType === 'orgs' && !request.features.org_billing) {
      return reply.redirect('/settings/billing');
    }

    if (request.loggedInUser.customer) {
      subscribe();
    } else {
      customer.updateBillingInfo(request, reply, subscribe);
    }

    function subscribe() {
      if (request.features.org_billing && planType === 'orgs') {
        planInfo.npm_org = planData.orgScope;

        // check if the org name works as a package name
        var valid = validate('@' + planInfo.npm_org + '/foo');

        if (!valid.errors) {
          // now check if the org name works on its own
          valid = validate(planInfo.npm_org);
        }

        if (valid.errors) {
          return reply.view('org/create', {
            stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
            notices: valid.errors
          });
        }

        Org(request.loggedInUser.name)
          .get(planInfo.npm_org).then(function() {
          var err = new Error("Org already exists");
          err.isUserError = true;
          throw err;
        }).catch(function(err) {
          if (err.statusCode !== 404) {
            throw err;
          }

          // org doesn't yet exist
          return request.customer.createSubscription(planInfo)
            .then(function(subscriptions) {
              if (typeof subscriptions === 'string') {
                request.logger.info("created subscription: ", planInfo);
              }
            }).then(function() {
            return Org(request.loggedInUser.name)
              .create(planInfo.npm_org);
          });

        }).then(function() {
          return reply.redirect('/org/' + planInfo.npm_org);

        }).catch(function(err) {
          request.logger.error(err);

          if (err.isUserError) {
            return reply.view('org/create', {
              stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
              notices: [err]
            });
          } else {
            return reply.view('errors/internal', err).code(500);
          }
        });
      } else {
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

      }
    }

  });
};

