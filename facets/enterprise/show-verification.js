var _ = require('lodash');

module.exports = function verifyEnterpriseTrial(request, reply) {
  var verifyTrial = request.server.methods.npme.verifyTrial,
    getCustomer = request.server.methods.npme.getCustomer,
    getLicenses = request.server.methods.npme.getLicenses;

  var opts = { };

  if (!request.query.v) {
    request.logger.error('Could not find verification key', request.query);
    reply.view('errors/not-found', opts).code(404);
    return;
  }

  verifyTrial(request.query.v, function(err, trial) {

    if (err) {
      request.logger.error('Unable to verify the trial', request.query.v);
      request.logger.error(err);
      reply.view('errors/internal', opts).code(500);
      return;
    }

    getCustomer(trial.customer_id, function(err, customer) {

      if (err) {
        request.logger.error('Unable to get customer from hubspot', trial.customer_id);
        request.logger.error(err);
        reply.view('errors/internal', opts).code(500);
        return;
      }

      getLicenses(process.env.NPME_PRODUCT_ID, trial.customer_id, function(err, licenses) {

        if (err) {
          request.logger.error('Unable to get licenses from hubspot for customer ' + trial.customer_id);
          request.logger.error(err);
          reply.view('errors/internal', opts).code(500);
          return;
        }

        // zero licenses bad, more than one license confusing
        if (licenses.length !== 1) {
          request.logger.error('zero or more than one license for ' + trial.customer_id, 'licenses: ', licenses);
          reply.view('errors/internal', opts).code(400);
          return;
        }

        var requirementsUrl = "https://docs.npmjs.com/enterprise/installation#requirements",
          instructionsUrl = "https://docs.npmjs.com/enterprise/installation",
          license = licenses[0];

        var mail = {
          name: customer.name,
          email: customer.email,
          license_key: license.license_key
        };

        opts = {
          title: "Signup complete!",
          requirementsUrl: requirementsUrl,
          instructionsUrl: instructionsUrl
        };

        opts = _.extend({}, opts, mail);

        var sendEmail = request.server.methods.email.send;

        sendEmail('enterprise-verification', mail, request.redis)
          .catch(function(er) {
            request.logger.error('Unable to send license to email', opts.email);
            request.logger.error(er);
            reply.view('errors/internal', opts).code(500);
            return;
          })
          .then(function() {
            return reply.view('enterprise/complete', opts);
          });
      });
    });
  });
};
