var Joi = require('joi');

module.exports = function(request,reply) {

  var createCustomer = request.server.methods.npme.createCustomer,
    createTrial = request.server.methods.npme.createTrial,
    getCustomer = request.server.methods.npme.getCustomer,
    getLicense = request.server.methods.npme.getLicense;

  var opts = {
    title: 'npm Enterprise'
  };

  if (request.method === 'get') {
    return reply.view('enterprise/find-license', opts);
  }

  // get email & license key from parameters
  var schema = Joi.object().keys({
    email: Joi.string().regex(/^.+@.+\..+$/).required(), // email default accepts "boom@boom", which is kinda no bueno atm
    license: Joi.string().guid().allow('')
  });

  Joi.validate(request.payload, schema, function (err, data) {

    if(err) {
      request.logger.error("Email/license validation failed on license find-license page");
      request.logger.error(err);
      opts.msg = "The email or license key you entered appear to be invalid.";
      return reply.view('enterprise/invalid-license', opts).code(400);
    }

    // does this email belong to an existing customer
    getCustomer(data.email, function (err, customer) {

      // fail on error
      if(err) {
        request.logger.error("API error fetching customer " + data.email);
        request.logger.error(err);
        opts.msg = "This looks like an error on our part.";
        return reply.view('enterprise/invalid-license', opts).code(500);
      }

      if (customer) {
        //   yes customer! did they also give us a license key?
        if (data.license) {
          //     yes key! is it valid?
          getLicense (process.env.NPME_PRODUCT_ID, data.email, data.license, function(err,license) {
            // fail on error
            if (err) {
              request.logger.error("API error fetching license " + data.license + " for email " + data.email);
              request.logger.error(err);
              opts.msg = "This looks like an error on our part.";
              return reply.view('enterprise/invalid-license', opts).code(500);
            }

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
          //     no key:
          return createTrialAndSendPurchaseLink(customer);
        }
      } else {
        //   no customer: did they give us a license key?
        if(data.license) {
          // yes key: unknown email/license page, try again
          opts.msg = "Try again without a license key to get a signup link.";
          return reply.view('enterprise/invalid-license', opts).code(400);
        } else {
          // no key:
          // create customer
          createCustomer({ email: data.email, firstname: '', lastname: '' }, function(err,newCustomer) {

            if(err) {
              request.logger.error("API error creating customer " + data.email);
              request.logger.error(err);
              opts.msg = "This seems to be due to an internal error.";
              return reply.view('enterprise/invalid-license', opts).code(500);
            }

            return createTrialAndSendPurchaseLink(newCustomer);

          });
        }
      }
    });

    // create a trial, mail them with a link to license options
    function createTrialAndSendPurchaseLink(customer) {
      createTrial(customer, function(err, trial) {

          // generic failure
          if(err) {
            request.logger.error("API error creating trial for customer " + customer.id + '; email=' + customer.email);
            request.logger.error(err);
            return reply.view('enterprise/invalid-license', {msg:"This seems to be due to an internal error."});
          }

          var sendEmail = request.server.methods.email.send;

          var data = {
            email: customer.email,
            verification_key: trial.verification_key
          };

          sendEmail('enterprise-confirm-email', data, request.redis)
            .catch(function (er) {
              request.logger.error("Error emailing verification link to customer " + customer.id + '; email=' + customer.email);
              request.logger.error(er);
              return reply.view('enterprise/invalid-license', {msg:"This seems to be due to an internal error."}).code(500);
            })
            .then(function () {
              request.timing.page = 'npmEconfirmEmail';
              request.metrics.metric({ name: 'npmEconfirmEmail' });

              // everything is a-ok!
              return reply.view('enterprise/check-email');
            });
        }
      );
    }
  });

};
