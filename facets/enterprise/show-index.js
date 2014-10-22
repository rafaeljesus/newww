var metrics = require('newww-metrics')();

module.exports = function npmE (request, reply) {
  var timer = { start: Date.now() };

  var opts = {
    user: request.auth.credentials,
    hiring: request.server.methods.hiring.getRandomWhosHiring(),
    title: "npm Enterprise"

  };

  timer.end = Date.now();
  metrics.addPageLatencyMetric(timer, 'enterprise');

  metrics.addMetric({name: 'enterprise'});
  return reply.view('enterprise/index', opts);
}