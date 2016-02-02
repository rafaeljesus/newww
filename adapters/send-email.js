var log = require('bole')('email-send'),
  MustacheMailer = require('mustache-mailer'),
  tokenFacilitator = require('token-facilitator'),
  path = require('path'),
  _ = require('lodash');

var send = module.exports = function send(template, data, redis) {

  var mailOpts = _.extend({}, {
    from: "website@npmjs.com",
    host: process.env.CANONICAL_HOST,
    support_email: "support@npmjs.com",
  }, data);

  var mm = new MustacheMailer({
    transport: send.mailConfig.mailTransportModule,
    templateDir: path.dirname(require.resolve('npm-email-templates/package.json')),
    tokenFacilitator: new tokenFacilitator({
      redis: redis
    })
  });

  return mm.message(template)
    .then(function(msg) {
      return msg.sendMail(mailOpts);
    })
    .catch(function(err) {
      log.error('unable to send email to ' + mailOpts.email);
      log.error(err);
      throw err;
    });
};

send.mailConfig = {
  mailTransportModule: require("nodemailer-ses-transport")({
    accessKeyId: process.env.MAIL_ACCESS_KEY_ID,
    secretAccessKey: process.env.MAIL_SECRET_ACCESS_KEY,
    region: "us-west-2"
  }),
  emailFrom: 'support@npmjs.com'
};
