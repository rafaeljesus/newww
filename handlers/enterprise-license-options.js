var Joi = require('joi');

module.exports = function(request, reply) {

  var getCustomer = request.server.methods.npme.getCustomer,
    getLicense = request.server.methods.npme.getLicense,
    verifyTrial = request.server.methods.npme.verifyTrial;

  var opts = {
    title: 'npm On-Site'
  };

  // get email & license key from parameters
  var schema = Joi.object().keys({
    email: Joi.string().regex(/^.+@.+\..+$/).required(), // email default accepts "boom@boom", which is kinda no bueno atm
    license: Joi.string().guid().optional(),
    trial: Joi.string().guid().optional()
  });

  Joi.validate(request.query, schema, function(err, data) {
    // bail if validation fails
    if (err) {
      request.logger.error("Email/license validation failed on license options page; ");
      request.logger.error(err);
      opts.msg = "The email or license key appears to be invalid.";
      return reply.view('enterprise/invalid-license', opts).code(400);
    }

    if (data.license) {
      // get license details from /license/[productkey]/[email]/[licensekey]
      getLicense(process.env.NPME_PRODUCT_ID, data.email, data.license, function(err, license) {
        // fail on error
        if (err) {
          request.logger.error("API error fetching license " + data.license + " for email " + data.email);
          request.logger.error(err);
          opts.msg = "This looks like an error on our part.";
          return reply.view('enterprise/invalid-license', opts).code(500);
        }

        // fail if license invalid
        if (!license) {
          request.logger.error("License " + data.license + " not found for email " + data.email);
          opts.msg = '';
          return reply.view('enterprise/invalid-license', opts).code(400);
        }
        return fetchCustomer(license.customer_id);
      });

    } else if (data.trial) {

      verifyTrial(data.trial, function(err, verifiedTrial) {
        if (err) {
          request.logger.info("Error fetching trial " + data.trial + " for email " + data.email);
          request.logger.error(err);
          opts.msg = "";
          return reply.view('enterprise/invalid-license', opts).code(500);
        }

        return fetchCustomer(verifiedTrial.customer_id);

      });

    } else {
      // have neither license nor trial info
      request.logger.error("Neither license nor trial provided for email " + data.email);
      if (err) {
        request.logger.error(err);
      }
      opts.msg = "You need a license key or a trial ID.";
      return reply.view('enterprise/invalid-license', opts).code(400);
    }
  });

  function fetchCustomer(customerId) {
    var opts = {};

    // get customer details from /customer/[id]
    getCustomer(customerId, function(err, customer) {

      // fail on error
      if (err) {
        request.logger.error("API error fetching customer " + customerId);
        request.logger.error(err);
        opts.msg = "This looks like an error on our part.";
        return reply.view('enterprise/invalid-license', opts).code(500);
      }

      // fail if customer invalid
      if (!customer) {
        request.logger.error("Customer not found for customerId " + customerId);
        return reply.view('enterprise/invalid-license', opts).code(404);
      }

      // show option to buy licenses
      opts = {
        billingEmail: customer.email, // must supply both customer ID and email
        customerId: customer.id, // as two factors to identify customer on next page
        stripeKey: process.env.STRIPE_PUBLIC_KEY
      };

      return reply.view('enterprise/license-options', opts);

    });
  }
};
