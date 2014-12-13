var NAMESPACE = 'company-send-contact';

var Hapi = require('hapi'),
    userValidate = require('npm-user-validate'),
    nodemailer = require('nodemailer'),
    crypto = require('crypto');

var transport, mailer;

module.exports = function (options) {
  return function (request, reply) {

    var showError = request.server.methods.errors.showError(reply);

    var opts = {
      user: request.auth.credentials,
      namespace: NAMESPACE
    };

    var from = options.emailFrom;
    var data = request.payload;

    var mail = {
      to: data.inquire === "support" ? "support <support@npmjs.com>" : "npm <npm@npmjs.com>",
      from: "Support Contact Form <support@npmjs.com>",
      subject: data.subject + " - FROM: " + '"' + data.name + '" <' + data.email + '>',
      text: data.message
    };

    if (process.env.NODE_ENV === 'dev') {

      return reply(mail);

    } else {
      var mailSettings = options;

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

        opts.sent = true;
        return reply.view('company/contact', opts);
      });
    }
  }
}
