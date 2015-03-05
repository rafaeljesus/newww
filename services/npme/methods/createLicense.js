var request = require('request'),
    log = require('bole')('npme-get-license');

var config = require('../../../config');

module.exports = function createLicense(options) {

  var getCustomer = require('./getCustomer')(options)

  return function (billingEmail, seats, stripeId, begins, ends, callback) {

    // we need to get customer from billing email
    getCustomer(
      billingEmail,
      function(er,customer) {

        if (er || !customer) {
          log.error("No customer found with that email")
          callback(new Error("could not create license for unknown customer with email " + billingEmail))
          return
        }

        var licenseEndpoint = options.api + '/license'

        request.put({
          url: licenseEndpoint,
          json: {
            product_id: config.npme['product_id'],
            customer_id: customer.id,
            stripe_subscription_id: stripeId,
            seats: seats,
            begins: begins,
            ends: ends
          }
        }, function (er, resp, body) {

          if (er) {
            log.error("License creation failed:",er)
            callback(er)
          }

          if (resp.statusCode === 200) {
            log.info("created license", body);
            return callback(null, body);
          }

          log.error('unexpected status code from license API; status=' + resp.statusCode + '; email=' + billingEmail);
          callback(new Error('unexpected status code from license API: ' + resp.statusCode));
        });

      }
    )

  };
};
