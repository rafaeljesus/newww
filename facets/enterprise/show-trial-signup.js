var NAMESPACE = 'enterprise-trial-signup';

var Hoek = require('hoek'),
    Hapi = require('hapi'),
    nodemailer = require('nodemailer');

var config = require('../../config');

// if they agree to the ULA, notify hubspot, create a trial and send verification link

module.exports = function trialSignup (request, reply) {
  var postToHubspot = request.server.methods.npme.sendData,
      getCustomer = request.server.methods.npme.getCustomer,
      showError = request.server.methods.errors.showError(request, reply);

  var opts = {
    user: request.auth.credentials,

    namespace: NAMESPACE
  };

  var data = { email: request.payload.customer_email };
  postToHubspot(config.license.hubspot.form_npme_agreed_ula, data, function (er) {

    if (er) {
      request.logger.warn("Could not hit ULA notification form on Hubspot");
      return showError(er, 500, "could not register agreement to the license", opts);
    }

    getCustomer(data.email, function (err, customer) {
      if (err) {
        return showError(err, 500, "Unknown problem with customer record", opts);
      }

      if (!customer) {
        return showError(err, 500, "Unable to locate customer record", opts);
      }

      if (customer && customer.id + '' === request.payload.customer_id + '') {
        return createTrialAccount(request, reply, customer);
      }

      return showError(null, 500, "unable to verify customer record", opts);
    })
  });
}

function createTrialAccount(request, reply, customer) {
  var createTrial = request.server.methods.npme.createTrial,
      showError = request.server.methods.errors.showError(request, reply);

  var opts = {
    user: request.auth.credentials,

    namespace: NAMESPACE
  };

  createTrial(customer, function (er, trial) {
    if (er) {
      return showError(er, 500, "There was an error with creating a trial", opts);
    }

    return sendVerificationEmail(request, reply, customer, trial);
  })
}

function sendVerificationEmail (request, reply, customer, trial) {
  var showError = request.server.methods.errors.showError(request, reply);

  var opts = {
    user: request.auth.credentials,

    namespace: NAMESPACE
  };

  var from = config.user.mail.emailFrom;

  var mail = {
    to: '"' + customer.name + '" <' + customer.email + '>',
    from: '" npm Enterprise " <' + from + '>',
    subject: "npm Enterprise: please verify your email",
    text: "Hi " + customer.name + " -\r\n\r\n" +
      "Thanks for trying out npm Enterprise!\r\n\r\n" +
      "To get started, please click this link to verify your email address:\r\n\r\n" +
      "https://www.npmjs.com/enterprise-verify?v=" + trial.verification_key + "\r\n\r\n" +
      "Thanks!\r\n\r\n" +
      "If you have questions or problems, you can reply to this message,\r\n" +
      "or email " + from + "\r\n" +
      "\r\n\r\nnpm loves you.\r\n"
  };

  if (process.env.NODE_ENV === 'dev') {

    opts.mail = JSON.stringify(mail);

    return reply.view('enterprise/thanks', opts);

  } else {
    var mailSettings = config.user.mail;

    if (!mailSettings.mailTransportModule ||
        !mailSettings.mailTransportSettings) {
      return showError(null, 500, 'Mail settings are missing!', opts);
    }
    var transport = require(mailSettings.mailTransportModule);
    var mailer = nodemailer.createTransport( transport(mailSettings.mailTransportSettings) );

    mailer.sendMail(mail, function (er, result) {
      if (er) {
        return showError(er, 500, "Unable to send verification email", opts);
      }

      return reply.view('enterprise/thanks', opts);
    });
  }
}
