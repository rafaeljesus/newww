var Joi = require('joi')
var config = require('../../config');

module.exports = function(options) {

  return function buyLicense(request, reply)
  {

    var getCustomer = request.server.methods.npme.getCustomer,
      getLicense = request.server.methods.npme.getLicense;

    // get email & license key from parameters
    var schema = Joi.object().keys({
      email: Joi.string().regex(/^.+@.+\..+$/).required(), // email default accepts "boom@boom", which is kinda no bueno atm
      license: Joi.string().guid().required()
    })

    Joi.validate(request.query, schema, function (err, data) {

      console.log("query",request.query)

      if(err) {
        request.logger.info("Email/license validation failed on license options page; ",err)
        return reply.view('enterprise/invalid-license', {msg:"The email or license key appear to be invalid."});
      }

      // get license details from /license/[productkey]/[email]/[licensekey]
      getLicense(config.npme['product_id'],data.email,data.license,
        function(err,license) {

          // fail on error
          if(err) {
            request.logger.info("API error fetching license " + data.license + " for email " + data.email,err)
            return reply.view('enterprise/invalid-license', {msg:"This looks like an error on our part."});
          }

          // fail if license invalid
          if(!license) {
            request.logger.info("License " + data.license + " not found for email " + data.email,err)
            return reply.view('enterprise/invalid-license', {msg:''});
          }

          console.log("License found:",license)

          // get customer details from /customer/[id]
          getCustomer(license['customer_id'],
            function(err,customer) {

              // fail on error
              if(err) {
                request.logger.info("API error fetching customer " + data.email)
                return reply.view('enterprise/invalid-license', {msg:"This looks like an error on our part."});
              }

              // fail if customer invalid
              if(!customer) {
                request.logger.info("Customer not found for email " + data.email,err)
                return reply.view('enterprise/invalid-license', {});
              }

              // show option to buy licenses
              var opts = {
                billingEmail: customer.email,   // must supply both customer ID and email
                customerId: customer.id,        // as two factors to identify customer on next page
                stripeKey: options.publickey
              }
              return reply.view('enterprise/license-options', opts);

            }
          )

        }
      )
    })
  }
}