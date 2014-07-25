module.exports = function npmE (request, reply) {
  var timer = { start: Date.now() };

  var opts = {
    user: request.auth.credentials,
    hiring: request.server.methods.hiring.getRandomWhosHiring(),
    title: "npm Enterprise beta"
  };

  if (request.path.indexOf('thanks') !== -1) {
    timer.end = Date.now();
    request.server.methods.metrics.addPageLatencyMetric(timer, 'npme-beta-thanks');

    request.server.methods.metrics.addMetric({name: 'npme-beta-thanks'});

    return reply.view('npme-beta-thanks', opts);
  }

  timer.end = Date.now();
  request.server.methods.metrics.addPageLatencyMetric(timer, 'npme-beta');

  request.server.methods.metrics.addMetric({name: 'npme-beta'});
  return reply.view('npme-beta', opts);
}