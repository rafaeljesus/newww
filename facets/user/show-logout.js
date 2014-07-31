module.exports = function logout (request, reply) {
  var delSession = request.server.methods.user.delSession(request),
      user = request.auth.credentials,
      addMetric = request.server.methods.metrics.addMetric,
      addLatencyMetric = request.server.methods.metrics.addPageLatencyMetric,
      timer = { start: Date.now() };

  delSession(user, function (er) {
    if (er) {
      var errId = uuid.v1();
      log.error(errId + ' ' + Hapi.error.internal('unable to delete session for logout'), user)

      var opts = { errId: errId };
      return reply.view('error', opts).code(500);
    }

    timer.end = Date.now();
    addLatencyMetric(timer, 'logout');

    addMetric({ name: 'logout' });
    return reply.redirect('/');
  });
}