var NAMESPACE = 'enterprise-contact-me';

var Hoek = require('hoek'),
    Hapi = require('hapi'),
    log = require('bole')(NAMESPACE),
    uuid = require('node-uuid'),
    metrics = require('newww-metrics')();

var config = require('../../config').license;

// if they decide not to agree to the ULA
// hit the hubspot contact-me form instead, and thank them
module.exports = function contactMe (request, reply) {
  var postToHubspot = request.server.methods.npme.sendData,
      showError = request.server.methods.errors.showError(reply);

  var opts = {
    user: request.auth.credentials,
    hiring: request.server.methods.hiring.getRandomWhosHiring(),
    namespace: NAMESPACE
  };

  var data = { email: request.payload.contact_customer_email };

  postToHubspot(config.hubspot.form_npme_contact_me, data, function(er) {

      if (er) {
        log.warn("Could not contact hubspot");

        return showError(er, 500, 'Could not register user to be contacted', opts);
      } else {

        opts.title = "We will contact you shortly";

        return reply.view('enterprise/contact-me', opts);
      }
    }
  );
}