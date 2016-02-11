var LICENSE_API = process.env.LICENSE_API || "https://license-api-example.com";
var moment = require('moment');
var Request = require('../lib/external-request');
var P = require('bluebird');
var VError = require('verror');
var log = require('bole')('customer-agent');

var Customer = module.exports = function(name) {

  if (!(this instanceof Customer)) {
    return new Customer(name);
  }

  this.name = name;

  return this;
};

Customer.prototype.getById = function(id, callback) {
  var url = LICENSE_API + '/customer/' + id;

  return new P(function(accept, reject) {
    Request.get({
      url: url,
      json: true
    }, function(err, resp, body) {

      if (err) {
        return reject(err);
      }

      if (resp.statusCode === 404) {
        err = Object.assign(new Error('Customer not found'), {
          code: 'ENOCUSTOMER',
          statusCode: 404
        });

        return reject(err);
      }


      if (resp.statusCode >= 400) {
        err = Error(body);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return accept(body);
    });
  }).asCallback(callback);
};

Customer.prototype.createCustomer = function(data, callback) {
  var url = LICENSE_API + '/customer';

  return new P(function(accept, reject) {
    Request.put({
      url: url,
      json: true,
      body: {
        email: data.email,
        name: data.firstname + ' ' + data.lastname,
        phone: data.phone
      }
    }, function(err, resp, newCustomer) {

      if (err) {
        return reject(err);
      }

      if (resp.statusCode >= 400) {
        err = new Error(newCustomer);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return accept(newCustomer);

    });
  }).asCallback(callback);
};

Customer.prototype.createOnSiteLicense = function(licenseDetails, callback) {
  var self = this;

  // we need to get customer from billing email
  return new P(function(accept, reject) {
    self.getById(licenseDetails.billingEmail, function(err, customer) {

      if (err || !customer) {
        log.error("No customer found with that email");
        return reject(new Error("could not create license for unknown customer with email " + licenseDetails.billingEmail));
      }

      var url = LICENSE_API + '/license';
      var body = {
        product_id: process.env.NPME_PRODUCT_ID,
        customer_id: customer.id,
        stripe_subscription_id: licenseDetails.stripeId,
        seats: licenseDetails.seats,
        begins: licenseDetails.begins,
        ends: licenseDetails.ends
      };

      Request.put({
        url: url,
        json: true,
        body: body
      }, function(err, resp, newLicense) {

        if (err) {
          log.error("License creation failed:");
          log.error(err);
          return reject(err);
        }

        if (resp.statusCode >= 400) {
          err = new Error(newLicense);
          err.statusCode = resp.statusCode;
          return reject(err);
        }

        return accept(newLicense);
      });
    });

  }).asCallback(callback);
};

Customer.prototype.getOnSiteLicense = function(productId, customerEmailOrId, licenseId, callback) {

  var url = LICENSE_API + '/license/' + productId + '/' + customerEmailOrId + '/' + licenseId;

  return new P(function(accept, reject) {
    Request.get({
      url: url,
      json: true
    }, function(err, resp, license) {

      if (err) {
        return reject(err);
      }

      if (resp.statusCode === 404) {
        return accept(null); // no error, but no license either
      }

      if (resp.statusCode >= 400) {
        err = new Error(license);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      if (!license) {
        return accept(null);
      }

      return accept(license.details);

    });
  }).asCallback(callback);
};


Customer.prototype.createOnSiteTrial = function(customer, callback) {
  var trialEndpoint = LICENSE_API + '/trial',
    productId = process.env.NPME_PRODUCT_ID;

  // check if they already have a trial; 1 per customer
  return new P(function(accept, reject) {
    Request.get({
      url: trialEndpoint + '/' + productId + '/' + customer.email,
      json: true
    }, function(err, resp, trial) {

      if (err) {
        return reject(err);
      }

      if (resp.statusCode === 404) {
        // do not already have a trial, so create one
        return createNewTrial(customer);
      }

      if (resp.statusCode >= 400) {
        err = new Error(trial);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      // they already have a trial
      return accept(trial);
    });


    function createNewTrial(customer) {

      var TRIAL_LENGTH = 30,
        TRIAL_SEATS = 50;

      var trialEndpoint = LICENSE_API + '/trial',
        productId = process.env.NPME_PRODUCT_ID,
        trialLength = TRIAL_LENGTH,
        trialSeats = TRIAL_SEATS;

      Request.put({
        url: trialEndpoint,
        json: {
          customer_id: customer.id,
          product_id: productId,
          length: trialLength,
          seats: trialSeats
        }
      }, function(err, resp, newTrial) {

        if (err) {
          return reject(err);
        }

        if (resp.statusCode >= 400) {
          err = new Error(newTrial);
          err.statusCode = resp.statusCode;
          return reject(err);
        }

        return accept(newTrial);
      });
    }

  }).asCallback(callback);

};

Customer.prototype.getStripeData = function(callback) {
  var self = this;
  var stripeUrl = LICENSE_API + '/customer/' + self.name + '/stripe';

  return new P(function(accept, reject) {
    Request.get({
      url: stripeUrl,
      json: true
    }, function(err, resp, stripeData) {

      if (err) {
        return reject(err);
      }

      if (resp.statusCode === 404) {
        err = Object.assign(new Error('Customer not found: ' + self.name), {
          code: 'ENOCUSTOMER',
          statusCode: 404
        });
        return reject(err);
      }

      if (resp.statusCode >= 400) {
        err = new Error(stripeData);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      accept(stripeData);
    });
  }).asCallback(callback);
};

Customer.prototype.getSubscriptions = function(callback) {
  var url = LICENSE_API + '/customer/' + this.name + '/stripe/subscription';

  return new P(function(accept, reject) {
    Request.get({
      url: url,
      json: true
    }, function(err, resp, body) {

      if (err) {
        return reject(err);
      }

      if (resp.statusCode === 404) {
        return accept([]);
      }

      if (resp.statusCode >= 400) {
        err = new Error(body);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      var subs = body.filter(function(subscription) {
        return subscription.product_id && subscription.npm_org;
      });

      subs.forEach(function(subscription) {
        subscription.next_billing_date = moment.unix(subscription.current_period_end);
        subscription.privateModules = !!subscription.npm_org.match(/_private-modules/);
      });

      return accept(subs);
    });
  }).asCallback(callback);
};

Customer.prototype.updateBilling = function(body, callback) {
  var url;
  var props = ['name', 'email', 'card'];

  for (var i in props) {
    var prop = props[i];
    if (!body[prop]) {
      return callback(Error(prop + " is a required property"));
    }
  }

  this.getStripeData(function(err, customer) {

    var cb = function(err, resp, body) {
      if (typeof body === 'string') {
        // not an "error", per se, according to stripe
        // but should still be bubbled up to the user
        err = new Error(body);
      }

      return err ? callback(err) : callback(null, body);
    };

    // Create new customer
    if (err && err.statusCode === 404) {
      url = LICENSE_API + '/customer/stripe';
      return Request.put({
        url: url,
        json: true,
        body: body
      }, cb);
    }

    // Some other kind of error
    if (err) {
      return callback(err);
    }

    // Update existing customer
    url = LICENSE_API + '/customer/' + body.name + '/stripe';
    return Request.post({
      url: url,
      json: true,
      body: body
    }, cb);

  });
};

Customer.prototype.del = function(callback) {
  var url = LICENSE_API + '/customer/' + this.name + '/stripe';
  Request.del({
    url: url,
    json: true
  }, function(err, resp, body) {
    if (err) {
      return callback(err);
    }

    if (resp.statusCode >= 400) {
      err = new Error(body);
      err.statusCode = resp.statusCode;
      return callback(err);
    }

    return callback(null, body);
  });
};

Customer.prototype.createSubscription = function(planInfo, callback) {
  var url = LICENSE_API + '/customer/' + this.name + '/stripe/subscription';
  return new P(function(accept, reject) {
    Request.put({
      url: url,
      json: true,
      body: planInfo
    }, function(err, resp, body) {
      if (err) {
        reject(new VError(err, 'unable to update subscription to %j', planInfo.plan));
      } else if (resp.statusCode >= 400) {
        reject(new VError(new VError('unexpected status code: %d', resp.statusCode), 'unable to update subscription to %j', planInfo.plan));
      } else {
        accept(body);
      }
    });
  }).asCallback(callback);
};

Customer.prototype.cancelSubscription = function(subscriptionId, callback) {
  var url = LICENSE_API + '/customer/' + this.name + '/stripe/subscription/' + subscriptionId;
  return new P(function(accept, reject) {
    Request.del({
      url: url,
      json: true
    }, function(err, resp, body) {
      if (resp.statusCode === 404) {
        err = new Error('License not found');
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      if (resp.statusCode >= 400) {
        err = new Error(body);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return accept(body);
    });
  }).asCallback(callback);
};

Customer.prototype.getLicenseForOrg = function(orgName, callback) {
  var url = LICENSE_API + '/customer/' + this.name + '/stripe/subscription';

  return new P(function(accept, reject) {
    Request.get({
      url: url,
      json: true,
      qs: {
        org: orgName
      }
    }, function(err, resp, body) {
      if (err) {
        return reject(err);
      }

      if (resp.statusCode === 404) {
        err = Object.assign(new Error('Customer not found'), {
          code: 'ENOCUSTOMER',
          statusCode: 404
        });

        return reject(err);
      }

      if (resp.statusCode >= 400) {
        err = new Error(body);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return accept(body);
    });
  }).asCallback(callback);
};

// should this go into the org agent instead?
Customer.prototype.getAllSponsorships = function(licenseId, callback) {
  var url = LICENSE_API + '/sponsorship/' + licenseId;
  return new P(function(accept, reject) {
    Request.get({
      url: url,
      json: true
    }, function(err, resp, body) {
      if (err) {
        return reject(err);
      }

      if (resp.statusCode === 404) {
        return accept([]);
      }

      if (resp.statusCode >= 400) {
        err = new Error(body);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return accept(body);
    });
  }).asCallback(callback);
};

Customer.prototype.extendSponsorship = function(licenseId, name, callback) {
  var url = LICENSE_API + '/sponsorship/' + licenseId;
  return new P(function(accept, reject) {
    Request.put({
      url: url,
      json: true,
      body: {
        npm_user: name
      }
    }, function(err, resp, body) {
      if (err) {
        return reject(err);
      }

      if (resp.statusCode === 404) {
        err = new Error('The sponsorship license number ' + licenseId + ' is not found');
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      if (resp.statusCode >= 400) {
        err = Error(body);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return accept(body);
    });
  }).asCallback(callback);
};

Customer.prototype.acceptSponsorship = function(verificationKey, callback) {
  var url = LICENSE_API + '/sponsorship/' + verificationKey;
  return new P(function(accept, reject) {
    Request.post({
      url: url,
      json: true
    }, function(err, resp, body) {
      if (err) {
        return reject(err);
      }

      if (resp.statusCode === 409) {
        err = Error('user is already sponsored');
        err.statusCode = resp.statusCode;
        return accept(err);
      }

      if (resp.statusCode === 404) {
        err = Error('The verification key used for accepting this sponsorship does not exist');
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      if (resp.statusCode >= 400) {
        err = Error(body);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return accept(body);
    });
  }).asCallback(callback);
};

Customer.prototype.removeSponsorship = function(npmUser, licenseId, callback) {
  var url = LICENSE_API + '/sponsorship/' + licenseId + '/' + npmUser;

  return new P(function(accept, reject) {
    Request.del({
      url: url,
      json: true
    }, function(err, resp, body) {
      if (err) {
        return reject(err);
      }

      if (resp.statusCode === 404) {
        err = Error('user or licenseId not found');
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      if (resp.statusCode >= 400) {
        err = new Error(body);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return accept(body);
    });
  }).asCallback(callback);
};

Customer.prototype.declineSponsorship = Customer.prototype.revokeSponsorship = Customer.prototype.removeSponsorship;

Customer.prototype.swapSponsorship = function(npmUser, oldLicenseId, newLicenseId) {
  var self = this;
  var newSponsorship = {};
  return self.extendSponsorship(newLicenseId, npmUser)
    .then(function(sponsorship) {
      newSponsorship = sponsorship;
      return self.revokeSponsorship(npmUser, oldLicenseId);
    })
    .then(function() {
      return self.acceptSponsorship(newSponsorship.verification_key);
    });
};
