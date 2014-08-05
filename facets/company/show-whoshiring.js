var metrics = require('../../adapters/metrics')();

module.exports = function (request, reply) {
  var timer = { start: Date.now() };

  var opts = {
    user: request.auth.credentials,
    hiring: request.server.methods.hiring.getRandomWhosHiring(),
    companies: request.server.methods.hiring.getAllWhosHiring(),
    title: 'Who\'s Hiring'
  };

  timer.end = Date.now();
  metrics.addPageLatencyMetric(timer, 'whoshiring');

  metrics.addMetric({name: 'whoshiring'});

  reply.view('whoshiring', opts);
};