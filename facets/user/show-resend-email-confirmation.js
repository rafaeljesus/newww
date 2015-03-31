
module.exports = function resendConfirmation (request, reply) {
  var sendEmail = request.server.methods.email.send,
      loggedInUser = request.loggedInUser,
      opts = { };

  sendEmail('confirm-user-email', loggedInUser, request.redis)
    .then(function() {
      request.logger.info('resent email confirmation to ' + loggedInUser.email);
      request.timing.page = 'resend-confirm-email';
      request.metrics.metric({name: 'resend-confirm-email'});

      return reply.redirect('/profile-edit?verification-email-sent=true');
    })
    .catch(function(er) {
      var message = 'Unable to resend email confirmation to ' + loggedInUser.email;

      request.logger.error(message);
      request.logger.error(er);

      request.timing.page = 'resend-confirm-email-error';
      request.metrics.metric({name: 'resend-confirm-email-error'});

      return reply.view('errors/internal', opts).code(500);
    });
};
