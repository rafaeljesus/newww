var customer = module.exports = {};
var Joi = require('joi');
var Org = require('../agents/org');
var User = require('../agents/user');
var Customer = require('../agents/customer');
var P = require('bluebird');
var utils = require('../lib/utils');
var validate = require('validate-npm-package-name');
var invalidUserName = require('npm-user-validate').username;

var _ = require('lodash');

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

  var stripeDataErrorHandler = function(err) {
    if (err.statusCode === 404) {
      return null;
    } else {
      throw err;
    }
  };

  var stripeDataPromise = request.customer.getStripeData()
    .catch(stripeDataErrorHandler);

  var getByIdPromise = request.customer.getById(request.loggedInUser.email)
    .catch(stripeDataErrorHandler);

  var customerStripeData = P.join(stripeDataPromise, getByIdPromise, function(stripeCustomer, licenseApiCustomer) {
    if (stripeCustomer && licenseApiCustomer) {
      stripeCustomer.customer_id = licenseApiCustomer.stripe_customer_id;
    }

    return {
      customer: stripeCustomer
    };
  });

  var customerSubscriptions = request.customer.getSubscriptions()
    .catch(function(err) {
      request.logger.error('unable to get subscriptions for ' + request.loggedInUser.name);
      request.logger.error(err);
      return [];
    }).then(function(subs) {

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

    return {
      privateModules: privateModules,
      orgs: orgs
    };
  });

  var onSuccess = function(opts) {
    return reply.view('user/billing', opts);
  };

  var onError = function(err) {
    request.logger.error(err);
    return reply.view('errors/internal', err).code(500);
  };

  P.join(customerStripeData, customerSubscriptions, function(customer, subscriptions) {
    var addopts = [customer, subscriptions];

    addopts.forEach(function(e) {
      _.extend(opts, e);
    });

    return opts;
  })
    .then(onSuccess, onError);
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
  "human-name": Joi.string().optional().allow(''),
  orgScope: Joi.string().when('planType', {
    is: 'orgs',
    then: Joi.required()
  }),
  "new-user": Joi.string().optional(),
  "paid-org-type": Joi.string().optional(),
  "card-number": Joi.string().optional(),
  "card-cvc": Joi.string().optional(),
  "card-exp-month": Joi.string().optional(),
  "card-exp-year": Joi.string().optional()
};

