var metrics = require('../../adapters/metrics')();

module.exports = function fallbackHandler (request, reply) {
  var name = request.params.p,
      opts = { user: request.auth.credentials },
      timer = { start: Date.now() };

  request.server.methods.registry.getPackage(name, function (err, package) {

    if (package && !package.error) {
      reply.redirect('/package/' + package._id);
    }

    timer.end = Date.now();
    metrics.addPageLatencyMetric(timer, '404-not-found');

    metrics.addMetric({name: '404'});
    reply.view('notfound', opts).code(404);
  });
};