var Hoek = require('hoek'),
    Joi = require('joi'),
    utils = require('../../lib/utils');

module.exports = function createHubspotLead (request, reply) {
  var postToHubspot = request.server.methods.npme.sendData;

  var opts = { };

  var schema = Joi.object().keys({
    firstname: Joi.string().required(),
    lastname: Joi.string().required(),
    email: Joi.string().regex(/^.+@.+\..+$/).required(), // email default accepts "boom@boom", which is kinda no bueno atm
    phone: Joi.string().required(),
    company: Joi.string().required(),
    numemployees: Joi.string().optional(),
    comments: Joi.string().optional().allow('')
  });

  var joiOptions = {
    convert: false,
    abortEarly: false
  };

  var validatedData = Joi.validate(request.payload, schema, joiOptions);

  if (validatedData.error) {
    opts.errors = validatedData.error.details;
    return reply.view('enterprise/index', opts).code(400);
  }

  var data = {
    hs_context: {
      pageName: "enterprise-signup",
      ipAddress: utils.getUserIP(request)
    }
  };

  data = Hoek.applyToDefaults(data, validatedData.value);

  postToHubspot(process.env.HUBSPOT_FORM_NPME_SIGNUP, data, function (er) {
    if (er) {
      request.logger.error('Could not send signup data to hubspot');
      request.logger.error(er);
      reply.view('errors/internal', opts).code(500);
      return;
    }

    return getOrCreateCustomer(request, reply, data);
  });
};

function getOrCreateCustomer (request, reply, data) {
  var getCustomer = request.server.methods.npme.getCustomer,
      createCustomer = request.server.methods.npme.createCustomer;

  var opts = { };

  getCustomer(data.email, function (err, customer) {

    if (err) {
      request.logger.error('There was an error with getting customer ' + data.email);
      request.logger.error(err);
      reply.view('errors/internal', opts);
      return;
    }

    if (customer) {
      // they're already a customer
      return showClickThroughAgreement(reply, customer);
    }

    // new customer, needs to be created
    createCustomer(data, function (err, newCustomer) {

      if (err) {
        request.logger.error('There was an error creating customer ' + data.email);
        request.logger.error(err);
        reply.view('errors/internal', opts).code(500);
        return;
      }

      return showClickThroughAgreement(reply, newCustomer);
    });
  });
}

function showClickThroughAgreement (reply, customer) {
  // we use both email and ID so people can't just guess an ID to get a license

  var opts = {
    title: "Get started with npm Enterprise",
    customer_id: customer.id,
    customer_email: customer.email
  };

  return reply.view('enterprise/clickThroughAgreement', opts);
}
