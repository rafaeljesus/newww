var NAMESPACE = 'enterprise-verify';

var Hoek = require('hoek'),
    Hapi = require('hapi'),
    url = require('url'),
    nodemailer = require('nodemailer');

var config = require('../../config');

module.exports = function verifyEnterpriseTrial (request, reply) {
  var verifyTrial = request.server.methods.npme.verifyTrial,
      getCustomer = request.server.methods.npme.getCustomer,
      getLicenses = request.server.methods.npme.getLicenses,
      showError = request.server.methods.errors.showError(reply);

  var opts = {
    user: request.auth.credentials,

    namespace: NAMESPACE
  };

  if (!request.query.v) {
    return showError(request.url, 404, 'Could not find verification key', opts);
  }

  verifyTrial(request.query.v, function (err, trial) {
    if (err) {
      return showError(err, 500, 'There was a problem with verifying the trial', opts);
    }

    getCustomer(trial.customer_id, function (err, customer) {
      if (err) {
        return showError(err, 500, 'could not get customer from hubspot', opts);
      }

      getLicenses(config.npme.product_id, trial.customer_id, function (err, licenses) {

        if (err) {
          return showError(err, 500, 'could not get licenses from hubspot', opts);
        }

        // zero licenses bad, more than one license confusing
        if (licenses.length != 1) {
          return showError(licenses.length, 400, 'zero or more than one license for ' + trial.customer_id, opts);
        }

        var mailSettings = config.user.mail;

        var from = mailSettings.emailFrom,
            requirementsUrl = "https://docs.npmjs.com/enterprise/installation#requirements",
            instructionsUrl = "https://docs.npmjs.com/enterprise/installation",
            license = licenses[0];

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
        }

        opts = Hoek.applyToDefaults(opts, enterpriseOpts);

        if (process.env.NODE_ENV === 'dev') {

          opts.mail = JSON.stringify(mail);
          return reply.view('enterprise/complete', opts);

        } else {
          if (!mailSettings.mailTransportModule ||
              !mailSettings.mailTransportSettings) {
            return showError(null, 500, 'Mail settings are missing!', opts);
          }
          var transport = require(mailSettings.mailTransportModule);
          var mailer = nodemailer.createTransport( transport(mailSettings.mailTransportSettings) );

          mailer.sendMail(mail, function (er, result) {
            if (er) {
              return showError(er, 500, "Unable to send license to email", opts);
            }

            return reply.view('enterprise/complete', opts);
          });
        }
      });
    });

  });
}
