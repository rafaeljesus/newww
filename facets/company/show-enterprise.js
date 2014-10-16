var metrics = require('newww-metrics')();

module.exports = function npmE (request, reply) {
  var timer = { start: Date.now() };

  var opts = {
    user: request.auth.credentials,
    hiring: request.server.methods.hiring.getRandomWhosHiring(),
    title: "npm Enterprise"

  };

  if (request.path.indexOf('thanks') !== -1) {
    timer.end = Date.now();
    metrics.addPageLatencyMetric(timer, 'enterprise-thanks');

    metrics.addMetric({name: 'enterprise-thanks'});

    return reply.view('company/enterprise-thanks', opts);
  }

  timer.end = Date.now();
  metrics.addPageLatencyMetric(timer, 'enterprise');

  metrics.addMetric({name: 'enterprise'});
  return reply.view('company/enterprise', opts);
}