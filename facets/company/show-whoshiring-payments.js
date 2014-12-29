var Joi = require('joi');

module.exports = function (options) {
  var stripe = require('stripe')(options.secretkey),
      VALID_CHARGE_AMOUNTS = [35000, 100000];

  return function (request, reply) {

    var opts = {
      title: "Join the Who's Hiring Page",
    };

    if (request.method === 'get') {
      opts.stripeKey = options.publickey;

      request.timing.page = 'whoshiring-payments';
      request.metrics.metric({name: 'whoshiring-payments'});
      return reply.view('company/payments', opts);
    }

    var schema = Joi.object().keys({
      id: Joi.string().token(),
      livemode: Joi.string(),
      created: Joi.string(),
      used: Joi.string(),
      object: Joi.string(),
      type: Joi.string(),
      card: Joi.object(),
      email: Joi.string().regex(/^.+@.+\..+$/), // email default accepts "boom@boom", which is kinda no bueno atm
      verification_allowed: Joi.string(),
      amount: Joi.number(),
    });

    Joi.validate(request.payload, schema, function (err, token) {

      if (err) {
        request.logger.error('validation error');
        request.logger.error(err);
        reply('validation error').code(403);
        return;
      }

      if (VALID_CHARGE_AMOUNTS.indexOf(token.amount) === -1) {
        request.logger.error('invalid charge amount: ' + token.amount + '; email=' + token.email);
        reply('invalid charge amount error').code(403);
        return;
      }

      var stripeStart = Date.now();
      stripe.charges.create({
        amount: token.amount,
        currency: "usd",
        card: token.id, // obtained with Stripe.js
        description: "Charge for " + token.email
      }, function(err, charge) {

        if (err) {
          request.logger.error('internal stripe error; amount=' + token.amount + '; email=' + token.email);
          request.logger.error(err);
          reply('internal stripe error').code(500);
          return;
        }

        request.metrics.metric({
          name: 'latency',
          value: Date.now() - stripeStart,
          type: 'stripe'
        });

        request.logger.info('Successful charge: ', charge);

        request.timing.page = 'whoshiring-paymentProcessed';
        request.metrics.metric({name: 'whoshiring-paymentProcessed'});

        return reply('Stripe charge successful').code(200);
      });
    });
  };
};
