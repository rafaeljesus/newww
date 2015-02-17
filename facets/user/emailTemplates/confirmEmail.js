var mailConfig = require('../../../config').user.mail,
  MustacheMailer = require('mustache-mailer'),
  path = require('path'),
  mm = new MustacheMailer({
    transport: require(mailConfig.mailTransportModule)(mailConfig.mailTransportSettings),
    templateDir: path.dirname(require.resolve('npm-email-templates/package.json'))
  });

module.exports = function (user, token) {
  var fromEmail = mailConfig.emailFrom;
  var confirmLink = mailConfig.canonicalHost + '/confirm-email/' + encodeURIComponent(token);
  var mailOpts = {
    to: '"' + user.name + '" <' + user.email + '>',
    name: user.name,
    from: fromEmail,
    subject : "Please confirm your npm account email address",
    headers: { "X-SMTPAPI": { category: "password-reset" } },
    confirmLink: confirmLink
  };

  mm.message('confirm-user-email')
    .then(function(msg) {
      return msg.sendMail(mailOpts)
    });
};
