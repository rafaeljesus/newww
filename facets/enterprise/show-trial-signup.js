
var config = require('../../config');

// if they agree to the ULA, notify hubspot, create a trial and send verification link

module.exports = function trialSignup (request, reply) {
  var postToHubspot = request.server.methods.npme.sendData,
      getCustomer = request.server.methods.npme.getCustomer;

  var opts = {};

  // we can trust the email is fine because we've verified it in the show-ula handler
  var data = { email: request.payload.customer_email };

  postToHubspot(config.license.hubspot.form_npme_agreed_ula, data, function (er) {

    if (er) {
      request.logger.error('Could not hit ULA notification form on Hubspot');
      request.logger.error(er);
      reply.view('errors/internal', opts).code(500);
      return;
    }

    getCustomer(data.email, function (err, customer) {

      if (err) {
        request.logger.error('Unknown problem with customer record');
        request.logger.error(err);
        reply.view('errors/internal', opts).code(500);
        return;
      }

      if (!customer) {
        request.logger.error('Unable to locate customer error ' + data.email);
        reply.view('errors/internal', opts).code(500);
        return;
      }

      if (customer && customer.id + '' === request.payload.customer_id + '') {
        return createTrialAccount(request, reply, customer);
      }

      request.logger.error('Unable to verify customer record ', data.email);
      reply.view('errors/internal', opts).code(500);
    });
  });
};

function createTrialAccount(request, reply, customer) {

  var createTrial = request.server.methods.npme.createTrial;

  var opts = {};

  createTrial(customer, function (er, trial) {
    if (er) {
      request.logger.error('There was an error with creating a trial for ', customer.id);
      request.logger.error(er);
      reply.view('errors/internal', opts).code(500);
      return;
    }

    return sendVerificationEmail(request, reply, customer, trial);
  });
}

function sendVerificationEmail (request, reply, customer, trial) {

  var opts = {};

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

  request.server.methods.email.send(mail, function (er) {

    if (er) {
      request.logger.error('Unable to send verification email to ', customer);
      request.logger.error(er);
      reply.view('errors/internal', opts).code(500);
      return;
    }

    if (process.env.NODE_ENV === 'dev') {
      opts.mail = JSON.stringify(mail);
    }

    return reply.view('enterprise/thanks', opts);
  });

}
