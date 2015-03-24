var NAMESPACE = 'company-send-contact';

var Hapi = require('hapi'),
    userValidate = require('npm-user-validate'),
    nodemailer = require('nodemailer'),
    crypto = require('crypto');

var transport, mailer;

module.exports = function showSendContact(options) {
  return function (request, reply) {

    var opts = {
      user: request.auth.credentials,
      namespace: NAMESPACE
    };

    var from = options.emailFrom;
    var data = request.payload;

    var recipient;
    switch (data.inquire) {
      case "support":
        recipient = "support <support@npmjs.com>";
        break;
      case "security":
        recipient = "security <security@npmjs.com>";
        break;
      default:
        recipient = "npm <npm@npmjs.com>";
        break;
    }

    var mail = {
      to: recipient,
      from: "Support Contact Form <support@npmjs.com>",
      subject: data.subject + " - FROM: " + '"' + data.name + '" <' + data.email + '>',
      text: data.message
    };

    if (process.env.NODE_ENV === 'dev') {

      return reply(mail);

    } else {
      var mailSettings = options;

      var transport = require(mailSettings.mailTransportModule);
      var mailer = nodemailer.createTransport( transport(mailSettings.mailTransportSettings) );

      mailer.sendMail(mail, function (er, result) {
        if (er) {
          request.logger.error('unable to send verification email');
          request.logger.error(er);
          return reply.view('errors/internal', opts).code(500);
        }

        opts.sent = true;
        return reply.view('company/contact', opts);
      });
    }
  }
}
