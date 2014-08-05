var metrics = require('../../adapters/metrics')();

module.exports = function npmE (request, reply) {
  var timer = { start: Date.now() };

  var opts = {
    user: request.auth.credentials,
    hiring: request.server.methods.hiring.getRandomWhosHiring(),
    title: "npm Enterprise beta"
  };

  if (request.path.indexOf('thanks') !== -1) {
    timer.end = Date.now();
    metrics.addPageLatencyMetric(timer, 'npme-beta-thanks');

    metrics.addMetric({name: 'npme-beta-thanks'});

    return reply.view('npme-beta-thanks', opts);
  }

  timer.end = Date.now();
  metrics.addPageLatencyMetric(timer, 'npme-beta');

  metrics.addMetric({name: 'npme-beta'});
  return reply.view('npme-beta', opts);
}