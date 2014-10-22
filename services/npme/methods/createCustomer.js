var request = require('request'),
    log = require('bole')('hubspot-create-customer'),
    uuid = require('node-uuid');

module.exports = function createCustomer (options) {

  return function (data, next) {

    var customerEndpoint = options.api + '/customer';

    request.put({
      url: customerEndpoint,
      json: {
        email: data.email,
        name: data.firstname + ' ' + data.lastname,
        phone: data.phone
      }
    }, function(er, httpResponse, newCustomer) {
      // stop if we couldn't create the customer
      if(httpResponse.statusCode != 200) {
        log.warn("customer creation failed: ", httpResponse.statusCode)
        log.warn(newCustomer)
        return next(er);
      }

      return next(null, newCustomer);
    });
  }
}