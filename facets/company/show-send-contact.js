
module.exports = function showSendContact(request, reply) {
  var opts = { };

  var data = request.payload;

  var mail = {
    to: data.inquire === "support" ? "support <support@npmjs.com>" : "npm <npm@npmjs.com>",
    from: "Support Contact Form <support@npmjs.com>",
    subject: data.subject + " - FROM: " + '"' + data.name + '" <' + data.email + '>',
    text: data.message
  };

  var sendEmail = request.server.methods.email.send;

  sendEmail(mail, function (er) {

    if (er) {
      request.logger.error('unable to send verification email');
      request.logger.error(er);
      return reply.view('errors/internal', opts).code(500);
    }

    if (process.env.NODE_ENV === 'dev') { opts.mail = JSON.stringify(mail); }

    opts.sent = true;
    return reply.view('company/contact', opts);
  });
};