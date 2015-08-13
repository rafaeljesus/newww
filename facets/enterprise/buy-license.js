var Joi = require('joi');
var moment = require('moment');

var stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
var SUB_TYPE_MONTHLY = 1,
  SUB_TYPE_ANNUAL = 2,
  SUB_TYPE_MULTI_SEAT = 3;

module.exports = function(request, reply) {

  var createLicense = request.server.methods.npme.createLicense;
  var getCustomer = request.server.methods.npme.getCustomer;
  var updateCustomer = request.server.methods.npme.updateCustomer;

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
    subType: Joi.number().valid([1, 2, 3]),
    quantity: Joi.number(),
    customerId: Joi.number()
  });

  Joi.validate(request.payload, schema, function(err, token) {

    if (err) {
      request.logger.error('validation error');
      request.logger.error(err);
      reply('validation error').code(403);
      return;
    }

    // load the customer by email and make sure the ID matches the one passed in
    getCustomer(token.email, function(err, customer) {

      if (err) {
        request.logger.error('error finding customer; email=' + token.email);
        request.logger.error(err);
        reply('error loading customer').code(500);
        return;
      }

      if (!customer) {
        request.logger.error('no customer found; email=' + token.email);
        reply('customer not found').code(500);
        return;
      }

      if (customer.id !== token.customerId) {
        request.logger.error('customer does not match ID; ID in db=' + customer.id + ';id passed=' + token.customerId + '; email=' + token.email);
        reply('error validating customer ID').code(500);
        return;
      }

      // pick a plan based on their selection
      var stripePlan, stripeQuantity, stripeDescription, licenseSeats;
      switch (token.subType) {
        case SUB_TYPE_MONTHLY:
          stripePlan = "enterprise-starter-pack";
          stripeDescription = "npm Enterprise Starter Pack";
          licenseSeats = 5;
          stripeQuantity = 1;
          break;
        case SUB_TYPE_ANNUAL:
          stripePlan = "enterprise-starter-pack-annual";
          stripeDescription = "npm Enterprise Starter Pack (annual)";
          licenseSeats = 5;
          stripeQuantity = 1;
          break;
        case SUB_TYPE_MULTI_SEAT:
          stripePlan = "enterprise-multi-seat";
          stripeDescription = "npm Enterprise multi-seat license";
          licenseSeats = token.quantity;
          stripeQuantity = licenseSeats;
          break;
        default:
          request.logger.error('invalid subscription type: ' + token.subType + '; email=' + token.email);
          reply('invalid subscription type').code(403);
          return;
      }

      // actually call stripe, record metrics, tell the client how things went
      var stripeStart = Date.now();

      stripe.customers.create({
        card: token.id, // obtained with Stripe.js
        plan: stripePlan,
        quantity: stripeQuantity,
        email: token.email,
        description: token.email + " " + stripeDescription
      }, function(err, stripeCustomer) {

        if (err) {
          console.log(err)
          request.logger.error('internal stripe error; plan=' + stripePlan + ';quantity=' + stripeQuantity + '; email=' + token.email);
          request.logger.error(err);
          reply('internal stripe error').code(500);
          return;
        }

        request.metrics.metric({
          name: 'latency.stripe',
          value: Date.now() - stripeStart,
        });

        request.logger.info('Stripe customer created: ', stripeCustomer);
        request.timing.page = 'enterprise-license-paymentProcessed';

        // license purchased! We need to update the customer record with their stripe customer ID
        updateCustomer(customer.id, {
          stripe_customer_id: stripeCustomer.id
        }, function(er) {

          if (er) {
            request.logger.error('customer update error; id=' + customer.id);
            request.logger.error(er);
            reply('customer update error').code(500);
            return;
          }

          // now, create a new license for this customer and email it to them.
          var subscriptionId = stripeCustomer.subscriptions.data[0].id;
          var licenseStart = Date.now();

          var licenseDetails = {
            billingEmail: token.email,
            seats: licenseSeats,
            stripeId: subscriptionId, // Danger! But we just created this customer, so only 1 subscription
            begins: moment(Date.now()).format(), // starts now
            ends: moment(Date.now()).add(1, 'years').format(), // ends a year from now (webhooks will refresh)
          };

          createLicense(licenseDetails, function(err, license) {

            if (err) {
              request.logger.error('license creation error; email=' + token.email + ';seats=' + licenseSeats);
              request.logger.error(err);
              reply('license creation error').code(500);
              return;
            }

            request.metrics.metric({
              name: 'latency.licenseCreation',
              value: Date.now() - licenseStart,
            });

            request.logger.info('Successful license creation: ', license);
            request.timing.page = 'enterprise-license-created';

            // now email them the generated license
            var sendEmail = request.server.methods.email.send;

            var data = {
              requirementsUrl: "https://docs.npmjs.com/enterprise/installation#requirements",
              instructionsUrl: "https://docs.npmjs.com/enterprise/installation",
              name: customer.name,
              email: customer.email,
              license_key: license.license_key
            };

            sendEmail('enterprise-send-license', data, request.redis)
              .catch(function(er) {
                request.logger.error('Unable to send license to email', customer.email);
                request.logger.error(er);
                return reply('unable to send license email').code(500);
              })
              .then(function() {
                return reply('License purchase successful').code(200);
              });

          });
        });
      });
    });
  });
};
