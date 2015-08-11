
var Joi = require('joi'),
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY),
  VALID_CHARGE_AMOUNTS = [35000, 100000];

module.exports = function(request, reply) {

  var opts = {
    title: "Join the Who's Hiring Page",
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
  };

  if (request.method === 'get') {
    request.timing.page = 'whoshiring-paymentShow';
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
    client_ip: Joi.string()
  });

  Joi.validate(request.payload, schema, function(err, token) {
    if (err) {
      request.logger.error('validation error');
      request.logger.error(err);
      return reply('validation error').code(403);
    }

    if (VALID_CHARGE_AMOUNTS.indexOf(token.amount) === -1) {
      request.logger.error('internal charge amount error; token amount is ', token.amount);
      request.logger.error(err);
      return reply('invalid charge amount error').code(403);
    }

    var stripeStart = Date.now();
    stripe.charges.create({
      amount: token.amount,
      currency: "usd",
      card: token.id, // obtained with Stripe.js
      description: "Charge for " + token.email
    }, function(err) {
      if (err) {
        request.logger.error('internal stripe error; token amount is ', token.amount);
        request.logger.error(err);
        return reply('internal stripe error').code(500);
      }

      request.metrics.metric({
        name: 'latency.stripe',
        value: Date.now() - stripeStart,
      });

      return reply('Stripe charge successful').code(200);
    });
  });
};
