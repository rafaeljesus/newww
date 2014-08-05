var Joi = require('joi'),
    Hapi = require('hapi'),
    log = require('bole')('company-whoshiring-payments'),
    uuid = require('node-uuid'),
    metrics = require('../../adapters/metrics')();

module.exports = function (options) {
  var stripe = require('stripe')(options.secretkey),
      VALID_CHARGE_AMOUNTS = [35000, 100000];

  return function (request, reply) {
    var addMetric = metrics.addMetric,
        addLatencyMetric = metrics.addPageLatencyMetric,
        timer = { start: Date.now() };

    var opts = {
      user: request.auth.credentials,
      hiring: request.server.methods.hiring.getRandomWhosHiring(),
      title: "Join the Who's Hiring Page"
    }

    if (request.method === 'get') {
      opts.stripeKey = options.publickey;

      timer.end = Date.now();
      addLatencyMetric(timer, 'whoshiring-payments');

      addMetric({name: 'whoshiring-payments'});
      return reply.view('payments', opts);
    }

    var schema = Joi.object().keys({
      email: Joi.string().regex(/^.+@.+\..+$/), // email default accepts "boom@boom", which is kinda no bueno atm
      id: Joi.string().token(),
      amount: Joi.number(),
      livemode: Joi.string(),
      created: Joi.string(),
      used: Joi.string(),
      object: Joi.string(),
      type: Joi.string(),
      card: Joi.object()
    });

    Joi.validate(request.payload, schema, function (err, token) {
      if (err) {
        var errId = uuid.v1();
        log.error(errId + ' ' + Hapi.error.badRequest('there was a validation error'), err);
        return reply('validation error: ' + errId).code(403);
      }

      if (VALID_CHARGE_AMOUNTS.indexOf(token.amount) === -1) {
        var errId = uuid.v1();
        log.error(errId + ' ' + Hapi.error.badRequest('the charge amount of ' + token.amount + ' is invalid'), err);
        return reply('invalid charge amount error: ' + errId).code(403);
      }

      var stripeStart = Date.now();
      stripe.charges.create({
        amount: token.amount,
        currency: "usd",
        card: token.id, // obtained with Stripe.js
        description: "Charge for " + token.email
      }, function(err, charge) {
        if (err) {
          var errId = uuid.v1();
          log.error(errId + ' ' + Hapi.error.internal('something went wrong with the stripe charge'), err);
          return reply('internal stripe error - ' + errId).code(500);
        }

        timer.end = Date.now();
        addMetric({
          name: 'latency',
          value: timer.end - stripeStart,
          type: 'stripe'
        });

        addLatencyMetric(timer, 'whoshiring-paymentProcessed');

        addMetric({name: 'whoshiring-paymentProcessed'});
        return reply('Stripe charge successful').code(200);
      });
    });
  };
}