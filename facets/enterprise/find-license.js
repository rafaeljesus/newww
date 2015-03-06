var Joi = require('joi')
var config = require('../../config');
var nodemailer = require('nodemailer')

module.exports = function(request,reply) {

  var createCustomer = request.server.methods.npme.createCustomer,
    createTrial = request.server.methods.npme.createTrial,
    getCustomer = request.server.methods.npme.getCustomer,
    getLicense = request.server.methods.npme.getLicense;

  if (request.method === 'get') {
    return reply.view('enterprise/find-license', {});
  }

  // get email & license key from parameters
  var schema = Joi.object().keys({
    email: Joi.string().regex(/^.+@.+\..+$/).required(), // email default accepts "boom@boom", which is kinda no bueno atm
    license: Joi.string().guid().allow('')
  })

  console.log("payload",request.payload)

  Joi.validate(request.payload, schema, function (err, data) {

    if(err) {
      request.logger.info("Email/license validation failed on license find-license page; ",err)
      return reply.view('enterprise/invalid-license', {msg:"The email or license key you entered appear to be invalid."});
    }

    // does this email belong to an existing customer
    getCustomer(
      data.email,
      function(err,customer) {

        // fail on error
        if(err) {
          request.logger.info("API error fetching customer " + data.email,err)
          return reply.view('enterprise/invalid-license', {msg:"This looks like an error on our part."});
        }

        if(customer) {
          //   yes customer! did they also give us a license key?
          if(data.license) {
            //     yes key! is it valid?
            getLicense(config.npme['product_id'],data.email,data.license,
              function(err,license) {

                // fail on error
                if (err) {
                  request.logger.info("API error fetching license " + data.license + " for email " + data.email, err)
                  return reply.view('enterprise/invalid-license', {msg: "This looks like an error on our part."});
                }

                if(license) {
                  // yes valid! display the license options page
                  var opts = {
                    stripeKey: config.stripe.publickey,
                    billingEmail: data.email,
                    customerId: customer.id
                  }
                  return reply.view('enterprise/license-options', opts);

                } else {
                  // not valid: unknown email/license page, try again
                  return reply.view('enterprise/invalid-license', {msg: "Try again without a license key to get a signup link."});
                }

              }
            )
          } else {
            //     no key:
            return createTrialAndSendPurchaseLink(customer)
          }
        } else {
          //   no customer: did they give us a license key?
          if(data.license) {
            // yes key: unknown email/license page, try again
            return reply.view('enterprise/invalid-license', {msg: "Try again without a license key to get a signup link."});
          } else {
            // no key:
            // create customer
            createCustomer(
              { email: data.email, firstname: '', lastname: '' },
              function(err,newCustomer) {

                if(err) {
                  request.logger.info("API error creating customer " + data.email,err)
                  return reply.view('enterprise/invalid-license', {msg:"This seems to be due to an internal error."});
                }

                return createTrialAndSendPurchaseLink(newCustomer)

              }
            )
          }
        }
      }
    )

    // create a trial, mail them with a link to license options
    function createTrialAndSendPurchaseLink(customer) {
      createTrial(
        customer,
        function(err, trial) {

          // generic failure
          if(err) {
            request.logger.info("API error creating trial for customer " + customer.id + '; email=' + customer.email,err)
            return reply.view('enterprise/invalid-license', {msg:"This seems to be due to an internal error."});
          }

          var mailSettings = config.user.mail
          var from = mailSettings.emailFrom
          var transport = require(mailSettings.mailTransportModule);
          var mailer = nodemailer.createTransport( transport(mailSettings.mailTransportSettings) );
          var mail = {
            to: customer.email,
            from: '" npm Enterprise " <' + from + '>',
            subject : "npm Enterprise email verification",
            text: "Hi -\r\n\r\n" +
              "Thanks for verifying your email address. To continue licensing npm Enterprise,\r\n" +
              "simply click this link:\r\n\r\n" +
              config.canonicalHost + "/enterprise/license-options?email=" + customer.email + "&trial=" + trial.verification_key + "\r\n\r\n" +
              "If you have any problems, please email " + from + "\r\n" +
              "\r\n\r\nnpm loves you.\r\n"
          };

          mailer.sendMail(mail, function (er) {

            if (er) {
              request.logger.info("Error emailing verification link to customer " + customer.id + '; email=' + customer.email,err)
              return reply.view('enterprise/invalid-license', {msg:"This seems to be due to an internal error."});
            }

            // everything is a-ok!
            return reply.view('enterprise/check-email');
          });


        }
      )
    }
  })

}