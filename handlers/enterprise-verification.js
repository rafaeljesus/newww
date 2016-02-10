var _ = require('lodash');
var sendEmail = require('../adapters/send-email');
var CustomerAgent = require('../agents/customer');

module.exports = function verifyEnterpriseTrial(request, reply) {
  var Customer = new CustomerAgent();

  var verifyTrial = request.server.methods.npme.verifyTrial;

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
      err.statusCode = 500;
      reply(err);
      return;
    }

    Customer.getById(trial.customer_id, function(err, customer) {

      if (err) {
        request.logger.error('Unable to get customer', trial.customer_id);
        request.logger.error(err);
        err.statusCode = 500;
        reply(err);
        return;
      }

      Customer.getAllOnSiteLicenses(process.env.NPME_PRODUCT_ID, trial.customer_id, function(err, licenses) {

        if (err) {
          request.logger.error('Unable to get licenses for customer ' + trial.customer_id);
          request.logger.error(err);
          err.statusCode = 500;
          reply(err);
          return;
        }

        // zero licenses bad, more than one license confusing
        if (licenses.length !== 1) {
          var msg = 'zero or more than one license for ' + trial.customer_id;
          var error = new Error(msg);
          error.statusCode = 400;
          request.logger.error(msg, 'licenses: ', licenses);
          reply(error);
          return;
        }

        var requirementsUrl = "https://docs.npmjs.com/enterprise/requirements",
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

        sendEmail('enterprise-verification', mail, request.redis)
          .catch(function(er) {
            request.logger.error('Unable to send license to email', opts.email);
            request.logger.error(er);
            er.statusCode = 500;
            reply(er);
            return;
          })
          .then(function() {
            return reply.view('enterprise/complete', opts);
          });
      });
    });
  });
};
