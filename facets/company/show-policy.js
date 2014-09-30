var req = require('request');
var marked = require('marked');
var metrics = require('newww-metrics')();

module.exports = function (request, reply) {
  var timer = { start: Date.now() };

  var policy = request.params.policy;

  var url = 'https://raw.githubusercontent.com/npm/policies/master/' + policy + '.md';

  req(url, function (er, resp, content) {

    if (er) {
      // this will get fixed with better error logging
      console.error('gah something broke');
    }

    var opts = {
      user: request.auth.credentials,
      hiring: request.server.methods.hiring.getRandomWhosHiring(),
      content: marked.parse(content)
    };

    timer.end = Date.now();
    metrics.addPageLatencyMetric(timer, 'policy-' + policy);
    metrics.addMetric({name: 'policy-' + policy});

    return reply.view('layouts/default', opts, {layout: false});
  });
}