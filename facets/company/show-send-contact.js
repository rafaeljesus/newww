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

  var sendEmail = request.server.methods.email.send;

  sendEmail('contact-support', mail, request.redis)
    .catch(function (er) {
      request.logger.error('unable to send verification email');
      request.logger.error(er);
      return reply.view('errors/internal', opts).code(500);
    })
    .then(function () {
      opts.sent = true;
      return reply.view('company/contact', opts);
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

  zdClient.tickets.create(ticket, function (er, statusCode, result) {
    if (er || statusCode !== 201) {
      request.logger.error('unable to post ticket to zendesk');
      request.logger.error(er);
      return reply.view('errors/internal', {}).code(500);
    }
    return reply.view('company/contact', { sent: true }).code(200);
  });
}
