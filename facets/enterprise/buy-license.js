var nodemailer = require('nodemailer')
var config = require('../../config')
var Joi = require('joi')
var moment = require('moment')

module.exports = function (options) {
  var stripe = require('stripe')(options.secretkey)
  var SUB_TYPE_MONTHLY = 1, SUB_TYPE_ANNUAL = 2, SUB_TYPE_MULTI_SEAT = 3
  var VALID_SUBSCRIPTION_TYPES = [SUB_TYPE_MONTHLY, SUB_TYPE_ANNUAL, SUB_TYPE_MULTI_SEAT]

  return function (request, reply) {

    var createLicense = request.server.methods.npme.createLicense
    var getCustomer = request.server.methods.npme.getCustomer
    var updateCustomer = request.server.methods.npme.updateCustomer

    if (request.method != 'post') {
      return reply('expecting POST request').code(405)
    }

    var schema = Joi.object().keys({
      id: Joi.string().token(),
      livemode: Joi.string(),
      client_ip: Joi.string(),
      created: Joi.string(),
      used: Joi.string(),
      object: Joi.string(),
      type: Joi.string(),
      card: Joi.object(),
      email: Joi.string().regex(/^.+@.+\..+$/), // email default accepts "boom@boom", which is kinda no bueno atm
      verification_allowed: Joi.string(),
      amount: Joi.number(),
      subType: Joi.number(),
      customerId: Joi.number()
    })

    Joi.validate(request.payload, schema, function (err, token) {

      if (err) {
        request.logger.error('validation error')
        request.logger.error(err)
        reply('validation error').code(403)
        return
      }

      if (VALID_SUBSCRIPTION_TYPES.indexOf(token.subType) === -1) {
        request.logger.error('invalid subscription type: ' + token.subType + '; email=' + token.email)
        reply('invalid subscription type').code(403)
        return
      }

      // load the customer by email and make sure the ID matches the one passed in
      getCustomer(token.email,function(err, customer) {

        if (err) {
          request.logger.error('error finding customer; email=' + token.email)
          request.logger.error(err)
          reply('error loading customer').code(500)
          return
        }

        if (!customer) {
          request.logger.error('no customer found; email=' + token.email)
          request.logger.error(err)
          reply('customer not found').code(500)
          return
        }

        if (customer.id != token.customerId) {
          request.logger.error('customer does not match ID; ID in db=' + customer.id + ';id passed=' + token.customerId + '; email=' + token.email)
          request.logger.error(err)
          reply('error validating customer ID').code(500)
          return
        }

        // pick a plan based on their selection
        var stripePlan, stripeQuantity, stripeDescription, licenseSeats
        switch(token.subType) {
          case SUB_TYPE_MONTHLY:
            stripePlan = "enterprise-starter-pack"
            stripeDescription = "npm Enterprise Starter Pack"
            licenseSeats = 5
            stripeQuantity = 1
            break
          case SUB_TYPE_ANNUAL:
            stripePlan = "enterprise-starter-pack-annual"
            stripeDescription = "npm Enterprise Starter Pack (annual)"
            licenseSeats = 5
            stripeQuantity = 1
            break
          case SUB_TYPE_MULTI_SEAT:
            stripePlan = "enterprise-multi-seat"
            stripeDescription = "npm Enterprise multi-seat license"
            licenseSeats // TODO: need number of seats
            stripeQuantity = licenseSeats
            break
          default:
            request.logger.error('invalid subscription type: ' + token.subType + '; email=' + token.email)
            reply('invalid subscription type').code(403)
            return
        }

        // actually call stripe, record metrics, tell the client how things went
        var stripeStart = Date.now()
        stripe.customers.create(
          {
            card: token.id, // obtained with Stripe.js
            plan: stripePlan,
            quantity: stripeQuantity,
            email: token.email,
            description: token.email + " " + stripeDescription
          },
          function(err, stripeCustomer) {
            if (err) {
              request.logger.error('internal stripe error; plan=' + stripePlan + ';quantity=' + stripeQuantity + '; email=' + token.email)
              request.logger.error(err)
              reply('internal stripe error').code(500)
              return
            }

            request.metrics.metric({
              name: 'latency',
              value: Date.now() - stripeStart,
              type: 'stripe'
            })

            request.logger.info('Stripe customer created: ', stripeCustomer)

            request.timing.page = 'enterprise-license-paymentProcessed'
            request.metrics.metric({name: request.timing.page})

            // license purchased! We need to update the customer record with their stripe customer ID
            updateCustomer(
              customer.id,
              {
                stripe_customer_id: stripeCustomer.id
              },
              function(er) {

                if(er) {
                  request.logger.error('customer update error; id=' + customer.id)
                  request.logger.error(err)
                  reply('customer update error').code(500)
                  return
                }

                // now, create a new license for this customer and email it to them.
                var subscriptionId = stripeCustomer.subscriptions.data[0].id
                console.log("stripeCustomer.subscriptions",stripeCustomer.subscriptions)
                console.log("stripeCustomer.subscriptions.data[0]",stripeCustomer.subscriptions.data[0])
                console.log("subscription ID",subscriptionId)
                var licenseStart = Date.now()
                createLicense(
                  token.email,
                  licenseSeats,
                  subscriptionId, // Danger! But we just created this customer, so only 1 subscription
                  moment(Date.now()).format(),              // starts now
                  moment(Date.now()).add(1,'years').format(),   // ends a year from now (webhooks will refresh)
                  function(err,license) {
                    if (err) {
                      request.logger.error('license creation error; email=' + token.email + ';seats=' + licenseSeats)
                      request.logger.error(err)
                      reply('license creation error').code(500)
                      return
                    }

                    request.metrics.metric({
                      name: 'latency',
                      value: Date.now() - licenseStart,
                      type: 'licenseCreation'
                    })

                    request.logger.info('Successful license creation: ', license)

                    request.timing.page = 'enterprise-license-created'
                    request.metrics.metric({name: request.timing.page})

                    // now email them the generated license
                    var requirementsUrl = "https://docs.npmjs.com/enterprise/installation#requirements"
                    var instructionsUrl = "https://docs.npmjs.com/enterprise/installation"

                    var mailSettings = config.user.mail
                    var from = mailSettings.emailFrom
                    var transport = require(mailSettings.mailTransportModule);
                    var mailer = nodemailer.createTransport( transport(mailSettings.mailTransportSettings) );
                    var mail = {
                      to: '"' + customer.name + '" <' + customer.email + '>',
                      from: '" npm Enterprise " <' + from + '>',
                      subject : "npm Enterprise license",
                      text: "Hi " + customer.name + " -\r\n\r\n" +
                        "Thanks for licensing npm Enterprise!\r\n\r\n" +
                        "If you've already installed npm Enterprise, log into your npmE server and run\r\n\r\n" +
                        "npme update-license\r\n\r\n" +
                        "and enter your billing email and the new license key, listed below.\r\n\r\n" +
                        "If you've not already installed npm Enterprise, first make sure you have a machine\r\n" +
                        "that meets the installation requirements:\r\n\r\n" +
                        requirementsUrl + "\r\n\r\n" +
                        "Then simply run\r\n\r\n" +
                        "npm install npme\r\n\r\n" +
                        "That's it! When prompted, provide the following information:\r\n\r\n" +
                        "billing email: " + customer.email + "\r\n" +
                        "license key: " + license.license_key + "\r\n\r\n" +
                        "For help with the other questions asked during the installation, read " +
                        "the installation instructions and other documentation:\r\n\r\n" +
                        instructionsUrl + "\r\n\r\n" +
                        "If you have any problems, please email " + from + "\r\n" +
                        "\r\n\r\nnpm loves you.\r\n"
                    };

                    mailer.sendMail(mail, function (er) {

                      if (er) {
                        request.logger.error('Unable to send license to email', opts.email);
                        request.logger.error(er);
                        reply.view('errors/internal', opts).code(500);
                        return;
                      }

                      // everything is a-ok!
                      return reply('License purchase successful').code(200)
                    });
                  }
                )

              }
            )
          }
        )
      })
    })
  }
}
