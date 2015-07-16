var _ = require('lodash');
var assert = require('assert');
var moment = require('moment');
var Request = require('../lib/external-request');

var Customer = module.exports = function(name, opts) {

  assert(!_.isObject(name), "Must pass a name to Customer model");
  assert(_.isString(name), "Must pass a name to Customer model");

  if (!(this instanceof Customer)) {
    return new Customer(name, opts);
  }

  _.extend(this, {
    host: process.env.LICENSE_API || "https://license-api-example.com",
    name: name,
  }, opts);
};

Customer.prototype.get = function(callback) {
  var self = this;
  var stripeUrl = this.host + '/customer/' + self.name + '/stripe';

  Request.get({
    url: stripeUrl,
    json: true
  }, function(err, resp, stripeData) {

    if (err) {
      return callback(err);
    }

    if (resp.statusCode === 404) {
      err = Error('customer not found: ' + self.name);
      err.statusCode = resp.statusCode;
      return callback(err);
    }

    return callback(null, stripeData);
  });
};

Customer.prototype.getSubscriptions = function(callback) {
  var url = this.host + '/customer/' + this.name + '/stripe/subscription';

  Request.get({
    url: url,
    json: true
  }, function(err, resp, body) {

    if (err) {
      return callback(err);
    }

    if (resp.statusCode === 404) {
      return callback(null, []);
    }

    body.forEach(function(subscription) {
      // does this seem right?
      subscription.next_billing_date = moment.unix(subscription.current_period_end);
      subscription.privateModules = !!subscription.npm_org.match(/_private-modules/);
    });

    return callback(null, body);
  });
};

Customer.prototype.updateBilling = function(body, callback) {
  var _this = this;
  var url;
  var props = ['name', 'email', 'card'];

  for (var i in props) {
    var prop = props[i];
    if (!body[prop]) {
      return callback(Error(prop + " is a required property"));
    }
  }

  this.get(function(err, customer) {

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
      url = _this.host + '/customer/stripe';
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
    url = _this.host + '/customer/' + body.name + '/stripe';
    return Request.post({
      url: url,
      json: true,
      body: body
    }, cb);

  });
};

Customer.prototype.createSubscription = function(planInfo, callback) {
  var url = this.host + '/customer/' + this.name + '/stripe/subscription';
  Request.put({
    url: url,
    json: true,
    body: planInfo
  }, function(err, resp, body) {
    callback(err, body);
  });
};

Customer.prototype.del = function(callback) {
  var url = this.host + '/customer/' + this.name + '/stripe';
  Request.del({
    url: url,
    json: true
  }, function(err, resp, body) {
    return err ? callback(err) : callback(null, body);
  });
};
