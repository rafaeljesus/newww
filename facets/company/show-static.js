var metrics = require('newww-metrics')();

module.exports = function (type, text) {
  return function (request, reply) {
    var opts = { user: request.auth.credentials },
        timer = { start: Date.now() };

    opts.text = text;

    timer.end = Date.now();
    metrics.addPageLatencyMetric(timer, 'static-' + type);

    metrics.addMetric({name: 'static-' + type});

    reply.view('static', opts);
  };
};