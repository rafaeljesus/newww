var P = require('bluebird');
var Joi = require('joi');
var sendEmail = require('../adapters/send-email');
var CustomerAgent = require('../agents/customer');

module.exports = function(request, reply) {

  var Customer = new CustomerAgent();

  var opts = {
    title: 'npm On-Site'
  };

  if (request.method === 'get') {
    return reply.view('enterprise/find-license', opts);
  }

  // get email & license key from parameters
  var schema = Joi.object().keys({
    email: Joi.string().regex(/^.+@.+\..+$/).required(), // email default accepts "boom@boom", which is kinda no bueno atm
    license: Joi.string().guid().allow('')
  });

  P.promisify(Joi.validate, {context: Joi})(request.payload, schema)
    .catch(function(err) {
      throw Object.assign(err, {
        statusCode: 400
      });
    })
    .then(function(data) {

      // does this email belong to an existing customer
      return Customer.getById(data.email)
        .catch(function(err) {
          if (err.statusCode !== 404) {
            throw err;
          }
        })
        .then(function(customer) {

          if (customer && !data.license) {
            return createTrialAndSendPurchaseLink(customer)
              .then(sendEmailAboutLicense);

          } else if (!customer && data.license) {
            //   no customer: did they give us a license key?
            // yes key: unknown email/license page, try again
            opts.msg = "Try again without a license key to get a signup link.";
            return reply.view('enterprise/invalid-license', opts).code(400);

          } else if (!customer && !data.license) {
            return Customer.createCustomer({
              email: data.email,
              firstname: '',
              lastname: ''
            })
              .then(newCustomer => createTrialAndSendPurchaseLink(newCustomer))
              .then(sendEmailAboutLicense);

          } else if (customer && data.license) {
            return Customer.getOnSiteLicense(process.env.NPME_PRODUCT_ID, data.email, data.license)
              .then(function(license) {
                if (license) {
                  // yes valid! display the license options page
                  opts = {
                    stripeKey: process.env.STRIPE_PUBLIC_KEY,
                    billingEmail: data.email,
                    customerId: customer.id
                  };

                  return reply.view('enterprise/license-options', opts);

                } else {
                  // not valid: unknown email/license page, try again
                  opts.msg = "Try again without a license key to get a signup link.";
                  return reply.view('enterprise/invalid-license', opts).code(400);
                }

              });

          } else {
            throw new Error("this should not happen");
          }
        });

    })
    .catch(function(err) {
      if (err.name === 'ValidationError') {
        return reply.view('enterprise/invalid-license', {
          msg: "The email or license key you entered appear to be invalid."
        }).code(400);
      }

      return reply(err);
    });

  function sendEmailAboutLicense(data) {
    return sendEmail('enterprise-confirm-email', data, request.redis)
      .then(function() {
        request.timing.page = 'npmEconfirmEmail';
        // everything is a-ok!
        return reply.view('enterprise/check-email');
      });
  }

};

function createTrialAndSendPurchaseLink(customer) {
  return new CustomerAgent().createOnSiteTrial(customer)
    .then(trial => ({
        email: customer.email,
        verification_key: trial.verification_key
    }));

}

