var Joi = require('joi');

// if they decide not to agree to the ULA
// hit the hubspot contact-me form instead, and thank them
module.exports = function contactMe (request, reply) {
  var postToHubspot = request.server.methods.npme.sendData;

  var opts = { };

  // Is email invalid?
  if (Joi.validate(request.payload.contact_customer_email, Joi.string().regex(/^.+@.+\..+$/)).error) {
    return reply.view('enterprise/index').code(400);
  }

  var data = { email: request.payload.contact_customer_email };

  postToHubspot(process.env.HUBSPOT_FORM_NPME_CONTACT_ME, data, function(er) {

      if (er) {
        request.logger.error('Could not contact hubspot to register user');
        request.logger.error(er);
        return reply.view('errors/internal', opts).code(500);
      } else {

        opts.title = 'We will contact you shortly';
        return reply.view('enterprise/contact-me', opts);
      }
    }
  );

};