customer.subscribe = function(request, reply) {
  var loggedInUser = request.loggedInUser.name;

  Joi.validate(request.payload, subscriptionSchema, function(err, planData) {
    if (err) {
      var notices;

      if (planData.planType === 'orgs') {
        notices = err.details.map(function(e) {
          return e.message;
        });

        return reply.view('org/create', {
          stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
          errorNotices: notices
        });
      } else {
        notices = err.details.map(function(e) {
          return P.reject(e);
        });

        return request.saveNotifications(notices).then(function(token) {
          return reply.redirect('/settings/billing' + (token ? '?notice=' + token : ''));
        }).catch(function(err) {
          request.logger.error(err);
          return reply.view('errors/internal', err).code(500)
        });
      }

    }

    var planType = planData.planType;
    var planInfo = {
      plan: plans[planType]
    };

    if (request.loggedInUser.customer) {
      return subscribe();
    } else {
      return customer.updateBillingInfo(request, reply, subscribe);
    }

    function subscribe() {
      if (planType === 'orgs') {
        return subscribeToOrg();
      } else {
        return request.customer.createSubscription(planInfo, function(err, subscriptions) {
          if (err) {
            request.logger.error("unable to update subscription to " + planInfo.plan);
            request.logger.error(err);
          }

          if (typeof subscriptions === 'string') {
            request.logger.info("created subscription: ", planInfo);
          }

          User(request.loggedInUser).dropCache(request.loggedInUser.name, function(err) {
            if (err) {
              request.logger.error(err);
              return reply.view('errors/internal', err);
            }
            return reply.redirect('/settings/billing?updated=1');
          });

        });
      }
    }

    function subscribeToOrg() {

      var newUser = planData['new-user'];

      if (newUser && invalidUserName(newUser)) {
        var err = new Error("User name must be valid");
        request.logger.error(err);
        return request.saveNotifications([
          P.reject(err),
        ]).then(function(token) {
          var url = '/org/transfer-user-name';
          var param = token ? "?notice=" + token : "";
          param = param + "&orgScope=" + request.query.orgScope;
          url = url + param;
          return reply.redirect(url);
        }).catch(function(err) {
          request.logger.error(err);
        });
      }

      // check if the org name works as a package name
      var valid = validate('@' + planData.orgScope + '/foo');

      if (!valid.errors) {
        // now check if the org name works on its own
        valid = validate(planData.orgScope);
      }

      if (valid.errors) {
        return reply.view('org/create', {
          stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
          errorNotices: valid.errors
        });
      }

      var opts = {};


      Org(loggedInUser)
        .getInfo(planData.orgScope)
        .then(function() {
          throw Object.assign(new Error("Org already exists"), {
            code: 'EEXIST',
            statusCode: 409,
            what: 'org'
          });
        })
        .catch(function(err) {
          if (err.statusCode !== 404) {
            throw err;
          }

          // org doesn't yet exist, transfer user then create org
          var start = newUser ? User(request.loggedInUser).toOrg(loggedInUser, newUser) : P.resolve(null);

          return start;
        })
        .then(function(newUserData) {
          var setSession = P.promisify(request.server.methods.user.setSession(request), {context: null});
          var delSession = P.promisify(request.server.methods.user.delSession(request), {context: null});
          loggedInUser = newUserData ? newUser : loggedInUser;

          if (newUserData) {
            return delSession(request.loggedInUser)
              .then(function() {
                request.logger.info("setting session to: " + loggedInUser);
                return setSession({
                  name: loggedInUser
                });
              });
          } else {
            return Org(loggedInUser)
              .create({
                scope: planData.orgScope,
                humanName: planData["human-name"]
              });
          }
        })
        .then(function() {
          planInfo.npm_org = planData.orgScope;
          return Customer(loggedInUser).createSubscription(planInfo);
        })
        .tap(function(subscription) {
          if (typeof subscription === 'string') {
            request.logger.info("created subscription: ", planInfo);
          }
          var user = User(request.loggedInUser);
          var dropCache = P.promisify(user.dropCache, {context: user});
          return dropCache(loggedInUser);
        })
        .then(function(subscription) {
          return Customer(loggedInUser).extendSponsorship(subscription.license_id, loggedInUser);
        })
        .then(function(extendedSponsorship) {
          return Customer(loggedInUser).acceptSponsorship(extendedSponsorship.verification_key);
        })
        .then(function() {
          return reply.redirect('/org/' + planData.orgScope);
        })
        .catch(function(err) {
          if (!(err.code === 'EEXIST' && err.what === 'org')) {
            throw err;
          }

          return Org(loggedInUser).getUsers(planData.orgScope)
            .then(function(users) {

              users = users || {};
              users.items = users.items || [];

              var isSuperAdmin = users.items.filter(function(user) {
                return user.role && user.role.match(/super-admin/);
              }).some(function(admin) {
                return admin.name === loggedInUser;
              });


              if (isSuperAdmin) {
                opts.users = users;
                return request.customer.getLicenseForOrg(planData.orgScope);
              } else {
                throw Object.assign(new Error("Org already exists"), {
                  statusCode: 409,
                  code: 'EEXIST',
                  what: 'org'
                });
              }
            })
            .then(function(license) {
              if (license && license.length) {
                throw Object.assign(new Error("You already own this Organization"), {
                  code: 'EEXIST',
                  statusCode: 409,
                  what: 'license'
                });
              } else {
                throw Object.assign(new Error("No license for this org"), {
                  code: 'ENOLICENSE',
                  statusCode: 404
                });
              }
            })
            .catch(function(err) {
              if (err.code !== 'ENOLICENSE' && err.code !== 'ENOCUSTOMER') {
                throw err;
              }

              planInfo.npm_org = planData.orgScope;
              return request.customer.createSubscription(planInfo);
            })
            .then(function(license) {

              license = license || {};
              var extensions = opts.users.items.map(function(user) {
                return request.customer.extendSponsorship(license.license_id, user.name);
              });

              return P.all(extensions);
            })
            .then(function(sponsorships) {
              var acceptances = sponsorships.map(function(sponsorship) {
                return request.customer.acceptSponsorship(sponsorship.verification_key);
              });
              return P.all(acceptances)
                .catch(function(err) {
                  if (err.statusCode !== 409) {
                    throw err;
                  }
                });
            })
            .then(function() {
              var redirectUrl = "/org/" + planData.orgScope;
              var message = "You have successfully restarted " + planData.orgScope;
              return request.saveNotifications([
                P.resolve(message)
              ]).then(function(token) {
                var param = token ? "?notice=" + token : "";
                redirectUrl = redirectUrl + param;
                return reply.redirect(redirectUrl);
              }).catch(function(err) {
                request.logger.error(err);
                return reply.redirect(redirectUrl);
              });
            });
        })
        .catch(function(err) {
          if (!(err.statusCode === 409 && err.message)) {
            throw err;
          }

          return reply.view('org/create', {
            stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
            inUseError: true,
            orgScope: planData.orgScope,
            humanName: planData["human-name"],
            errorNotices: [err]
          });
        })
        .catch(function(err) {
          if (err.statusCode < 500) {
            request.logger.error(err);
            return request.saveNotifications([
              P.reject(err),
            ]).then(function(token) {
              var url = '/org/create';
              var param = token ? "?notice=" + token : "";
              url = url + param;
              return reply.redirect(url);
            }).catch(function(err) {
              request.logger.error(err);
            });
          } else {
            return reply(err);
          }
        });
    }
  });
};
