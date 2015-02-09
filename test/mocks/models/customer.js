var _ = require('lodash');
var fixtures = require('../../fixtures.js');

var Customer = module.exports = function(opts) {
  _.extend(this, {
    host: "http://license-api-example.com",
  }, opts);
}

Customer.prototype.get = function(name, callback) {

  if (name === "norbert_newbie") {
    var e = Error("norbert not found")
    e.statusCode = 404
    return callback(e)
  }

  if (name === "diana_delinquent") {
    return callback(null, fixtures.customers.license_expired);
  }

  return callback(null, fixtures.customers.happy);
};

Customer.prototype.update = function(name, callback) {
  return callback(null, fixtures.customers.happy);
};

Customer.prototype.del = function(name, callback) {
  return callback(null, fixtures.customers.happy);
};
