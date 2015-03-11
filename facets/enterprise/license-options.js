var Joi = require('joi')
var config = require('../../config');

module.exports = function(request, reply) {

  var getCustomer = request.server.methods.npme.getCustomer,
    getLicense = request.server.methods.npme.getLicense,
    verifyTrial = request.server.methods.npme.verifyTrial;

  // get email & license key from parameters
  var schema = Joi.object().keys({
    email: Joi.string().regex(/^.+@.+\..+$/).required(), // email default accepts "boom@boom", which is kinda no bueno atm
    license: Joi.string().guid().optional(),
    trial: Joi.string().guid().optional()
  })

  Joi.validate(request.query, schema, function (err, data) {

    // bail if validation fails
    if(err) {
      request.logger.error("Email/license validation failed on license options page; ")
      request.logger.error(err)
      return reply.view('enterprise/invalid-license', {msg:"The email or license key appear to be invalid."});
    }

    if(data.license) {
      // get license details from /license/[productkey]/[email]/[licensekey]
      getLicense(config.npme['product_id'],data.email,data.license,
        function(err,license) {

          // fail on error
          if(err) {
            request.logger.error("API error fetching license " + data.license + " for email " + data.email)
            request.logger.error(err)
            return reply.view('enterprise/invalid-license', {msg:"This looks like an error on our part."});
          }

          // fail if license invalid
          if(!license) {
            request.logger.error("License " + data.license + " not found for email " + data.email)
            return reply.view('enterprise/invalid-license', {msg:''});
          }

          return fetchCustomer(license['customer_id'])
        }
      )
    } else if (data.trial) {
      verifyTrial(
        data.trial,
        function(err, verifiedTrial) {
          if(err) {
            request.logger.info("Error fetching trial " + data.trial + " for email " + data.email)
            request.logger.error(err)
            return reply.view('enterprise/invalid-license', {msg:""});
          }

          return fetchCustomer(verifiedTrial['customer_id'])

        }
      )

    } else {
      // fail on error
      if(err) {
        request.logger.info("Neither license nor trial provided for email " + data.email,err)
        return reply.view('enterprise/invalid-license', {msg:"You need a license key or a trial ID."});
      }
    }
  })

  function fetchCustomer(customerId) {
    // get customer details from /customer/[id]
    getCustomer(
      customerId,
      function(err,customer) {

        // fail on error
        if(err) {
          request.logger.error("API error fetching customer " + data.email)
          request.logger.error(err)
          return reply.view('enterprise/invalid-license', {msg:"This looks like an error on our part."});
        }

        // fail if customer invalid
        if(!customer) {
          request.logger.error("Customer not found for email " + data.email)
          return reply.view('enterprise/invalid-license', {});
        }

        // show option to buy licenses
        var opts = {
          billingEmail: customer.email,   // must supply both customer ID and email
          customerId: customer.id,        // as two factors to identify customer on next page
          stripeKey: config.stripe.publickey
        }
        return reply.view('enterprise/license-options', opts);

      }
    )
  }
}
