var log = require('bole')('email-send'),
    MustacheMailer = require('mustache-mailer'),
    tokenFacilitator = require('token-facilitator'),
    path = require('path'),
    _ = require('lodash');

var mailConfig =  {
  mailTransportModule: require("nodemailer-ses-transport")({
    accessKeyId: process.env.MAIL_ACCESS_KEY_ID,
    secretAccessKey: process.env.MAIL_SECRET_ACCESS_KEY,
    region: "us-west-2"
  }),
  emailFrom: 'npm <support@npmjs.com>'
}

module.exports = function send (template, data, redis) {

  var mailOpts = _.extend({}, {
    from: "npm <support@npmjs.com>",
    host: process.env.CANONICAL_HOST
  }, data);

  var mm = new MustacheMailer({
    transport: require("nodemailer-ses-transport")({
      accessKeyId: process.env.MAIL_ACCESS_KEY_ID,
      secretAccessKey: process.env.MAIL_SECRET_ACCESS_KEY,
      region: "us-west-2"
    }),
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
