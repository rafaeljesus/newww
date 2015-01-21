var mailConfig = require('../../../config').user.mail;

module.exports = function (user, token, from) {

  var fromEmail = from || mailConfig.emailFrom;
  var u = mailConfig.canonicalHost + '/confirm-email/' + encodeURIComponent(token);

  var text = "You are receiving this because you (or someone else) have " +
      "signed up for an npm user account for the username '" +
      user.name +
      "'.\r\n\r\n" +
      "Please click on the following link, or paste this into your " +
      "browser to confirm that this is the email address associated with your account:\r\n\r\n" +
      "    " + u + "\r\n\r\n" +
      "If you received this in error, you can safely ignore it.\r\n" +
      "The request will expire in one week.\r\n\r\n" +
      "You can reply to this message, or email\r\n    " +
      fromEmail + "\r\nif you have questions." +
      " \r\n\r\nnpm loves you.\r\n";


  var mail = {
    to: '"' + user.name + '" <' + user.email + '>',
    from: fromEmail,
    subject : "Please confirm your npm account email address",
    headers: { "X-SMTPAPI": { category: "password-reset" } },
    text: text
  };

  return mail;
};