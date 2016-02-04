var LICENSE_API = process.env.LICENSE_API || "https://license-api-example.com";

var request = require('request'),
  log = require('bole')('npme-get-license'),
  CustomerAgent = require('../../../agents/customer');

module.exports = function(licenseDetails, callback) {

  // we need to get customer from billing email
  new CustomerAgent().getById(licenseDetails.billingEmail, function(er, customer) {

    if (er || !customer) {
      log.error("No customer found with that email");
      callback(new Error("could not create license for unknown customer with email " + licenseDetails.billingEmail));
      return;
    }

    var licenseEndpoint = LICENSE_API + '/license';

    request.put({
      url: licenseEndpoint,
      json: {
        product_id: process.env.NPME_PRODUCT_ID,
        customer_id: customer.id,
        stripe_subscription_id: licenseDetails.stripeId,
        seats: licenseDetails.seats,
        begins: licenseDetails.begins,
        ends: licenseDetails.ends
      }
    }, function(er, resp, body) {

      if (er) {
        log.error("License creation failed:");
        log.error(er);
        callback(er);
      }

      if (resp.statusCode === 200) {
        log.info("created license", body);
        return callback(null, body);
      }

      log.error('unexpected status code from license API; status=' + resp.statusCode + '; email=' + licenseDetails.billingEmail);
      callback(new Error('unexpected status code from license API: ' + resp.statusCode));
    });
  });
};
