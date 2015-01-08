module.exports = function logout (request, reply) {
  var delSession = request.server.methods.user.delSession(request),
      user = request.auth.credentials;

  if (!user) return redirectToHome();

  delSession(user, function (er) {
    if (er) {
      request.logger.warn('unable to delete session for user=' + user.name);
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
}
