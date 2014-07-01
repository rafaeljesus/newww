var Joi = require('joi'),
    Hapi = require('hapi'),
    log = require('bole')('company-whoshiring-payments'),
    uuid = require('node-uuid');

module.exports = function (options) {
  var stripe = require('stripe')(options.secretkey);

  return function (request, reply) {
    var opts = {
      user: request.auth.credentials,
      hiring: request.server.methods.getRandomWhosHiring(),
      title: "Join the Who's Hiring Page"
    }

    if (request.method === 'get') {
      opts.stripeKey = options.publickey;

      return reply.view('payments', opts);
    }

    var schema = Joi.object().keys({
      email: Joi.string().regex(/^.+@.+\..+$/), // email default accepts "boom@boom", which is kinda no bueno atm
      id: Joi.string().token(),
      amount: Joi.number().valid([35000, 100000])
    });

    Joi.validate(request.payload, schema, function (err, token) {
      if (err) {
        var errId = uuid.v1();
        log.error(errId + ' ' + Hapi.error.badRequest('there was a validation error'), err);
        return reply('validation error: ' + errId).code(403);
      }

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

        return reply('Stripe charge successful').code(200);
      });
    });
  };
}