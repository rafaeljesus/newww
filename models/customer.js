var _       = require('lodash');
var assert  = require('assert');
var Request = require('../lib/external-request');

var Customer = module.exports = function(name, opts) {

  assert(!_.isObject(name), "Must pass a name to Customer model");
  assert(_.isString(name), "Must pass a name to Customer model");

  if (!(this instanceof Customer)) { return new Customer(name, opts); }

  _.extend(this, {
    host: process.env.LICENSE_API || "https://license-api-example.com",
    name: name,
  }, opts);
};

Customer.prototype.get = function(callback) {
  var self = this;
  var stripeUrl = this.host + '/customer/' + self.name + '/stripe';
  var subscriptionsUrl = this.host + '/customer/' + self.name + '/stripe/subscription';

  Request.get({url: stripeUrl, json: true}, function(err, resp, stripeData){

    if (err) { return callback(err); }

    if (resp.statusCode === 404) {
      err = Error('customer not found: ' + self.name);
      err.statusCode = resp.statusCode;
      return callback(err);
    }

    Request.get({url: subscriptionsUrl, json: true}, function (err, resp, subscriptions) {
      if (err) { return callback(err); }

      if (resp.statusCode === 404) {
        err = Error('subscriptions for customer ' + self.name + ' not found');
        err.statusCode = resp.statusCode;
        return callback(err);
      }

      if (subscriptions && _.isArray(subscriptions)) {
        subscriptions.forEach(function (s) {
          // Coerce integer in seconds into date
          if (s.npm_org.match(/private-modules/)){
            stripeData.next_billing_date = new Date(s.current_period_end * 1000);
          }
        });
      }

      return callback(null, stripeData);
    });
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

    var cb = function(err, resp, body){
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
      return Request.put({url: url, json: true, body: body}, cb);
    }

    // Some other kind of error
    if (err) {
      return callback(err);
    }

    // Update existing customer
    url = _this.host + '/customer/' + body.name + '/stripe';
    return Request.post({url: url, json: true, body: body}, cb);

  });
};

Customer.prototype.createSubscription = function (planInfo, callback) {
  var url = this.host + '/customer/' + this.name + '/stripe/subscription';
  Request.put({ url: url, json: true, body: planInfo }, function (err, resp, body) {
    callback(err, body);
  });
};

Customer.prototype.del = function(callback) {
  var url = this.host + '/customer/' + this.name + '/stripe';
  Request.del({url: url, json: true}, function(err, resp, body){
    return err ? callback(err) : callback(null, body);
  });
};
