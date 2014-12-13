var Joi = require('joi'),
    Hapi = require('hapi'),
    log = require('bole')('company-whoshiring-payments'),
    uuid = require('node-uuid');

module.exports = function (options) {
  var stripe = require('stripe')(options.secretkey),
      VALID_CHARGE_AMOUNTS = [35000, 100000];

  return function (request, reply) {
    var showError = request.server.methods.errors.showError(reply),
        timer = { start: Date.now() };

    var opts = {
      user: request.auth.credentials,

      title: "Join the Who's Hiring Page",
      namespace: 'company-whoshiring-payments'
    };

    if (request.method === 'get') {
      opts.stripeKey = options.publickey;

      timer.end = Date.now();

      request.timing.page = 'whoshiring-payments';
      request.metrics.metric({name: 'whoshiring-payments'});
      return reply.view('company/payments', opts);
    }

    opts.isXhr = true;

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
        return showError(err, 403, 'validation error', opts);
      }

      if (VALID_CHARGE_AMOUNTS.indexOf(token.amount) === -1) {
        return showError(token.amount, 403, 'invalid charge amount error', opts);
      }

      var stripeStart = Date.now();
      stripe.charges.create({
        amount: token.amount,
        currency: "usd",
        card: token.id, // obtained with Stripe.js
        description: "Charge for " + token.email
      }, function(err, charge) {
        if (err) {
          return showError(token.amount, 500, 'internal stripe error', opts);
        }

        request.metrics.metric({
          name: 'latency',
          value: Date.now() - stripeStart,
          type: 'stripe'
        });

        request.timing.page = 'whoshiring-paymentProcessed';
        request.metrics.metric({name: 'whoshiring-paymentProcessed'});

        return reply('Stripe charge successful').code(200);
      });
    });
  };
}
