var NAMESPACE = 'enterprise-ula';

var Hoek = require('hoek'),
    Joi = require('joi'),
    Hapi = require('hapi');

var config = require('../../config').license;

module.exports = function createHubspotLead (request, reply) {
  var postToHubspot = request.server.methods.npme.sendData,
      showError = request.server.methods.errors.showError(reply);

  var opts = {
    user: request.auth.credentials,
    namespace: NAMESPACE
  };

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
      pageName: "enterprise-signup"
    }
  };

  data = Hoek.applyToDefaults(data, validatedData.value);

  postToHubspot(config.hubspot.form_npme_signup, data, function (er) {
    if (er) {
      return showError(er, 500, 'Could not register details to hubspot', opts);
    }

    return getOrCreateCustomer(request, reply, data);
  });
}

function getOrCreateCustomer (request, reply, data) {
  var getCustomer = request.server.methods.npme.getCustomer,
      createCustomer = request.server.methods.npme.createCustomer,
      showError = request.server.methods.errors.showError(reply);

  var opts = {
    user: request.auth.credentials,

    namespace: NAMESPACE
  };

  getCustomer(data.email, function (err, customer) {

    if (err) {
      return showError(err, 500, "There was an unknown problem with the customer error", opts);
    }

    if (customer) {
      // they're already a customer
      return showClickThroughAgreement(reply, customer)
    }

    // new customer, needs to be created
    createCustomer(data, function (err, newCustomer) {
      if (err) {
        return showError(err, 500, "There was a problem creating the customer record", opts);
      }

      return showClickThroughAgreement(reply, newCustomer);
    });
  })
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
