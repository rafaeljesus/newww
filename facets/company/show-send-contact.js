
module.exports = function showSendContact(request, reply) {
  var opts = { };

  var data = request.payload;

  var mail = {
    to: data.inquire === "support" ? "support <support@npmjs.com>" : "npm <npm@npmjs.com>",
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