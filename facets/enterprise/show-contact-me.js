var NAMESPACE = 'enterprise-contact-me';

var Hoek = require('hoek'),
    Hapi = require('hapi'),
    Joi = require('joi');

var config = require('../../config').license;

// if they decide not to agree to the ULA
// hit the hubspot contact-me form instead, and thank them
module.exports = function contactMe (request, reply) {
  var postToHubspot = request.server.methods.npme.sendData;

  var opts = {
    user: request.auth.credentials,

    namespace: NAMESPACE
  };

  // Is email invalid?
  if (Joi.validate(request.payload.contact_customer_email, Joi.string().regex(/^.+@.+\..+$/)).error) {
    return reply.view('enterprise/index').code(400);
  }

  var data = { email: request.payload.contact_customer_email };

  postToHubspot(config.hubspot.form_npme_contact_me, data, function(er) {

      if (er) {
        request.logger.warn('Could not contact hubspot to register user');
        return reply.view('errors/internal', opts).code(500);
      } else {

        opts.title = 'We will contact you shortly';
        return reply.view('enterprise/contact-me', opts);
      }
    }
  );

}
