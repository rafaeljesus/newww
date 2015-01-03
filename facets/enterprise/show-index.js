module.exports = function npmE (request, reply) {
  var opts = {
    user: request.auth.credentials,
    title: "npm Enterprise"
  };

  request.timing.page = 'enterprise';
  request.metrics.metric({name: 'enterprise'});
  return reply.view('enterprise/index', opts);
}
