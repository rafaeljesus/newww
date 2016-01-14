var Joi = require('joi'),
  utils = require('../lib/utils');
var VError = require('verror');

// if they decide not to agree to the ULA
// hit the hubspot contact-me form instead, and thank them
module.exports = function contactMe(request, reply) {
  var postToHubspot = request.server.methods.npme.sendData;

  var opts = { };

  // Is email invalid?
  if (Joi.validate(request.payload.contact_customer_email, Joi.string().regex(/^.+@.+\..+$/)).error) {
    return reply.view('enterprise/index').code(400);
  }

  var data = {
    hs_context: {
      pageName: "enterprise-contact-me",
      ipAddress: utils.getUserIP(request)
    },
    email: request.payload.contact_customer_email,
  };

  postToHubspot(process.env.HUBSPOT_FORM_NPME_CONTACT_ME, data, function(err) {

    if (err) {
      return reply(new VError(err, "Could not contact hubspot to register user"));
    } else {
      opts.title = 'We will contact you shortly';
      return reply.view('enterprise/contact-me', opts);
    }
  });

};
