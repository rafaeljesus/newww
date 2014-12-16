module.exports = function logout (request, reply) {
  var delSession = request.server.methods.user.delSession(request),
      showError = request.server.methods.errors.showError(request, reply),
      user = request.auth.credentials;

  if (!user) return redirectToHome();

  delSession(user, function (er) {
    if (er) {
      return showError(er, 500, 'unable to delete session for logout for user ' + user.name, {namespace: 'user-logout'});
    }

    redirectToHome();
  });

  function redirectToHome () {
    request.timing.page = 'logout';
    request.matrics.metric({ name: 'logout' });

    return reply.redirect('/');
  }
}
