var request = require('request');
var _ = require('lodash');

var Customer = module.exports = function(opts) {
  _.extend(this, {
    host: process.env.LICENSE_API || "https://license-api-example.com",
  }, opts);
};

Customer.new = function() {
  return new Customer();
};

Customer.prototype.get = function(name, callback) {
  var url = this.host + '/stripe/' + name;

  request.get({url: url, json: true}, function(err, resp, body){

    if (err) { return callback(err); }

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
  var self = this;
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
      url = self.host + '/stripe';
      return request.put({url: url, json: true, body: body}, function(err, resp, body){
        return err ? callback(err) : callback(null, body);
      });
    }

    // Some other kind of error
    if (err) return callback(err);

    // Update existing customer
    url = self.host + '/stripe/' + body.name;
    return request.post({url: url, json: true, body: body}, function(err, resp, body){
      return err ? callback(err) : callback(null, body);
    });

  });
};

Customer.prototype.del = function(name, callback) {
  var url = this.host + '/stripe/' + name;
  request.del({url: url, json: true}, function(err, resp, body){
    return err ? callback(err) : callback(null, body);
  });
};
