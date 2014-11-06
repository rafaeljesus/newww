var request = require('request'),
    log = require('bole')('npme-create-customer'),
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
    }, function(er, resp, newCustomer) {

      // stop if we couldn't create the customer
      if(resp.statusCode != 200) {
        log.warn("customer creation failed: ", resp.statusCode)
        log.warn(newCustomer)

        er = er || new Error('unable to create customer');

        return next(er);
      }

      return next(null, newCustomer);
    });
  }
}