var _       = require('lodash');
var utils   = require('../lib/utils');
var Request = require('../lib/external-request');

var Customer = module.exports = function(opts) {
  _.extend(this, {
    host: process.env.LICENSE_API || "https://license-api-example.com",
    logger: utils.testLogger
  }, opts);
};

Customer.new = function(request) {
  var opts = {};

  if (request && request.logger) {
    opts.logger = request.logger;
  }

  return new Customer(opts);
};

Customer.prototype.get = function(name, callback) {
  var url = this.host + '/stripe/' + name;

  Request.get({url: url, json: true}, function(err, resp, body){
    if (err) {return callback(err);}
    if (resp.statusCode === 404) {
      err = Error('customer not found: ' + name);
      err.statusCode = resp.statusCode;
      return callback(err);
    }

    // Coerce integer into date
    if (body && body.next_billing_date){
      body.next_billing_date = new Date(body.next_billing_date);
    }

    return callback(null, body);
  });
};

Customer.prototype.update = function(body, callback) {
  var _this = this;
  var url;
  var props = ['name', 'email', 'card'];

  for (var i in props) {
    var prop = props[i];
    if (!body[prop]) {
      return callback(Error(prop + " is a required property"));
    }
  }

  this.get(body.name, function(err, customer) {

    // Create new customer
    if (err && err.statusCode === 404) {
      url = _this.host + '/stripe';
      return Request.put({url: url, json: true, body: body}, function(err, resp, body){
        return err ? callback(err) : callback(null, body);
      });
    }

    // Some other kind of error
    if (err) { return callback(err); }

    // Update existing customer
    url = _this.host + '/stripe/' + body.name;
    return Request.post({url: url, json: true, body: body}, function(err, resp, body){
      return err ? callback(err) : callback(null, body);
    });

  });
};

Customer.prototype.del = function(name, callback) {
  var url = this.host + '/stripe/' + name;
  Request.del({url: url, json: true}, function(err, resp, body){
    return err ? callback(err) : callback(null, body);
  });
};
