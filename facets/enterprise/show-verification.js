var Hoek = require('hoek'),
    nodemailer = require('nodemailer');

var config = require('../../config');

module.exports = function verifyEnterpriseTrial (request, reply) {
  var verifyTrial = request.server.methods.npme.verifyTrial,
      getCustomer = request.server.methods.npme.getCustomer,
      getLicenses = request.server.methods.npme.getLicenses;

  var opts = { };

  if (!request.query.v) {
    request.logger.error('Could not find verification key', request.query);
    reply.view('errors/not-found', opts).code(404);
    return;
  }

  verifyTrial(request.query.v, function (err, trial) {

    if (err) {
      request.logger.error('Unable to verify the trial', request.query.v);
      request.logger.error(err);
      reply.view('errors/internal', opts).code(500);
      return;
    }

    getCustomer(trial.customer_id, function (err, customer) {

      if (err) {
        request.logger.error('Unable to get customer from hubspot', trial.customer_id);
        request.logger.error(err);
        reply.view('errors/internal', opts).code(500);
        return;
      }

      getLicenses(config.npme.product_id, trial.customer_id, function (err, licenses) {

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

        var mailSettings = config.user.mail;

        var from = mailSettings.emailFrom,
            requirementsUrl = "https://docs.npmjs.com/enterprise/installation#requirements",
            instructionsUrl = "https://docs.npmjs.com/enterprise/installation",
            license = licenses[0];

        console.log("license: ",license)

        var mail = {
          to: '"' + customer.name + '" <' + customer.email + '>',
          from: '" npm Enterprise " <' + from + '>',
          subject : "npm Enterprise: trial license key and instructions",
          text: "Hi " + customer.name + " -\r\n\r\n" +
            "Thanks for trying out npm Enterprise!\r\n\r\n" +
            "To get started, make sure you have a machine that meets the installation requirements:\r\n\r\n" +
            requirementsUrl + "\r\n\r\n" +
            "Then simply run\r\n\r\n" +
            "npm install npme\r\n\r\n" +
            "That's it! When prompted, provide the following information:\r\n\r\n" +
            "billing email: " + customer.email + "\r\n" +
            "license key: " + license.license_key + "\r\n\r\n" +
            "For help with the other questions asked during the installation, read " +
            "the installation instructions and other documentation:\r\n\r\n" +
            instructionsUrl + "\r\n\r\n" +
            "If you have any problems, please email " + from + "\r\n" +
            "\r\n\r\nnpm loves you.\r\n"
        };

        var enterpriseOpts = {
          title: "Signup complete!",
          requirementsUrl: requirementsUrl,
          instructionsUrl: instructionsUrl,
          email: customer.email,
          license_key: license.license_key,
          supportEmail: from
        };

        opts = Hoek.applyToDefaults(opts, enterpriseOpts);

        if (process.env.NODE_ENV === 'dev') {

          opts.mail = JSON.stringify(mail);
          return reply.view('enterprise/complete', opts);

        } else {

          var transport = require(mailSettings.mailTransportModule);
          var mailer = nodemailer.createTransport( transport(mailSettings.mailTransportSettings) );

          mailer.sendMail(mail, function (er) {

            if (er) {
              request.logger.error('Unable to send license to email', opts.email);
              request.logger.error(er);
              reply.view('errors/internal', opts).code(500);
              return;
            }

            return reply.view('enterprise/complete', opts);
          });
        }
      });
    });

  });
};
