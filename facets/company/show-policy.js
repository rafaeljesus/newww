var req = require('request');
var marked = require('marked');

module.exports = function (request, reply) {
  var opts = {
    user: request.auth.credentials
  };

  var timer = { start: Date.now() };

  var policy = request.params.policy || 'README';

  request.server.methods.corp.getPolicy(policy, function (err, content) {

    if (err) {
      return request.server.methods.errors.showError(request, reply)(err, 404, "could not find policy " + policy, opts);
    }

    opts.md = content;

    request.timing.page = 'policy-' + policy;
    request.metrics.metric({name: 'policy-' + policy});

    return reply.view('company/corporate', opts);
  });
}
