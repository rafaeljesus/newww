var mailConfig = require('../../../config').user.mail,
  MustacheMailer = require('mustache-mailer'),
  tokenFacilitator = require('token-facilitator'),
  path = require('path');

module.exports = function(user, redis) {
  var mailOpts = {
    email: user.email,
    name: user.name,
    from: mailConfig.emailFrom,
    host: mailConfig.canonicalHost
  };

  var mm = new MustacheMailer({
    transport: require(mailConfig.mailTransportModule)(mailConfig.mailTransportSettings),
    templateDir: path.dirname(require.resolve('npm-email-templates/package.json')),
    tokenFacilitator: new tokenFacilitator({
      redis: redis
    })
  });

  return mm.message('confirm-user-email')
    .then(function(msg) {
      return msg.sendMail(mailOpts);
    });
};
