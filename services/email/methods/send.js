var log = require('bole')('email-send'),
    mailConfig = require('../../../config').user.mail,
    MustacheMailer = require('mustache-mailer'),
    tokenFacilitator = require('token-facilitator'),
    path = require('path'),
    _ = require('lodash');

module.exports = function send (template, data, redis) {

  var mailOpts = _.extend({}, {
    from: mailConfig.emailFrom,
    host: mailConfig.canonicalHost
  }, data);

  var mm = new MustacheMailer({
    transport: mailConfig.mailTransportModule,
    templateDir: path.dirname(require.resolve('npm-email-templates/package.json')),
    tokenFacilitator: new tokenFacilitator({redis: redis})
  });

  return mm.message(template)
    .then(function(msg) {
      return msg.sendMail(mailOpts);
    })
    .catch(function (err) {
      log.error('unable to send email to ' + mailOpts.email);
      log.error(err);
      throw err;
    });
};