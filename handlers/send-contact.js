var sendEmail = require('../adapters/send-email');

var zdClient = require('node-zendesk').createClient({
  username: process.env.ZENDESK_USERNAME,
  token: process.env.ZENDESK_TOKEN,
  remoteUri: process.env.ZENDESK_URI,
  disableGlobalState: true
});

module.exports = function showSendContact(request, reply) {
  var opts = { };

  var data = request.payload;

  var recipient;
  switch (data.inquire) {
    case "support":
      createZendeskTicket(data, request, reply);
      return;
    case "security":
      recipient = "security <security@npmjs.com>";
      break;
    default:
      recipient = "npm <npm@npmjs.com>";
      break;
  }

  var mail = {
    to: recipient,
    subject: data.subject + " - FROM: " + '"' + data.name + '" <' + data.email + '>',
    text: data.message
  };

  sendEmail('contact-support', mail, request.redis)
    .then(function() {
      opts.sent = true;
      return reply.view('company/contact', opts);
    })
    .catch(function(err) {
      return reply(new VError(err, "unable to send verification email"));
    });
};

function createZendeskTicket(data, request, reply) {
  var ticket = {
    "ticket": {
      "requester": {
        "name": data.name,
        "email": data.email
      },
      "subject": data.subject,
      "comment": {
        "body": data.message
      }
    }
  };

  zdClient.tickets.create(ticket, function(err, statusCode, result) {
    if (err || statusCode !== 201) {
      return reply(new VError(err, "unable to post ticket to zendesk"));
    } else {
      return reply.view('company/contact', {
        sent: true
      });
    }
  });
}
