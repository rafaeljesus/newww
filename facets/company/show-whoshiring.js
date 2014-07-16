module.exports = function (request, reply) {
  var timer = { start: Date.now() };

  var opts = {
    user: request.auth.credentials,
    hiring: request.server.methods.getRandomWhosHiring(),
    companies: request.server.methods.getAllWhosHiring(),
    title: 'Who\'s Hiring'
  };

  timer.end = Date.now();
  request.server.methods.addPageLatencyMetric(timer, 'whoshiring');

  request.server.methods.addMetric({name: 'whoshiring'});

  reply.view('whoshiring', opts);
};