var metrics = require('newww-metrics')();

module.exports = function logout (request, reply) {
  var delSession = request.server.methods.user.delSession(request),
      showError = request.server.methods.errors.showError(reply),
      user = request.auth.credentials,
      addMetric = metrics.addMetric,
      addLatencyMetric = metrics.addPageLatencyMetric,
      timer = { start: Date.now() };

  if (!user) return redirectToHome();

  delSession(user, function (er) {
    if (er) {
      return showError(er, 500, 'unable to delete session for logout for user ' + user.name, {namespace: 'user-logout'});
    }

    redirectToHome();
  });

  function redirectToHome () {
    timer.end = Date.now();
    addLatencyMetric(timer, 'logout');

    addMetric({ name: 'logout' });
    return reply.redirect('/');
  }
}

