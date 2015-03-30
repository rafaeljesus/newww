module.exports = function logout (request, reply) {
  var delSession = request.server.methods.user.delSession(request),
      loggedInUser = request.auth.credentials;

  if (!loggedInUser) { return redirectToHome(); }

  delSession(loggedInUser, function (er) {
    if (er) {
      request.logger.warn('unable to delete session for user=' + loggedInUser.name);
      request.logger.warn(er);
      return reply.view('errors/internal', {}).code(500);
    }

    redirectToHome();
  });

  function redirectToHome () {
    request.timing.page = 'logout';
    request.metrics.metric({ name: 'logout' });

    return reply.redirect('/');
  }
};
