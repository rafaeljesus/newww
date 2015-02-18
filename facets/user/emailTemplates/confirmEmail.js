var mailConfig = require('../../../config').user.mail,
  MustacheMailer = require('mustache-mailer'),
  path = require('path'),
  mm = new MustacheMailer({
    transport: require(mailConfig.mailTransportModule)(mailConfig.mailTransportSettings),
    templateDir: path.dirname(require.resolve('npm-email-templates/package.json'))
  });

module.exports = function (user) {
  var mailOpts = {
    email: user.email,
    name: user.name,
    from: mailConfig.emailFrom,
    host: mailConfig.canonicalHost
  };

  return mm.message('confirm-user-email')
    .then(function(msg) {
      return msg.sendMail(mailOpts);
    });
};
