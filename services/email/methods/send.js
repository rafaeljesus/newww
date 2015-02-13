var log = require('bole')('email-send'),
    mailOptions = require('../../../config').user.mail,
    nodemailer = require('nodemailer');

var transport = require(mailOptions.mailTransportModule),
    mailer = nodemailer.createTransport( transport(mailOptions.mailTransportSettings) );

module.exports = function send (mail, callback) {

  mailer.sendMail(mail, function (er) {
    if (er) {
      log.error('unable to send email to ' + mail.to);
      log.error(er);
      return callback(er);
    }

    return callback(null);
  });
};